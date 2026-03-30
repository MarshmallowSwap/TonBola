import { WalletContractV4 } from "@ton/ton";
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import * as fs from "fs";

async function main() {
  const keyFile = "build/deploy_wallet.json";
  let mnemonic: string[];

  if (fs.existsSync(keyFile)) {
    const saved = JSON.parse(fs.readFileSync(keyFile, "utf-8"));
    mnemonic = saved.mnemonic;
    console.log("✅ Wallet esistente caricato da build/deploy_wallet.json");
  } else {
    mnemonic = await mnemonicNew(24);
    fs.mkdirSync("build", { recursive: true });
    fs.writeFileSync(keyFile, JSON.stringify({ mnemonic }, null, 2));
    console.log("✅ Nuovo wallet generato!");
  }

  const kp = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ publicKey: kp.publicKey, workchain: 0 });

  const addr_bounceable    = wallet.address.toString({ testOnly: true, bounceable: true });
  const addr_non_bounceable = wallet.address.toString({ testOnly: true, bounceable: false });

  console.log("\n═══════════════════════════════════════════");
  console.log("  🔑 TESTNET DEPLOY WALLET");
  console.log("═══════════════════════════════════════════");
  console.log("\n📍 Indirizzo (usare questo per il faucet):");
  console.log("  " + addr_non_bounceable);
  console.log("\n📍 Indirizzo (bounceable):");
  console.log("  " + addr_bounceable);
  console.log("\n🌱 Seed phrase (SEGRETO - NON condividere):");
  console.log("  " + mnemonic.join(" "));
  console.log("\n═══════════════════════════════════════════");
  console.log("\n👉 Per ottenere TON testnet gratuiti:");
  console.log("   1. Vai su: https://testnet.tonfaucet.io");
  console.log("      Incolla: " + addr_non_bounceable);
  console.log("\n   2. Oppure via Telegram:");
  console.log("      @testgiver_ton_bot → manda il tuo indirizzo");
  console.log("\n   3. Oppure via API diretta:");
  console.log(`      curl "https://testnet.toncenter.com/api/v2/sendTestCoins?address=${addr_non_bounceable}&amount=5000000000"`);
  console.log("\n═══════════════════════════════════════════");
  console.log("  Dopo aver ricevuto i TON, esegui:");
  console.log("  npx ts-node scripts/deploy_all_testnet.ts");
  console.log("═══════════════════════════════════════════\n");
}

main().catch(console.error);
