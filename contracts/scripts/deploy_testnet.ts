import { Address, beginCell, Cell, contractAddress, fromNano } from "@ton/ton";
import * as fs from "fs";

const ORACLE_PUBKEY_INT = BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729");

async function deploy() {
  // Load compiled pkg
  const pkgRaw = fs.readFileSync("build/TonBolaVault/TonBolaVault_TonBolaVault.pkg", "utf-8");
  const pkg = JSON.parse(pkgRaw);
  const code = Cell.fromBase64(pkg.code);

  // Use a simple testnet address for all wallets (same wallet for testing)
  // This is a valid TON address format
  const testWallet = Address.parseRaw("0:0000000000000000000000000000000000000000000000000000000000000001");

  const initData = beginCell()
    .storeBit(false) // owner (will be set by sender)
    .endCell();

  // Get the init state from the PKG
  const contractInit = {
    code: code,
    data: initData,
  };

  const contractAddr = contractAddress(0, contractInit);
  
  console.log("\n🚀 TonBolaVault — Contratto Compilato");
  console.log("======================================");
  console.log("Contract Address (testnet):", contractAddr.toString());
  console.log("Code BOC size:", pkg.code.length, "chars (base64)");
  console.log("Oracle Pubkey:", ORACLE_PUBKEY_INT.toString());
  
  const info = {
    contract_address: contractAddr.toString(),
    network: "testnet",
    oracle_pubkey_int: ORACLE_PUBKEY_INT.toString(),
    oracle_pubkey_hex: "b46639daeba4bfed54e1b1eca0d45e0d1bdfeb737c345b04147a680ee9d20019",
    deployed_at: new Date().toISOString(),
  };
  fs.writeFileSync("build/contract_info.json", JSON.stringify(info, null, 2));
  console.log("\n✅ Contratto pronto per deploy manuale via Tonkeeper Testnet");
  return contractAddr.toString();
}

deploy().catch(console.error);
