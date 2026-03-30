/**
 * TonBolaVault — Script di Deploy su TON Mainnet
 * 
 * Prerequisiti:
 *   npm install @ton/core @ton/crypto @ton/ton
 * 
 * Usage:
 *   npx ts-node deploy.ts --network mainnet
 *   npx ts-node deploy.ts --network testnet
 */

import { Address, beginCell, contractAddress, fromNano, internal, toNano, TonClient, WalletContractV4 } from "@ton/ton";
import { KeyPair, mnemonicNew, mnemonicToPrivateKey, sign } from "@ton/crypto";

// ── CONFIGURAZIONE ────────────────────────────────────────────
const CONFIG = {
  // Wallet di destinazione split
  DEV_WALLET:          "UQAjEYy_1z4jP6zVMbZ0q5P4gHhSdXfNrF_C_Dg6TT",  // il tuo dev wallet
  TOKEN_FUND:          "", // da creare — nuovo wallet dedicato
  LEADERBOARD_WALLET:  "", // da creare — nuovo wallet dedicato
  PLATFORM_WALLET:     "UQAr0sQ_Eh3Y_zC_",  // il tuo platform wallet

  // Percentuali split (basis points, 10000 = 100%)
  SPLIT: {
    PRIZE_POOL: 5500,  // 55% rimane nel contratto
    DEV:        3200,  // 32% → dev wallet
    TOKEN:      800,   // 8%  → token fund
    LEADERBOARD: 300,  // 3%  → leaderboard wallet
    PLATFORM:   200,   // 2%  → platform wallet
  }
}

// ── Genera keypair Oracle ─────────────────────────────────────
async function generateOracleKey() {
  const mnemonic = await mnemonicNew(24);
  const keyPair  = await mnemonicToPrivateKey(mnemonic);
  
  console.log("\n🔐 ORACLE KEYPAIR GENERATO — SALVA SUBITO:");
  console.log("Mnemonic (SEGRETO):", mnemonic.join(" "));
  console.log("Public Key (hex):", keyPair.publicKey.toString("hex"));
  console.log("Secret Key (hex):", keyPair.secretKey.toString("hex"));
  
  return keyPair;
}

// ── Firma messaggio per PayWinner ─────────────────────────────
function signPayWinner(
  winner: Address,
  amount: bigint,
  gameId: bigint,
  nonce: bigint,
  secretKey: Buffer
): Buffer {
  const cell = beginCell()
    .storeAddress(winner)
    .storeCoins(amount)
    .storeUint(gameId, 64)
    .storeUint(nonce, 64)
    .endCell();
  
  return sign(cell.hash(), secretKey);
}

// ── Firma messaggio per PayJackpot ────────────────────────────
function signPayJackpot(
  winner: Address,
  poolId: number,
  nonce: bigint,
  secretKey: Buffer
): Buffer {
  const cell = beginCell()
    .storeAddress(winner)
    .storeUint(poolId, 8)
    .storeUint(nonce, 64)
    .endCell();
  
  return sign(cell.hash(), secretKey);
}

// ── Esempio di chiamata PayWinner dal backend ─────────────────
async function examplePayWinner() {
  // Questo va nel backend FastAPI su Hetzner
  const ORACLE_SECRET = Buffer.from(process.env.ORACLE_SECRET_KEY!, "hex");
  const CONTRACT_ADDR = Address.parse(process.env.CONTRACT_ADDRESS!);
  
  const winner  = Address.parse("EQ_winner_telegram_wallet_address");
  const amount  = toNano("0.275"); // 55% di 0.5 TON
  const gameId  = BigInt(12345);
  const nonce   = BigInt(Date.now()); // timestamp come nonce unico
  
  const signature = signPayWinner(winner, amount, gameId, nonce, ORACLE_SECRET);
  
  // Costruisci il messaggio PayWinner
  const body = beginCell()
    .storeUint(0x1234ABCD, 32)  // op code PayWinner
    .storeAddress(winner)
    .storeCoins(amount)
    .storeUint(gameId, 64)
    .storeUint(nonce, 64)
    .storeSlice(beginCell().storeBuffer(signature).endCell().asSlice())
    .endCell();
  
  console.log("PayWinner body:", body.toBoc().toString("hex"));
  // → Invia questa TX al contratto dal backend
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("🏗️  TonBolaVault — Deploy Tool");
  console.log("================================\n");
  
  const args = process.argv.slice(2);
  const network = args.includes("--testnet") ? "testnet" : "mainnet";
  
  console.log(`📡 Network: ${network}`);
  console.log(`✅ Split configurato:`);
  console.log(`   Prize Pool: ${CONFIG.SPLIT.PRIZE_POOL/100}% (rimane nel contratto)`);
  console.log(`   Dev:        ${CONFIG.SPLIT.DEV/100}% → ${CONFIG.DEV_WALLET.slice(0,8)}...`);
  console.log(`   Token Fund: ${CONFIG.SPLIT.TOKEN/100}%`);
  console.log(`   Leaderboard:${CONFIG.SPLIT.LEADERBOARD/100}%`);
  console.log(`   Platform:   ${CONFIG.SPLIT.PLATFORM/100}% → ${CONFIG.PLATFORM_WALLET.slice(0,8)}...`);
  
  if (args.includes("--gen-oracle-key")) {
    await generateOracleKey();
    return;
  }
  
  console.log("\n📋 Prossimi step:");
  console.log("1. Installa dipendenze: npm install @ton/core @ton/crypto @ton/ton");
  console.log("2. Compila il contratto con Blueprint: npx blueprint build");
  console.log("3. Genera oracle key: npx ts-node deploy.ts --gen-oracle-key");
  console.log("4. Deploy: npx blueprint run --network mainnet");
}

main().catch(console.error);

export { signPayWinner, signPayJackpot, CONFIG };
