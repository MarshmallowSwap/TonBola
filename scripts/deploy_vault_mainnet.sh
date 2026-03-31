#!/bin/bash
# Deploy TonBolaVault su MAINNET
# Esegui sul VPS: bash deploy_vault_mainnet.sh
set -e
DIR="/root/tbola"
mkdir -p $DIR/build
cd $DIR

echo "🚀 TonBola — Deploy Vault MAINNET"
echo "=================================="
echo "⚠️  Questo usa TON REALI!"
echo ""

# Usa il package.json già esistente da testnet
if [ ! -f node_modules/.bin/tact ]; then
  echo "📦 Installing deps..."
  npm install --legacy-peer-deps 2>&1 | tail -3
fi

# Il contratto vault è già compilato da testnet
# Verifica che il PKG esista
if [ ! -f "build/TonBolaVault/TonBolaVault_TonBolaVault.pkg" ]; then
  echo "❌ PKG non trovato. Esegui prima deploy_testnet_vps.sh"
  exit 1
fi

cat > deploy_mainnet_vault.ts << 'TSEOF'
import { Address, Cell, contractAddress, fromNano, internal,
         SendMode, toNano, WalletContractV4, beginCell,
         external, storeMessage } from "@ton/ton";
import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";
import { execSync } from "child_process";
import * as fs from "fs";

// ── WALLET REALI MAINNET ──────────────────────────────────
const WALLETS = {
  DEV:         "UQAjEYySoQTi15oQCNCdCoIT45WLV9FKKl_oi5VK2wZtg6TT",  // 32%
  TOKEN_FUND:  "UQBhsVRbxIv0g_3YmL2p_MFFsxUTCXXLwWf_hBKQF57Ztrjf",  // 8%
  LEADERBOARD: "UQCwjv61TRzu4dpmg3gpUEBvB8mnjYOtm1-ezGwpSWqUL0xB",  // 3%
  PLATFORM:    "UQAr0sQHQfrE4vfaoNCaTGJ2OtkUwRWmSxF-_6rAiEmTBzC_",  // 2%
};
const ORACLE_PK = BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729");

