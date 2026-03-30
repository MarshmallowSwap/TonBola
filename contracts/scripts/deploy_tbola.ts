import { Address, contractAddress, Cell } from "@ton/ton";
import * as fs from "fs";

// ── TOKENOMICS $TBOLA ─────────────────────────────────────────
const TOKENOMICS = {
  total_supply:  1_000_000_000,  // 1 miliardo
  decimals:      9,
  symbol:        "$TBOLA",
  name:          "TonBola Token",
  description:   "Native token of TonBola — the Telegram gaming hub on TON",
  image:         "https://ton-bola.vercel.app/img/tbola-logo.png",

  distribution: {
    airdrop:    { pct: 40, amount: 400_000_000, wallet: "contratto_airdrop",           desc: "Giocatori attivi (XP mining)" },
    presale:    { pct: 20, amount: 200_000_000, wallet: "UQAr0sQHQfrE4vfaoNCaTGJ2OtkUwRWmSxF-_6rAiEmTBzC_", desc: "Presale pubblica $0.080 per TBOLA" },
    liquidity:  { pct: 15, amount: 150_000_000, wallet: "STON.fi_pool_address",         desc: "Liquidità DEX (STON.fi)" },
    team:       { pct: 15, amount: 150_000_000, wallet: "UQAjEYySoQTi15oQCNCdCoIT45WLV9FKKl_oi5VK2wZtg6TT", desc: "Team — vesting 6m cliff + 24m linear" },
    marketing:  { pct:  5, amount:  50_000_000, wallet: "UQBhsVRbxIv0g_3YmL2p_MFFsxUTCXXLwWf_hBKQF57Ztrjf", desc: "Marketing e partnership" },
    reserve:    { pct:  5, amount:  50_000_000, wallet: "UQCwjv61TRzu4dpmg3gpUEBvB8mnjYOtm1-ezGwpSWqUL0xB",  desc: "Reserve fund" },
  }
}

// ── XP → TBOLA Rate ──────────────────────────────────────────
// 1 USDT speso = 100 XP = 100 $TBOLA airdrop
// 1 TON speso  = 500 XP = 500 $TBOLA airdrop
// Tasso di emissione: ~0.1 TBOLA per ogni 0.001 USDT di revenue

async function main() {
  const minterPkg = JSON.parse(
    fs.readFileSync("build/TbolaJetton/TbolaJetton_TbolaJetton.pkg", "utf-8")
  );
  const walletPkg = JSON.parse(
    fs.readFileSync("build/TbolaJetton/TbolaJetton_TbolaWallet.pkg", "utf-8")
  );

  console.log("\n🪙  $TBOLA Jetton — Deploy Info");
  console.log("=================================");
  console.log(`Symbol:       ${TOKENOMICS.symbol}`);
  console.log(`Supply:       ${TOKENOMICS.total_supply.toLocaleString()} TBOLA`);
  console.log(`Decimals:     ${TOKENOMICS.decimals}`);
  console.log(`Minter size:  ${minterPkg.code.length} chars (base64)`);
  console.log(`Wallet size:  ${walletPkg.code.length} chars (base64)`);

  console.log("\n📊 Distribuzione Tokenomics:");
  let total_pct = 0;
  for (const [key, val] of Object.entries(TOKENOMICS.distribution)) {
    console.log(`  ${val.pct}% (${val.amount.toLocaleString().padStart(13)}) → ${key.padEnd(10)} — ${val.desc}`);
    total_pct += val.pct;
  }
  console.log(`  ─────────────────────────────────────`);
  console.log(`  ${total_pct}% totale ✓`);

  console.log("\n💰 Presale:");
  const presale_price_usdt = 0.080;
  const presale_supply = TOKENOMICS.distribution.presale.amount;
  console.log(`  Prezzo:     $${presale_price_usdt} USDT per TBOLA`);
  console.log(`  Supply:     ${presale_supply.toLocaleString()} TBOLA`);
  console.log(`  Hard cap:   $${(presale_supply * presale_price_usdt).toLocaleString()} USDT`);

  console.log("\n⏰ Vesting Team:");
  console.log("  Cliff:      6 mesi (nessun claim possibile prima)");
  console.log("  Duration:   24 mesi (linear vesting dopo il cliff)");
  console.log("  Formula:    claimable = (elapsed/730days) × 150M − claimed");

  console.log("\n🎮 Airdrop (XP Mining):");
  console.log("  Rate:       1 USDT speso = 100 $TBOLA");
  console.log("  Rate:       1 TON speso  = 500 $TBOLA");
  console.log("  Cap:        400.000.000 TBOLA massimo airdrop");
  console.log("  Distribuzione: ogni volta che addXP() viene chiamato nel frontend");

  console.log("\n🚀 Per deployare su testnet:");
  console.log("  1. Vai su https://testnet.ton.cx/ → Deploy Contract");
  console.log("  2. Carica: build/TbolaJetton/TbolaJetton_TbolaJetton.pkg");
  console.log("  3. Init params: (owner, presale, liquidity, team, marketing, reserve)");
  console.log("  4. Invia 'distribute_initial' per distribuire le quote iniziali");
  console.log("  5. Verifica su https://testnet.tonscan.io/");

  // Save full config
  const config = { ...TOKENOMICS, minter_pkg: "TbolaJetton_TbolaJetton.pkg", wallet_pkg: "TbolaJetton_TbolaWallet.pkg", deployed_at: null, minter_address: null, network: "testnet" };
  fs.writeFileSync("build/tbola_config.json", JSON.stringify(config, null, 2));
  console.log("\n✅ Config salvata: build/tbola_config.json");
}

main().catch(console.error);
