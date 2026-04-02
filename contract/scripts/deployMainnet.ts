import { Address, toNano, WalletContractV4, internal, beginCell } from "@ton/ton";
import { TonClient, mnemonicToPrivateKey, KeyPair } from "@ton/ton";
import { TonBolaVault } from "../build/TonBolaVault/TonBolaVault_TonBolaVault";
import * as fs from "fs";

// ── CONFIGURAZIONE ──────────────────────────────────────────
// Inserisci il mnemonic del tuo wallet personale (owner)
const OWNER_MNEMONIC = process.env.OWNER_MNEMONIC || "";
// Oracle address già calcolato
const ORACLE_ADDRESS = "UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l";
// ────────────────────────────────────────────────────────────

async function deploy() {
  if (!OWNER_MNEMONIC) {
    console.error("❌  Imposta OWNER_MNEMONIC come variabile d'ambiente");
    console.error("    export OWNER_MNEMONIC='parola1 parola2 ... parola24'");
    process.exit(1);
  }

  console.log("🚀  Deploy TonBolaVault su TON Mainnet");
  console.log("    Oracle:", ORACLE_ADDRESS);

  // Client mainnet
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: process.env.TONCENTER_API_KEY || ""
  });

  // Carica owner wallet
  const words = OWNER_MNEMONIC.trim().split(" ");
  const keyPair: KeyPair = await mnemonicToPrivateKey(words);
  const wallet = WalletContractV4.create({
    publicKey: keyPair.publicKey,
    workchain: 0,
  });
  const walletContract = client.open(wallet);
  const ownerAddr = wallet.address;

  console.log("    Owner:", ownerAddr.toFriendly());

  // Controlla balance
  const balance = await walletContract.getBalance();
  console.log("    Balance:", Number(balance) / 1e9, "TON");
  if (balance < toNano("0.5")) {
    console.error("❌  Balance troppo basso — servono almeno 0.5 TON per il deploy");
    process.exit(1);
  }

  // Crea contratto
  const oracleAddr = Address.parse(ORACLE_ADDRESS);
  const vault = await TonBolaVault.fromInit(ownerAddr, oracleAddr);

  console.log("\n📋  Indirizzo contratto:", vault.address.toFriendly());
  console.log("    Questo è l'indirizzo su cui i giocatori invieranno i pagamenti");

  // Deploy
  console.log("\n⏳  Invio transazione di deploy...");
  const seqno = await walletContract.getSeqno();

  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: vault.address,
        value: toNano("0.3"),
        init: vault.init,
        body: beginCell().endCell(),
      }),
    ],
  });

  console.log("✅  Deploy inviato!");
  console.log("\n📌  Salva questi dati:");
  console.log("    CONTRACT_ADDRESS =", vault.address.toFriendly());
  console.log("    OWNER_ADDRESS    =", ownerAddr.toFriendly());
  console.log("    ORACLE_ADDRESS   =", ORACLE_ADDRESS);
  console.log("\n🔗  Verifica su TONViewer:");
  console.log("    https://tonviewer.com/" + vault.address.toFriendly());
  console.log("\n⏳  Aspetta 15-30 secondi poi verifica che il contratto sia attivo.");

  // Salva indirizzi su file
  const deployInfo = {
    contract: vault.address.toFriendly(),
    owner: ownerAddr.toFriendly(),
    oracle: ORACLE_ADDRESS,
    deployedAt: new Date().toISOString(),
    network: "mainnet"
  };
  fs.writeFileSync("deploy-mainnet.json", JSON.stringify(deployInfo, null, 2));
  console.log("\n💾  Info salvate in contract/deploy-mainnet.json");
}

deploy().catch(e => {
  console.error("❌  Errore:", e.message);
  process.exit(1);
});
