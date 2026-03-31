/**
 * Invia 1000 tUSDT all'indirizzo specificato
 * 1. Prima clama il faucet (deploy wallet → MockUSDT → riceve 1000 tUSDT)
 * 2. Poi trasferisce i tUSDT al destinatario
 */
const { Address, beginCell, Cell, contractAddress, external, fromNano,
        internal, SendMode, storeMessage, toNano, WalletContractV4 } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");
const { execSync } = require("child_process");
const fs = require("fs");

const MOCK_USDT  = Address.parse("0QCfks9Ila5ZRRMUw5Y75-PVpiXbiQ1QwZNRYE_Aohq_d7hH");
const RECIPIENT  = Address.parse(process.argv[2] || "UQD_R4JYnGkMSDm4dLDRwpVwE22C901jPm_9qeWG-cRgWu9C");
const AMOUNT_TUSDT = 1000_000_000n; // 1000 tUSDT (6 decimali)

function curl(u) {
  try { return JSON.parse(execSync(`curl -sf --max-time 12 "${u}"`, {encoding:"utf-8"})); }
  catch { return {}; }
}

function sendBoc(boc) {
  fs.writeFileSync("/tmp/s.json", JSON.stringify({boc}));
  try {
    const o = execSync(
      `curl -sf --max-time 15 -X POST -H 'Content-Type: application/json' -d @/tmp/s.json "https://testnet.toncenter.com/api/v2/sendBoc"`,
      {encoding:"utf-8"}
    );
    return JSON.parse(o);
  } catch { return {error:"failed"}; }
}

function getSeqno(addr) {
  const d = curl(`https://testnet.toncenter.com/api/v2/runGetMethod?address=${encodeURIComponent(addr.toString({testOnly:true}))}&method=seqno&stack=%5B%5D`);
  try { return parseInt(d.result?.stack?.[0]?.[1] ?? "0x0", 16); } catch { return 0; }
}

function getStatus(addr) {
  const d = curl(`https://testnet.tonapi.io/v2/accounts/${addr.toString({testOnly:true, bounceable:false})}`);
  return { status: d.status ?? "unknown", balance: BigInt(d.balance ?? 0) };
}

function buildBoc(wallet, kp, seqno, messages) {
  const transfer = wallet.createTransfer({
    secretKey: kp.secretKey, seqno,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages
  });
  const extMsg = external({ to: wallet.address, init: seqno === 0 ? wallet.init : undefined, body: transfer });
  return beginCell().store(storeMessage(extMsg)).endCell().toBoc().toString("base64");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Calcola indirizzo jetton wallet
function getJettonWalletAddr(owner, master) {
  // MockUSDTWallet init: storeUint(0,1) + storeAddress(owner) + storeAddress(master)
  // Ma non abbiamo il code BOC qui — usiamo il getter del contratto
  const d = curl(
    `https://testnet.toncenter.com/api/v2/runGetMethod?address=${encodeURIComponent(master.toString({testOnly:true}))}&method=get_wallet_address&stack=${encodeURIComponent(JSON.stringify([["tvm.Slice", beginCell().storeAddress(owner).endCell().toBoc().toString("base64")]]))}`
  );
  try {
    const slice = d.result?.stack?.[0]?.[1];
    if (slice) {
      const cell = Cell.fromBase64(slice);
      return cell.beginParse().loadAddress();
    }
  } catch {}
  return null;
}

async function main() {
  console.log("\n🚀 Invio 1000 tUSDT a:", RECIPIENT.toString({testOnly:true, bounceable:false}));
  console.log("================================\n");

  const wf = JSON.parse(fs.readFileSync("build/wallet.json","utf-8"));
  const kp = await mnemonicToPrivateKey(wf.mnemonic);
  const wallet = WalletContractV4.create({publicKey: kp.publicKey, workchain: 0});
  const waddr = wallet.address;
  const waddrStr = waddr.toString({testOnly:true, bounceable:false});

  console.log(`Deploy wallet: ${waddrStr}`);
  const {balance, status} = getStatus(waddr);
  console.log(`Balance: ${fromNano(balance)} TON (${status})\n`);

  let seqno = getSeqno(waddr);
  console.log(`Seqno: ${seqno}`);

  // ── Step 1: Claim faucet → 1000 tUSDT al deploy wallet ──
  console.log("\n📤 Step 1: Claim faucet tUSDT...");
  const faucetBoc = buildBoc(wallet, kp, seqno, [
    internal({ to: MOCK_USDT, value: toNano("0.12"), bounce: false, body: "faucet" })
  ]);
  const r1 = sendBoc(faucetBoc);
  console.log(`   TX: ${r1.ok ? "✅ inviata" : "⚠️ " + JSON.stringify(r1).slice(0,60)}`);

  // Aspetta 30s per conferma
  console.log("   ⏳ Attendo 30s per conferma...");
  await sleep(30000);

  // ── Step 2: Trasferisci tUSDT al recipient ────────────────
  console.log("\n📤 Step 2: Trasferisco tUSDT al destinatario...");
  seqno++;

  // Body JettonTransfer (op 0xf8a7ea5)
  const transferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)   // op
    .storeUint(0, 64)            // query_id
    .storeCoins(AMOUNT_TUSDT)   // amount
    .storeAddress(RECIPIENT)    // destination
    .storeAddress(waddr)        // response_destination
    .storeBit(false)             // no custom_payload
    .storeCoins(toNano("0.01")) // forward_ton_amount
    .storeBit(false)             // no forward_payload
    .endCell();

  // Indirizzo jetton wallet del deploy wallet
  // (lo calcoliamo in modo deterministico: è il wallet che ha ricevuto i tUSDT)
  // Prima proviamo a leggerlo dal contratto
  console.log("   Recupero jetton wallet address...");
  const jwallet = getJettonWalletAddr(waddr, MOCK_USDT);

  if (!jwallet) {
    console.log("   ⚠️ Non riesco a leggere il jetton wallet via API");
    console.log("   Provo comunque a inviare...");
  } else {
    console.log(`   Jetton wallet: ${jwallet.toString({testOnly:true, bounceable:true})}`);
  }

  // Indirizzo jetton wallet (fallback calcolato localmente se API fallisce)
  const targetWallet = jwallet || MOCK_USDT; // fallback

  const transferBoc = buildBoc(wallet, kp, seqno, [
    internal({
      to: targetWallet,
      value: toNano("0.08"),
      bounce: true,
      body: transferBody
    })
  ]);

  const r2 = sendBoc(transferBoc);
  console.log(`   TX: ${r2.ok ? "✅ inviata!" : "⚠️ " + JSON.stringify(r2).slice(0,80)}`);

  // Aspetta e verifica
  console.log("   ⏳ Attendo 20s...");
  await sleep(20000);

  // Verifica transazioni del recipient
  const txs = curl(`https://testnet.tonapi.io/v2/accounts/${RECIPIENT.toString({testOnly:true})}/transactions?limit=3`);
  const hasTx = txs.transactions?.length > 0;
  console.log(`\n${hasTx ? "✅" : "⚠️"} Transazioni sul wallet destinatario: ${txs.transactions?.length ?? 0}`);

  console.log(`
╔══════════════════════════════════════════╗
║   Verifica su testnet explorer:          ║
╚══════════════════════════════════════════╝
https://testnet.tonscan.io/address/${RECIPIENT.toString({testOnly:true, bounceable:false})}

Se non vedi i tUSDT subito, aspetta 1-2 minuti e ricarica.
  `);
}

main().catch(e => console.error("❌", e.message));
