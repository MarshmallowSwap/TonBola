import { 
  Address, Cell, contractAddress, fromNano, 
  internal, SendMode, TonClient4, toNano, 
  WalletContractV4, beginCell, storeStateInit
} from "@ton/ton";
import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";
import { execSync } from "child_process";
import * as fs from "fs";

// ── API via curl (Node DNS non funziona in questo env) ────────
function curlGet(url: string): any {
  try {
    const out = execSync(`curl -sf --max-time 10 "${url}"`, { encoding: "utf-8" });
    return JSON.parse(out);
  } catch { return {}; }
}

function curlPost(url: string, body: string): any {
  try {
    const out = execSync(
      `curl -sf --max-time 15 -X POST -H "Content-Type: application/json" -d '${body.replace(/'/g, '"')}' "${url}"`,
      { encoding: "utf-8" }
    );
    return JSON.parse(out);
  } catch { return {}; }
}

async function getBalance(addr: string): Promise<bigint> {
  const d = curlGet(`https://testnet.tonapi.io/v2/accounts/${addr}`);
  return BigInt(d.balance ?? 0);
}

async function getStatus(addr: string): Promise<string> {
  const d = curlGet(`https://testnet.tonapi.io/v2/accounts/${addr}`);
  return d.status ?? "unknown";
}

// Invia TX via toncenter HTTP API (no client lib needed)
async function sendBoc(boc: string): Promise<boolean> {
  const body = JSON.stringify({ boc });
  const d = curlPost("https://testnet.toncenter.com/api/v2/sendBoc", body);
  return d.ok === true;
}

async function getSeqnoHttp(addr: string): Promise<number> {
  const d = curlGet(
    `https://testnet.toncenter.com/api/v2/runGetMethod?address=${addr}&method=seqno&stack=%5B%5D`
  );
  try {
    const stack = d.result?.stack ?? [];
    return parseInt(stack[0]?.[1] ?? "0", 16);
  } catch { return 0; }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("\n🚀 TonBola — Deploy Testnet");
  console.log("============================\n");

  const wf = JSON.parse(fs.readFileSync("build/deploy_wallet.json", "utf-8"));
  const kp: KeyPair = await mnemonicToPrivateKey(wf.mnemonic);
  const wallet = WalletContractV4.create({ publicKey: kp.publicKey, workchain: 0 });
  const addr = wallet.address.toString({ testOnly: true, bounceable: false });

  console.log(`Wallet: ${addr}`);
  const bal = await getBalance(addr);
  console.log(`Balance: ${fromNano(bal)} TON`);

  if (bal < toNano("0.4")) {
    console.log("❌ Serve almeno 0.4 TON testnet");
    process.exit(1);
  }
  console.log("✅ Balance OK\n");

  // ── Deploy function ────────────────────────────────────────
  async function deploy(name: string, pkgFile: string, initData: Cell): Promise<string> {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
    const code = Cell.fromBase64(pkg.code);
    const stateInit = { code, data: initData };
    const caddr    = contractAddress(0, stateInit);
    const caddrNB  = caddr.toString({ testOnly: true, bounceable: false });

    console.log(`📦 ${name}`);
    console.log(`   ${caddrNB}`);

    const status = await getStatus(caddrNB);
    if (status === "active") {
      console.log(`   ✅ Già deployato!\n`);
      return caddrNB;
    }

    // Get seqno
    const seqno = await getSeqnoHttp(addr);
    console.log(`   seqno: ${seqno}`);

    // Build and sign TX
    const transferMsg = wallet.createTransfer({
      secretKey: kp.secretKey,
      seqno,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: caddr,
          value: toNano("0.15"),
          init: stateInit,
          body: "deploy",
          bounce: false,
        })
      ],
    });

    const boc = transferMsg.toBoc().toString("base64");
    const sent = await sendBoc(boc);
    console.log(`   Sent: ${sent}`);

    // Wait for confirmation
    process.stdout.write("   ⏳ ");
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const st = await getStatus(caddrNB);
      if (st === "active" || st === "frozen") {
        const b = await getBalance(caddrNB);
        console.log(` ✅ ${st} (${fromNano(b)} TON)\n`);
        return caddrNB;
      }
      process.stdout.write("·");
    }
    console.log(`\n   ⚠️  https://testnet.tonscan.io/address/${caddrNB}\n`);
    return caddrNB;
  }

  const owner = wallet.address;

  // ── 1. MockUSDT ────────────────────────────────────────────
  const usdtData = beginCell()
    .storeAddress(owner).storeCoins(0).storeUint(0, 64)
    .endCell();

  const usdt = await deploy("MockUSDT (tUSDT)", "build/MockUSDT/MockUSDT_MockUSDT.pkg", usdtData);
  await sleep(5000);

  // ── 2. TonBolaVault ────────────────────────────────────────
  const ORACLE = BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729");
  const vaultData = beginCell()
    .storeAddress(owner).storeAddress(owner).storeAddress(owner)
    .storeAddress(owner).storeAddress(owner)
    .storeUint(ORACLE, 256)
    .storeUint(0, 64).storeCoins(0).storeCoins(0).storeCoins(0)
    .storeUint(0, 64).storeCoins(0)
    .endCell();

  const vault = await deploy("TonBolaVault (Split)", "build/TonBolaVault/TonBolaVault_TonBolaVault.pkg", vaultData);
  await sleep(5000);

  // ── 3. $TBOLA ──────────────────────────────────────────────
  const tbolaData = beginCell()
    .storeCoins(0).storeBit(true)
    .storeAddress(owner).storeAddress(owner).storeAddress(owner)
    .storeAddress(owner).storeAddress(owner).storeAddress(owner)
    .storeCoins(0).storeCoins(0).storeCoins(0)
    .storeCoins(0).storeCoins(0).storeCoins(0)
    .storeUint(0, 32).storeCoins(0)
    .endCell();

  const tbola = await deploy("$TBOLA Jetton", "build/TbolaJetton/TbolaJetton_TbolaJetton.pkg", tbolaData);

  // ── Save ───────────────────────────────────────────────────
  const result = {
    network: "testnet",
    deploy_wallet: addr,
    TESTNET_USDT_MASTER:   usdt,
    TESTNET_VAULT_ADDRESS: vault,
    TESTNET_TBOLA_MASTER:  tbola,
    deployed_at: new Date().toISOString()
  };
  fs.writeFileSync("build/deployed_testnet.json", JSON.stringify(result, null, 2));

  console.log(`
╔══════════════════════════════════════════╗
║   ✅  DEPLOY COMPLETATO!                 ║
╚══════════════════════════════════════════╝

MockUSDT  : ${usdt}
Vault     : ${vault}
$TBOLA    : ${tbola}

Explorer:
  https://testnet.tonscan.io/address/${usdt}
  https://testnet.tonscan.io/address/${vault}
  https://testnet.tonscan.io/address/${tbola}
  `);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
