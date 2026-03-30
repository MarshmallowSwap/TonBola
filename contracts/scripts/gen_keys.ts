import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";

async function main() {
  const mnemonic = await mnemonicNew(24);
  const kp = await mnemonicToPrivateKey(mnemonic);
  console.log("ORACLE_MNEMONIC:", mnemonic.join(" "));
  console.log("ORACLE_PUBKEY_HEX:", kp.publicKey.toString("hex"));
  console.log("ORACLE_SECRET_HEX:", kp.secretKey.toString("hex"));
  console.log("ORACLE_PUBKEY_INT:", BigInt("0x" + kp.publicKey.toString("hex")).toString());
}
main();