function curl(u: string): any {
  try { return JSON.parse(execSync(`curl -sf --max-time 12 "${u}"`, {encoding:"utf-8"})); }
  catch { return {}; }
}
function sendBoc(boc: string): boolean {
  fs.writeFileSync("/tmp/mv.json", JSON.stringify({boc}));
  try {
    execSync(`curl -sf --max-time 15 -X POST -H 'Content-Type: application/json' -d @/tmp/mv.json "https://toncenter.com/api/v2/sendBoc"`, {encoding:"utf-8"});
    return true;
  } catch { return false; }
}
function getSeqno(addr: string): number {
  // Mainnet seqno via tonapi
  const d = curl(`https://tonapi.io/v2/accounts/${addr}`);
  try {
    const r = curl(`https://toncenter.com/api/v2/runGetMethod?address=${encodeURIComponent(addr)}&method=seqno&stack=%5B%5D`);
    return parseInt(r.result?.stack?.[0]?.[1] ?? "0x0", 16);
  } catch { return 0; }
}
function getStatus(addr: string) {
  const d = curl(`https://tonapi.io/v2/accounts/${addr}`);
  return { status: d.status ?? "unknown", balance: BigInt(d.balance ?? 0) };
}
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("\n🚀 TonBolaVault — Deploy Mainnet");
  console.log("==================================");
  console.log("⚠️  MAINNET — TON REALI!\n");

  // Load deploy wallet (stesso seed phrase del testnet)
  const wf = JSON.parse(fs.readFileSync("build/wallet.json","utf-8"));
  const kp: KeyPair = await mnemonicToPrivateKey(wf.mnemonic);
  const wallet = WalletContractV4.create({publicKey: kp.publicKey, workchain: 0});
  const waddr = wallet.address.toString({bounceable: false});

  console.log(`Deploy wallet: ${waddr}`);
  const { balance: bal, status } = getStatus(waddr);
  console.log(`Balance: ${fromNano(bal)} TON (${status})`);

  if (bal < toNano("0.5")) {
    console.log(`\n❌ Serve almeno 0.5 TON sul wallet deploy.`);
    console.log(`Invia TON a: ${waddr}`);
    process.exit(1);
  }

  console.log("\n📋 Wallet configurati:");
  Object.entries(WALLETS).forEach(([k,v]) => console.log(`  ${k}: ${v.slice(0,8)}...${v.slice(-4)}`));

  // Build init data con wallet reali
  const devAddr  = Address.parse(WALLETS.DEV);
  const tokAddr  = Address.parse(WALLETS.TOKEN_FUND);
  const lbAddr   = Address.parse(WALLETS.LEADERBOARD);
  const pfAddr   = Address.parse(WALLETS.PLATFORM);

  const vaultData = beginCell()
    .storeUint(0, 1)
    .storeAddress(devAddr)   // dev_wallet
    .storeAddress(tokAddr)   // token_fund
    .storeAddress(lbAddr)    // leaderboard_wallet
    .storeRef(beginCell().storeAddress(pfAddr).storeInt(ORACLE_PK, 257).endCell())
    .endCell();

  const pkg = JSON.parse(fs.readFileSync("build/TonBolaVault/TonBolaVault_TonBolaVault.pkg","utf-8"));
  const code = Cell.fromBase64(pkg.code);
  const stateInit = { code, data: vaultData };
  const caddr = contractAddress(0, stateInit);
  const caddrStr = caddr.toString({ bounceable: true });
  const caddrNB  = caddr.toString({ bounceable: false });

  console.log(`\n📦 TonBolaVault (Mainnet)`);
  console.log(`   ${caddrNB}`);

  // Already deployed?
  const { status: cs } = getStatus(caddrNB);
  if (cs === "active") {
    console.log("   ✅ Già deployato!");
    saveResult(caddrNB);
    return;
  }

  // Get seqno
  const seqno = getSeqno(waddr);
  console.log(`   Seqno: ${seqno}`);

  // Build external message
  const tx = wallet.createTransfer({
    secretKey: kp.secretKey, seqno,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [internal({ to: caddr, value: toNano("0.3"), init: stateInit, body: "deploy", bounce: false })]
  });
  const extMsg = external({ to: wallet.address, init: seqno === 0 ? wallet.init : undefined, body: tx });
  const boc = beginCell().store(storeMessage(extMsg)).endCell().toBoc().toString("base64");
  fs.writeFileSync("/tmp/mv.json", JSON.stringify({boc}));

  const sent = execSync(`curl -sf --max-time 15 -X POST -H 'Content-Type: application/json' -d @/tmp/mv.json "https://tonapi.io/v2/blockchain/message"`, {encoding:"utf-8"});
  console.log("   TX inviata ✅");

  process.stdout.write("   ⏳ ");
  for (let i = 0; i < 40; i++) {
    await sleep(3000);
    const { status: st, balance: b } = getStatus(caddrNB);
    if (st === "active" || st === "frozen") {
      console.log(` ✅ ${st} (${fromNano(b)} TON)`);
      saveResult(caddrNB);
      return;
    }
    process.stdout.write("·");
  }
  console.log(`\n   ⚠️ Timeout. Controlla: https://tonscan.io/address/${caddrNB}`);
  saveResult(caddrNB);
}

function saveResult(addr: string) {
  const result = { MAINNET_VAULT_ADDRESS: addr, deployed_at: new Date().toISOString() };
  fs.writeFileSync("build/mainnet_vault.json", JSON.stringify(result, null, 2));
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  TonBolaVault Mainnet               ║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log(`Address: ${addr}`);
  console.log(`🔍 https://tonscan.io/address/${addr}`);
  console.log(`\n👉 Aggiorna il frontend:`);
  console.log(`   MAINNET_VAULT_ADDRESS = '${addr}'`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
TSEOF

echo ""
echo "✅ Script pronto: deploy_mainnet_vault.ts"
echo ""
echo "⚠️  Per il deploy mainnet, il wallet deploy (stesso del testnet)"
echo "   DEVE avere TON mainnet reali."
echo ""
echo "Wallet deploy: 0QDVBppwXMmVP5HAcGzBW-8YVafY1qRNrYLR4MVY4svKtI-d"
echo ""
echo "1. Invia 0.5 TON a quell'indirizzo da @wallet Telegram"  
echo "2. Poi esegui: npx ts-node --transpile-only deploy_mainnet_vault.ts"
