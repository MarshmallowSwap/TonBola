/**
 * Deploy tutti i contratti su testnet via CLI
 * Genera un wallet testnet nuovo, chiede TON dal faucet, deploya tutto
 * 
 * Usage: npx ts-node scripts/deploy_all_testnet.ts
 */

import { 
  Address, Cell, contractAddress, fromNano, internal, 
  SendMode, TonClient, WalletContractV4, toNano, beginCell
} from "@ton/ton";
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import * as fs from "fs";

const CLIENT = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
  apiKey: "8e6b3e32b7af81623f0a70d37c3e9eb9a0f40c62f8f5b22c18e1c83b7c4a01d" // key pubblica free
});

// ── Genera o carica wallet di deploy ──────────────────────────
async function getDeployWallet(): Promise<{ kp: KeyPair, wallet: WalletContractV4, address: string }> {
  const keyFile = "build/deploy_wallet.json";
  
  let mnemonic: string[];
  
  if (fs.existsSync(keyFile)) {
    const saved = JSON.parse(fs.readFileSync(keyFile, "utf-8"));
    mnemonic = saved.mnemonic;
    console.log("✅ Wallet esistente caricato");
  } else {
    mnemonic = await mnemonicNew(24);
    fs.writeFileSync(keyFile, JSON.stringify({ mnemonic }, null, 2));
    console.log("✅ Nuovo wallet generato e salvato in build/deploy_wallet.json");
  }
  
  const kp = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ publicKey: kp.publicKey, workchain: 0 });
  const address = wallet.address.toString({ testOnly: true, bounceable: false });
  
  return { kp, wallet, address };
}

// ── Controlla balance ─────────────────────────────────────────
async function getBalance(address: string): Promise<bigint> {
  try {
    const res = await fetch('https://testnet.tonapi.io/v2/accounts/' + address);
    const d = await res.json();
    return BigInt(d.balance || 0);
  } catch {
    return BigInt(0);
  }
}

// ── Deploy singolo contratto ──────────────────────────────────
async function deployContract(
  name: string,
  pkgFile: string,
  initData: Cell,
  kp: KeyPair,
  wallet: WalletContractV4
): Promise<string> {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
  const code = Cell.fromBase64(pkg.code);
  
  const stateInit = { code, data: initData };
  const contractAddr = contractAddress(0, stateInit);
  const addrStr = contractAddr.toString({ testOnly: true, bounceable: true });
  
  console.log(`\n📦 Deploying ${name}...`);
  console.log(`   Address: ${addrStr}`);
  
  // Check if already deployed
  try {
    const balance = await CLIENT.getBalance(contractAddr);
    if (balance > 0n) {
      console.log(`   ✅ Già deployato (balance: ${fromNano(balance)} TON)`);
      return addrStr;
    }
  } catch {}
  
  // Send deploy transaction
  const contract = CLIENT.open(wallet);
  const seqno = await contract.getSeqno();
  
  await contract.sendTransfer({
    secretKey: kp.secretKey,
    seqno,
    messages: [
      internal({
        to: contractAddr,
        value: toNano("0.15"),
        init: stateInit,
        body: "deploy",
        bounce: false,
      })
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY,
  });
  
  // Wait for confirmation
  console.log("   ⏳ Attendo conferma on-chain...");
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const newSeqno = await contract.getSeqno();
      if (newSeqno > seqno) {
        console.log(`   ✅ Deployato con successo!`);
        return addrStr;
      }
    } catch {}
    process.stdout.write(".");
  }
  
  console.log(`\n   ⚠️ Timeout — controlla su https://testnet.tonscan.io/address/${addrStr}`);
  return addrStr;
}

