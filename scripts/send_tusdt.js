const { Address, beginCell, external, fromNano, internal,
        SendMode, storeMessage, toNano, WalletContractV4 } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");
const { execSync } = require("child_process");
const fs = require("fs");

const MOCK_USDT = Address.parse("0QCfks9Ila5ZRRMUw5Y75-PVpiXbiQ1QwZNRYE_Aohq_d7hH");
const RECIPIENT = Address.parse(process.argv[2]);
const TONAPI    = "https://testnet.tonapi.io/v2";

function curl(u) {
  try { return JSON.parse(execSync(`curl -sf --max-time 12 "${u}"`, {encoding:"utf-8"})); }
  catch(e) { return {}; }
}

// Usa tonapi per inviare il BOC
function sendBoc(boc) {
  fs.writeFileSync("/tmp/payload.json", JSON.stringify({boc}));
  try {
    const o = execSync(
      `curl -sf --max-time 15 -X POST -H 'Content-Type: application/json' ` +
      `-d @/tmp/payload.json "${TONAPI}/blockchain/message"`,
      {encoding:"utf-8"}
    );
    // tonapi restituisce {} in caso di successo
    return {ok: true, raw: o};
  } catch(e) {
    return {ok: false, error: e.stderr?.toString().slice(0,100)};
  }
}

// Seqno da tonapi
function getSeqno(addr) {
  const addrStr = addr.toString({testOnly:true, bounceable:false});
  const d = curl(`${TONAPI}/accounts/${addrStr}/methods/seqno`);
  try {
    const stack = d.decoded ?? d.stack ?? [];
    if (Array.isArray(stack) && stack.length > 0) {
      return Number(stack[0].num ?? stack[0] ?? 0);
    }
    // Fallback: leggi dalle TX
    const txs = curl(`${TONAPI}/accounts/${addrStr}/transactions?limit=1`);
    return txs.transactions?.length ?? 0;
  } catch { return 0; }
}

function buildBoc(wallet, kp, seqno, messages) {
  const transfer = wallet.createTransfer({
    secretKey: kp.secretKey, seqno,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages
  });
  const ext = external({
    to: wallet.address,
    init: seqno === 0 ? wallet.init : undefined,
    body: transfer
  });
  return beginCell().store(storeMessage(ext)).endCell().toBoc().toString("base64");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const recipientStr = RECIPIENT.toString({testOnly:true, bounceable:false});
  console.log(`\n🎯 Destinatario: ${recipientStr}`);

  const wf = JSON.parse(fs.readFileSync("build/wallet.json","utf-8"));
  const kp = await mnemonicToPrivateKey(wf.mnemonic);
  const wallet = WalletContractV4.create({publicKey: kp.publicKey, workchain: 0});
  const waddrStr = wallet.address.toString({testOnly:true, bounceable:false});

  const info = curl(`${TONAPI}/accounts/${waddrStr}`);
  const bal  = BigInt(info.balance ?? 0);
  console.log(`Deploy wallet: ${fromNano(bal)} TON (${info.status})`);

  // Seqno: conto le TX in uscita
  const txs = curl(`${TONAPI}/accounts/${waddrStr}/transactions?limit=10`);
  const seqno = (txs.transactions ?? []).filter(t => t.out_msgs?.length > 0).length;
  console.log(`Seqno stimato: ${seqno}\n`);

  // ── Step 1: Faucet → 1000 tUSDT al deploy wallet ─────────
  console.log("📤 Step 1: Faucet tUSDT...");
  const boc1 = buildBoc(wallet, kp, seqno, [
    internal({ to: MOCK_USDT, value: toNano("0.12"), bounce: false })
  ]);
  const r1 = sendBoc(boc1);
  console.log(`   ${r1.ok ? "✅ TX inviata" : "⚠️ " + JSON.stringify(r1)}`);

  console.log("   ⏳ Attendo 35s...");
  await sleep(35000);

  // ── Step 2: Transfer tUSDT → recipient ───────────────────
  console.log("📤 Step 2: Transfer tUSDT al destinatario...");

  // Jetton wallet del deploy wallet per MockUSDT
  // Format: get_wallet_address via tonapi
  const gwRes = curl(
    `${TONAPI}/accounts/${MOCK_USDT.toString({testOnly:true})}/methods/get_wallet_address?args=${encodeURIComponent(waddrStr)}`
  );

  let jwalletAddr;
  try {
    const raw = gwRes.decoded?.[0] ?? gwRes.stack?.[0];
    jwalletAddr = Address.parse(raw?.cell_hash ?? raw ?? "");
  } catch {}

  if (!jwalletAddr) {
    // Fallback: calcola deterministicamente (storeUint(0,1) + owner + master)
    console.log("   ⚠️ Jetton wallet non trovato via API, calcolo manuale...");
    // Leggo il pkg per avere il code
    if (fs.existsSync("build/MockUSDT/MockUSDT_MockUSDTWallet.pkg")) {
      const { Cell, contractAddress } = require("@ton/ton");
      const wpkg = JSON.parse(fs.readFileSync("build/MockUSDT/MockUSDT_MockUSDTWallet.pkg","utf-8"));
      const wcode = Cell.fromBase64(wpkg.code);
      const wdata = beginCell()
        .storeUint(0,1)
        .storeAddress(wallet.address)
        .storeAddress(MOCK_USDT)
        .endCell();
      jwalletAddr = contractAddress(0, {code: wcode, data: wdata});
      console.log(`   Jetton wallet: ${jwalletAddr.toString({testOnly:true, bounceable:true})}`);
    } else {
      console.log("   ❌ PKG non trovato. Assicurati di essere in /root/tbola");
      return;
    }
  }

  // JettonTransfer body
  const transferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(1000_000_000n)  // 1000 tUSDT
    .storeAddress(RECIPIENT)
    .storeAddress(wallet.address)
    .storeBit(false)
    .storeCoins(toNano("0.01"))
    .storeBit(false)
    .endCell();

  const boc2 = buildBoc(wallet, kp, seqno + 1, [
    internal({ to: jwalletAddr, value: toNano("0.06"), bounce: true, body: transferBody })
  ]);
  const r2 = sendBoc(boc2);
  console.log(`   ${r2.ok ? "✅ TX inviata!" : "⚠️ " + JSON.stringify(r2)}`);

  console.log("   ⏳ Attendo 20s...");
  await sleep(20000);

  const check = curl(`${TONAPI}/accounts/${recipientStr}/transactions?limit=3`);
  const count = check.transactions?.length ?? 0;
  console.log(`\n${count > 0 ? "✅" : "⏳"} TX sul wallet destinatario: ${count}`);
  console.log(`\n🔍 https://testnet.tonscan.io/address/${recipientStr}`);
}

main().catch(e => console.error("❌", e.message));
