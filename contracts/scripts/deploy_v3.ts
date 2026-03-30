/**
 * Deploy usando i wrapper Tact generati (formato init corretto)
 * HTTP calls via curl (Node DNS non funziona in questo env)
 */
import { Address, fromNano, internal, SendMode, toNano, WalletContractV4, beginCell } from "@ton/ton";
import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";
import { execSync } from "child_process";
import * as fs from "fs";

// Import generated contract wrappers
import { MockUSDT } from "../build/MockUSDT/MockUSDT_MockUSDT";
import { TonBolaVault } from "../build/TonBolaVault/TonBolaVault_TonBolaVault";
import { TbolaJetton } from "../build/TbolaJetton/TbolaJetton_TbolaJetton";

function curl(url: string): any {
  try {
    const o = execSync(`curl -sf --max-time 12 "${url}"`, { encoding: "utf-8" });
    return JSON.parse(o);
  } catch { return {}; }
}

function curlPost(url: string, data: string): any {
  try {
    const escaped = data.replace(/'/g, "'\"'\"'");
    const o = execSync(
      `curl -sf --max-time 15 -X POST -H 'Content-Type: application/json' -d '${escaped}' "${url}"`,
      { encoding: "utf-8" }
    );
    return JSON.parse(o);
  } catch(e: any) { 
    console.log("  curl post error:", e.message?.slice(0, 100));
    return {}; 
  }
}

async function getStatus(addr: string) {
  const d = curl(`https://testnet.tonapi.io/v2/accounts/${addr}`);
  return { status: d.status ?? "unknown", balance: BigInt(d.balance ?? 0) };
}

function getSeqno(addr: string): number {
  const d = curl(`https://testnet.toncenter.com/api/v2/runGetMethod?address=${addr}&method=seqno&stack=%5B%5D`);
  try {
    const s = d.result?.stack ?? [];
    return parseInt(s[0]?.[1] ?? "0x0", 16);
  } catch { return 0; }
}

function sendBoc(boc: string): boolean {
  const body = `{"boc":"${boc}"}`;
  const d = curlPost("https://testnet.toncenter.com/api/v2/sendBoc", body);
  console.log("  toncenter response:", JSON.stringify(d).slice(0, 80));
  return d.ok === true || d.result !== undefined;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("\n🚀 TonBola — Deploy Testnet v3");
  console.log("================================\n");

  const wf = JSON.parse(fs.readFileSync("build/deploy_wallet.json", "utf-8"));
  const kp: KeyPair = await mnemonicToPrivateKey(wf.mnemonic);
  const wallet = WalletContractV4.create({ publicKey: kp.publicKey, workchain: 0 });
  const waddr = wallet.address.toString({ testOnly: true, bounceable: false });
  
  console.log(`Wallet: ${waddr}`);
  const { status: ws, balance: wb } = await getStatus(waddr);
  console.log(`Balance: ${fromNano(wb)} TON  status: ${ws}`);

  if (wb < toNano("0.4")) { console.log("❌ Serve almeno 0.4 TON"); process.exit(1); }
  console.log("✅ OK\n");

  const owner = wallet.address;
  const seqno = getSeqno(waddr);
  console.log(`Seqno: ${seqno}\n`);

  async function deploy(
    name: string,
    init: { code: any; data: any },
    caddr: Address,
    mySeqno: number
  ): Promise<string> {
    const caddrStr = caddr.toString({ testOnly: true, bounceable: false });
    console.log(`📦 ${name}`);
    console.log(`   ${caddrStr}`);

    const { status } = await getStatus(caddrStr);
    if (status === "active") {
      console.log(`   ✅ Già deployato!\n`);
      return caddrStr;
    }

    const tx = wallet.createTransfer({
      secretKey: kp.secretKey,
      seqno: mySeqno,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: caddr,
          value: toNano("0.15"),
          init,
          body: "deploy",
          bounce: false,
        })
      ],
    });

    const boc = tx.toBoc().toString("base64");
    const sent = sendBoc(boc);
    console.log(`   TX sent: ${sent}`);

    process.stdout.write("   ⏳ ");
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const { status: st, balance: b } = await getStatus(caddrStr);
      if (st === "active" || st === "frozen") {
        console.log(` ✅ ${st} (${fromNano(b)} TON)\n`);
        return caddrStr;
      }
      process.stdout.write("·");
    }
    console.log(`\n   ⚠️ Check: https://testnet.tonscan.io/address/${caddrStr}\n`);
    return caddrStr;
  }

  // Use generated wrappers to get correct stateInit
  const usdtInit  = await MockUSDT.fromInit(owner);
  const ORACLE = BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729");
  const vaultInit = await TonBolaVault.fromInit(owner, owner, owner, owner, ORACLE);
  const tbolaInit = await TbolaJetton.fromInit(owner, owner, owner, owner, owner, owner);

  const usdtAddr  = usdtInit.address;
  const vaultAddr = vaultInit.address;
  const tbolaAddr = tbolaInit.address;

  // Deploy all 3 with incrementing seqno
  const usdt  = await deploy("MockUSDT (tUSDT)", usdtInit.init!, usdtAddr, seqno);
  await sleep(6000);
  const vault = await deploy("TonBolaVault", vaultInit.init!, vaultAddr, seqno + 1);
  await sleep(6000);
  const tbola = await deploy("$TBOLA Jetton", tbolaInit.init!, tbolaAddr, seqno + 2);

  // Save
  const result = {
    TESTNET_USDT_MASTER:   usdt,
    TESTNET_VAULT_ADDRESS: vault,
    TESTNET_TBOLA_MASTER:  tbola,
    deployed_at: new Date().toISOString()
  };
  fs.writeFileSync("build/deployed_testnet.json", JSON.stringify(result, null, 2));

  console.log(`
╔══════════════════════════════════════╗
║   ✅  DEPLOY COMPLETATO!             ║
╚══════════════════════════════════════╝
MockUSDT : ${usdt}
Vault    : ${vault}
$TBOLA   : ${tbola}

https://testnet.tonscan.io/address/${usdt}
https://testnet.tonscan.io/address/${vault}
https://testnet.tonscan.io/address/${tbola}
  `);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
