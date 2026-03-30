import { Address, beginCell, Cell, contractAddress } from "@ton/ton";
import * as fs from "fs";

// ── WALLET REALI TONBOLA ──────────────────────────────────────
const WALLETS = {
  DEV:          "UQAjEYySoQTi15oQCNCdCoIT45WLV9FKKl_oi5VK2wZtg6TT",  // 32%
  TOKEN_FUND:   "UQBhsVRbxIv0g_3YmL2p_MFFsxUTCXXLwWf_hBKQF57Ztrjf",  // 8%
  LEADERBOARD:  "UQCwjv61TRzu4dpmg3gpUEBvB8mnjYOtm1-ezGwpSWqUL0xB",  // 3%
  PLATFORM:     "UQAr0sQHQfrE4vfaoNCaTGJ2OtkUwRWmSxF-_6rAiEmTBzC_",  // 2%
  // PRIZE_POOL = indirizzo del contratto stesso (55%)
}

const ORACLE_PUBKEY = BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729");

async function main() {
  const pkg = JSON.parse(fs.readFileSync("build/TonBolaVault/TonBolaVault_TonBolaVault.pkg", "utf-8"));
  const code = Cell.fromBase64(pkg.code);
  
  // Verifica indirizzi
  console.log("\n✅ Wallet configurati:");
  Object.entries(WALLETS).forEach(([name, addr]) => {
    try {
      Address.parse(addr);
      console.log(`  ${name}: ${addr.slice(0,8)}...${addr.slice(-4)}`);
    } catch(e) {
      console.error(`  ❌ ${name}: indirizzo non valido!`);
    }
  });
  
  // Calcola indirizzo contratto
  // (l'init data dipende dall'owner address che è il deployer)
  console.log("\n📋 Indirizzi da usare nel contratto:");
  console.log("  DEV_WALLET:         ", WALLETS.DEV);
  console.log("  TOKEN_FUND:         ", WALLETS.TOKEN_FUND);
  console.log("  LEADERBOARD_WALLET: ", WALLETS.LEADERBOARD);
  console.log("  PLATFORM_WALLET:    ", WALLETS.PLATFORM);
  console.log("  ORACLE_PUBKEY:      ", ORACLE_PUBKEY.toString());
  
  console.log("\n🚀 Per deployare:");
  console.log("  Testnet: usa https://testnet.ton.cx/");
  console.log("  Mainnet: usa https://ton.cx/ → Deploy Contract");
  console.log("  Carica il file: build/TonBolaVault/TonBolaVault_TonBolaVault.pkg");
  
  // Save config
  const config = { ...WALLETS, oracle_pubkey: ORACLE_PUBKEY.toString(), split: { prize_pool: "55%", dev: "32%", token_fund: "8%", leaderboard: "3%", platform: "2%" } };
  fs.writeFileSync("build/contract_config.json", JSON.stringify(config, null, 2));
  console.log("\n✅ Config salvata: build/contract_config.json");
}

main();