async function main() {
  console.log("🚀 TonBola — Deploy Testnet Automatico");
  console.log("========================================\n");
  
  // 1. Get or create deploy wallet
  const { kp, wallet, address } = await getDeployWallet();
  console.log(`📍 Deploy wallet: ${address}`);
  
  // 2. Check balance
  const balance = await getBalance(address);
  console.log(`💰 Balance: ${fromNano(balance)} TON`);
  
  if (balance < toNano("1")) {
    console.log(`
❌ Balance insufficiente! Serve almeno 1 TON testnet.

👉 Ottieni TON testnet gratis:
   1. Vai su https://testnet.tonfaucet.io
      Indirizzo: ${address}
   
   2. Oppure Telegram bot:
      @testgiver_ton_bot → /start ${address}
   
   3. Oppure TON testnet faucet API:
      curl "https://testnet.toncenter.com/api/v2/sendTestCoins?address=${address}&amount=5000000000"

Dopo aver ricevuto i TON, riesegui questo script.
    `);
    return;
  }
  
  console.log(`✅ Balance sufficiente per il deploy\n`);
  
  const deployerAddr = Address.parse(address);
  
  // 3. Deploy MockUSDT
  const usdtInitData = beginCell()
    .storeAddress(deployerAddr)  // owner
    .storeCoins(0)               // total_supply
    .storeUint(0, 64)            // faucet_claims
    .endCell();
  
  const usdtAddr = await deployContract(
    "MockUSDT (tUSDT Faucet)",
    "build/MockUSDT/MockUSDT_MockUSDT.pkg",
    usdtInitData,
    kp, wallet
  );
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 4. Deploy TonBolaVault
  const vaultInitData = beginCell()
    .storeAddress(deployerAddr)  // owner
    .storeAddress(deployerAddr)  // dev_wallet
    .storeAddress(deployerAddr)  // token_fund
    .storeAddress(deployerAddr)  // leaderboard_wallet
    .storeAddress(deployerAddr)  // platform_wallet
    .storeUint(BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729"), 256) // oracle_pubkey
    .storeUint(0, 64)  // last_nonce
    .storeCoins(0)     // jackpot_ton
    .storeCoins(0)     // total_in
    .storeCoins(0)     // total_paid
    .storeUint(0, 64)  // game_count
    .storeCoins(0)     // prize_pool
    .endCell();
  
  const vaultAddr = await deployContract(
    "TonBolaVault (Split Contract)",
    "build/TonBolaVault/TonBolaVault_TonBolaVault.pkg",
    vaultInitData,
    kp, wallet
  );
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 5. Deploy $TBOLA Jetton
  const tbolaInitData = beginCell()
    .storeCoins(0)               // total_supply
    .storeBit(true)              // mintable
    .storeAddress(deployerAddr)  // owner
    .storeAddress(deployerAddr)  // presale_wallet
    .storeAddress(deployerAddr)  // liquidity_wallet
    .storeAddress(deployerAddr)  // team_wallet
    .storeAddress(deployerAddr)  // marketing_wallet
    .storeAddress(deployerAddr)  // reserve_wallet
    .storeCoins(0)               // minted_airdrop
    .storeCoins(0)               // minted_presale
    .storeCoins(0)               // minted_liquidity
    .storeCoins(0)               // minted_team
    .storeCoins(0)               // minted_marketing
    .storeCoins(0)               // minted_reserve
    .storeUint(0, 32)            // team_vesting_start
    .storeCoins(0)               // team_vesting_claimed
    .endCell();
  
  const tbolaAddr = await deployContract(
    "$TBOLA Jetton",
    "build/TbolaJetton/TbolaJetton_TbolaJetton.pkg",
    tbolaInitData,
    kp, wallet
  );
  
  // 6. Save all addresses
  const result = {
    network: "testnet",
    deploy_wallet: address,
    contracts: {
      mock_usdt:     usdtAddr,
      vault:         vaultAddr,
      tbola_jetton:  tbolaAddr,
    },
    frontend_config: {
      TESTNET_USDT_MASTER:   usdtAddr,
      TESTNET_VAULT_ADDRESS: vaultAddr,
      TESTNET_TBOLA_MASTER:  tbolaAddr,
      IS_TESTNET: true,
    },
    explorer: {
      mock_usdt:    `https://testnet.tonscan.io/address/${usdtAddr}`,
      vault:        `https://testnet.tonscan.io/address/${vaultAddr}`,
      tbola_jetton: `https://testnet.tonscan.io/address/${tbolaAddr}`,
    },
    deployed_at: new Date().toISOString()
  };
  
  fs.writeFileSync("build/deployed_testnet.json", JSON.stringify(result, null, 2));
  
  console.log(`
╔════════════════════════════════════════════╗
║     ✅ DEPLOY TESTNET COMPLETATO!          ║
╚════════════════════════════════════════════╝

📍 MockUSDT (tUSDT Faucet):
   ${usdtAddr}
   
📍 TonBolaVault (Split):
   ${vaultAddr}
   
📍 $TBOLA Jetton:
   ${tbolaAddr}

🔍 Explorer:
   https://testnet.tonscan.io/address/${usdtAddr}
   https://testnet.tonscan.io/address/${vaultAddr}

📄 Salvato in: build/deployed_testnet.json

🎯 Prossimo step:
   Il script aggiornerà automaticamente il frontend!
   Esegui: npx ts-node scripts/update_frontend.ts
  `);
  
  return result;
}

main().catch(e => {
  console.error("❌ Errore:", e.message);
  process.exit(1);
});
