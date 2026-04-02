// ═══════════════════════════════════════════════════════════════
//  Deploy TonBolaVault — Mainnet
//  Owner:  EQB_Gcot0yD5pPCQ7qn4OvkLjLtU1zSfvuLh1IrVWbl_1CTU
//  Oracle: UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l
// ═══════════════════════════════════════════════════════════════

import { Address, toNano, WalletContractV4, internal, beginCell } from "@ton/core";
import { TonClient, mnemonicToPrivateKey } from "@ton/ton";
import { TonBolaVault } from "../build/TonBolaVault/TonBolaVault_TonBolaVault";
import * as fs from "fs";

const ORACLE_ADDRESS = "UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l";
const DEPLOY_AMOUNT  = toNano("0.25");  // 0.25 TON initial balance

async function main() {
  const mnemonic = process.env.OWNER_MNEMONIC;
  if (!mnemonic) {
    console.error("❌  Manca OWNER_MNEMONIC");
    console.error("    export OWNER_MNEMONIC='parola1 parola2 ... parola24'");
    process.exit(1);
  }

  console.log("🚀  TonBolaVault — Deploy Mainnet");

  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: process.env.TONCENTER_KEY || ""
  });

  const kp = await mnemonicToPrivateKey(mnemonic.trim().split(" "));
  const wallet = WalletContractV4.create({ publicKey: kp.publicKey, workchain: 0 });
  const wc = client.open(wallet);
  const ownerAddr = wallet.address;

  console.log("   Owner  :", ownerAddr.toString({ bounceable: true }));
  console.log("   Oracle :", ORACLE_ADDRESS);

  const bal = await wc.getBalance();
  console.log("   Balance:", Number(bal) / 1e9, "TON");
  if (bal < DEPLOY_AMOUNT + toNano("0.05")) {
    console.error("❌  Balance insufficiente — servono almeno 0.30 TON");
    process.exit(1);
  }

  // Calcola indirizzo contratto prima del deploy
  const oracle = Address.parse(ORACLE_ADDRESS);
  const vault  = await TonBolaVault.fromInit(ownerAddr, oracle);

  console.log("\n📋  Contratto:", vault.address.toString({ bounceable: false }));
  console.log("    TONViewer: https://tonviewer.com/" + vault.address.toString({ bounceable: false }));

  // Verifica che non sia già deployato
  try {
    const existing = await client.getContractState(vault.address);
    if (existing.state === "active") {
      console.log("⚠️   Contratto già attivo a questo indirizzo");
      console.log("    Indirizzo:", vault.address.toString({ bounceable: false }));
      saveResult(vault.address.toString({ bounceable: false }), ownerAddr.toString({ bounceable: true }));
      return;
    }
  } catch {}

  // Deploy
  const seqno = await wc.getSeqno();
  await wc.sendTransfer({
    seqno,
    secretKey: kp.secretKey,
    messages: [
      internal({
        to:    vault.address,
        value: DEPLOY_AMOUNT,
        init:  vault.init,
        body:  beginCell().endCell(),
      }),
    ],
  });

  console.log("\n✅  Transazione inviata!");
  console.log("    Aspetta 15-30 secondi poi controlla TONViewer.");

  saveResult(
    vault.address.toString({ bounceable: false }),
    ownerAddr.toString({ bounceable: true })
  );
}

function saveResult(contractAddr: string, ownerAddr: string) {
  const info = {
    contract: contractAddr,
    owner:    ownerAddr,
    oracle:   ORACLE_ADDRESS,
    network:  "mainnet",
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync("deploy-mainnet.json", JSON.stringify(info, null, 2));

  console.log("\n─────────────────────────────────────────────");
  console.log("CONTRACT_ADDRESS =", contractAddr);
  console.log("OWNER_ADDRESS    =", ownerAddr);
  console.log("ORACLE_ADDRESS   =", ORACLE_ADDRESS);
  console.log("─────────────────────────────────────────────");
  console.log("💾  Salvato in deploy-mainnet.json");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
