#!/bin/bash
# TonBola — Deploy testnet completo
# Esegui su VPS: bash setup.sh
set -e
DIR="/root/tbola"
mkdir -p $DIR/build $DIR/contracts/mockusdt $DIR/contracts/vault $DIR/contracts/tbola
cd $DIR

echo '{"name":"tbola","version":"1.0.0","dependencies":{"@ton/core":"^0.56.0","@ton/crypto":"^3.3.0","@ton/ton":"^15.0.0","@tact-lang/compiler":"^1.6.0","typescript":"^5.4.0","ts-node":"^10.9.2"}}' > package.json
echo '{"compilerOptions":{"target":"ES2020","module":"commonjs","esModuleInterop":true,"strict":false,"skipLibCheck":true}}' > tsconfig.json

echo "📦 npm install..."
npm install --legacy-peer-deps 2>&1 | tail -3

echo '{"mnemonic":["minor","pulp","dawn","eye","pair","vicious","museum","bacon","peasant","enable","danger","slight","retreat","twice","double","stick","tray","stairs","rug","machine","chunk","sunset","organ","spoon"]}' > build/wallet.json
echo "✅ wallet salvato (2 TON testnet)"

cat > contracts/mockusdt/MockUSDT.tact << 'TACT'
message(0xf8a7ea5) JettonTransfer { query_id: Int as uint64; amount: Int as coins; destination: Address; response_destination: Address; custom_payload: Cell?; forward_ton_amount: Int as coins; forward_payload: Slice as remaining; }
message(0x178d4519) JettonTransferNotification { query_id: Int as uint64; amount: Int as coins; sender: Address; forward_payload: Slice as remaining; }
message(0x595f07bc) JettonBurn { query_id: Int as uint64; amount: Int as coins; response_destination: Address; custom_payload: Cell?; }
message(0x7bdd97de) JettonBurnNotification { query_id: Int as uint64; amount: Int as coins; sender: Address; response_destination: Address; }
message(0xd53276db) JettonExcesses { query_id: Int as uint64; }
message(0x2c76b973) JettonProvideWalletAddress { query_id: Int as uint64; owner_address: Address; include_address: Bool; }
message(0xd1735400) JettonTakeWalletAddress { query_id: Int as uint64; wallet_address: Address; owner_address: Address?; }
contract MockUSDTWallet {
    balance: Int as coins; owner: Address; jetton_master: Address;
    init(owner: Address, jetton_master: Address) { self.balance=0; self.owner=owner; self.jetton_master=jetton_master; }
    receive(msg: JettonTransfer) {
        require(sender()==self.owner||sender()==self.jetton_master,"Unauthorized");
        require(self.balance>=msg.amount,"Insufficient"); self.balance=self.balance-msg.amount;
        let init:StateInit=initOf MockUSDTWallet(msg.destination,self.jetton_master);
        send(SendParameters{to:contractAddress(init),value:msg.forward_ton_amount+ton("0.01"),mode:SendIgnoreErrors,bounce:true,body:JettonTransferNotification{query_id:msg.query_id,amount:msg.amount,sender:self.owner,forward_payload:msg.forward_payload}.toCell(),code:init.code,data:init.data});
        if(msg.response_destination!=newAddress(0,0)){send(SendParameters{to:msg.response_destination,value:0,mode:SendRemainingValue|SendIgnoreErrors,bounce:false,body:JettonExcesses{query_id:msg.query_id}.toCell()});}
    }
    receive(msg: JettonTransferNotification) { self.balance=self.balance+msg.amount; }
    receive(msg: JettonBurn) {
        require(sender()==self.owner,"Not owner"); require(self.balance>=msg.amount,"Insufficient");
        self.balance=self.balance-msg.amount;
        send(SendParameters{to:self.jetton_master,value:0,mode:SendRemainingValue,bounce:true,body:JettonBurnNotification{query_id:msg.query_id,amount:msg.amount,sender:self.owner,response_destination:msg.response_destination}.toCell()});
    }
    get fun balance(): Int { return self.balance }
    get fun owner(): Address { return self.owner }
}
contract MockUSDT {
    total_supply: Int as coins; owner: Address; faucet_claims: Int as uint64;
    const FAUCET_AMOUNT: Int = 1000000000;
    init(owner: Address) { self.total_supply=0; self.owner=owner; self.faucet_claims=0; }
    receive() {
        require(context().value>=ton("0.05"),"Send 0.05 TON min");
        self.mintTo(sender(),self.FAUCET_AMOUNT);
        self.faucet_claims=self.faucet_claims+1;
        send(SendParameters{to:sender(),value:0,mode:SendRemainingValue|SendIgnoreErrors,bounce:false,body:"faucet_ok".asComment()});
    }
    receive("admin_mint") { require(sender()==self.owner,"Only owner"); self.mintTo(sender(),self.FAUCET_AMOUNT*10000); }
    receive(msg: JettonBurnNotification) { self.total_supply=self.total_supply-msg.amount; }
    receive(msg: JettonProvideWalletAddress) {
        let init:StateInit=initOf MockUSDTWallet(msg.owner_address,myAddress());
        send(SendParameters{to:sender(),value:0,mode:SendRemainingValue,bounce:false,body:JettonTakeWalletAddress{query_id:msg.query_id,wallet_address:contractAddress(init),owner_address:msg.include_address?msg.owner_address:null}.toCell()});
    }
    fun mintTo(to: Address, amount: Int) {
        let init:StateInit=initOf MockUSDTWallet(to,myAddress());
        self.total_supply=self.total_supply+amount;
        send(SendParameters{to:contractAddress(init),value:ton("0.02"),mode:SendIgnoreErrors,bounce:true,body:JettonTransferNotification{query_id:0,amount:amount,sender:myAddress(),forward_payload:emptySlice()}.toCell(),code:init.code,data:init.data});
    }
    get fun total_supply(): Int { return self.total_supply }
    get fun faucet_claims(): Int { return self.faucet_claims }
    get fun get_wallet_address(owner: Address): Address { return contractAddress(initOf MockUSDTWallet(owner,myAddress())); }
}
TACT

cat > contracts/vault/TonBolaVault.tact << 'TACT'
trait Ownable { owner: Address; fun requireOwner() { require(sender()==self.owner,"Not owner"); } }
message(0x47696d70) GamePayment { game_type: Int as uint8; game_id: Int as uint64; player_id: Int as uint64; }
message(0x50617957) PayWinner { winner: Address; amount: Int as coins; game_id: Int as uint64; nonce: Int as uint64; signature: Slice; }
contract TonBolaVault with Ownable {
    owner: Address; dev_wallet: Address; token_fund: Address;
    leaderboard_wallet: Address; platform_wallet: Address;
    oracle_pubkey: Int as uint256; last_nonce: Int as uint64;
    jackpot_ton: Int as coins; total_in: Int as coins;
    total_paid: Int as coins; game_count: Int as uint64; prize_pool: Int as coins;
    init(dev_wallet: Address, token_fund: Address, leaderboard_wallet: Address, platform_wallet: Address, oracle_pubkey: Int) {
        self.owner=sender(); self.dev_wallet=dev_wallet; self.token_fund=token_fund;
        self.leaderboard_wallet=leaderboard_wallet; self.platform_wallet=platform_wallet;
        self.oracle_pubkey=oracle_pubkey; self.last_nonce=0; self.jackpot_ton=0;
        self.total_in=0; self.total_paid=0; self.game_count=0; self.prize_pool=0;
    }
    receive(msg: GamePayment) {
        let amount:Int=context().value; require(amount>=ton("0.05"),"Too low");
        let usable:Int=amount-ton("0.05");
        let dev:Int=usable*3200/10000; let tok:Int=usable*800/10000;
        let lb:Int=usable*300/10000; let pf:Int=usable*200/10000;
        message(MessageParameters{to:self.dev_wallet,value:dev,mode:SendIgnoreErrors,bounce:false,body:"dev_fee".asComment()});
        message(MessageParameters{to:self.token_fund,value:tok,mode:SendIgnoreErrors,bounce:false,body:"token_fund".asComment()});
        message(MessageParameters{to:self.leaderboard_wallet,value:lb,mode:SendIgnoreErrors,bounce:false,body:"lb_fund".asComment()});
        message(MessageParameters{to:self.platform_wallet,value:pf,mode:SendIgnoreErrors,bounce:false,body:"platform_fee".asComment()});
        self.total_in=self.total_in+amount; self.prize_pool=self.prize_pool+(usable-dev-tok-lb-pf); self.game_count=self.game_count+1;
    }
    receive(msg: PayWinner) {
        require(msg.nonce>self.last_nonce,"Nonce used");
        let hash:Int=beginCell().storeAddress(msg.winner).storeCoins(msg.amount).storeUint(msg.game_id,64).storeUint(msg.nonce,64).endCell().hash();
        require(checkSignature(hash,msg.signature,self.oracle_pubkey),"Invalid sig");
        require(myBalance()>=msg.amount+ton("0.05"),"Insufficient");
        self.last_nonce=msg.nonce; self.total_paid=self.total_paid+msg.amount;
        if(self.prize_pool>=msg.amount){self.prize_pool=self.prize_pool-msg.amount;}
        message(MessageParameters{to:msg.winner,value:msg.amount,mode:SendIgnoreErrors,bounce:false,body:"winner_prize".asComment()});
    }
    receive("add_liquidity") { require(sender()==self.owner,"Only owner"); self.prize_pool=self.prize_pool+context().value; }
    receive("emergency_withdraw") { self.requireOwner(); message(MessageParameters{to:self.owner,value:0,mode:SendRemainingBalance,bounce:false,body:"emergency".asComment()}); }
    get fun balance(): Int { return myBalance() }
    get fun prizePool(): Int { return self.prize_pool }
    get fun totalIn(): Int { return self.total_in }
    get fun gameCount(): Int { return self.game_count }
    get fun lastNonce(): Int { return self.last_nonce }
}
TACT

cat > contracts/tbola/TbolaJetton.tact << 'TACT'
message(0xf8a7ea5) TbolaTransfer { query_id: Int as uint64; amount: Int as coins; destination: Address; response_destination: Address; custom_payload: Cell?; forward_ton_amount: Int as coins; forward_payload: Slice as remaining; }
message(0x178d4519) TbolaTransferNotification { query_id: Int as uint64; amount: Int as coins; sender: Address; forward_payload: Slice as remaining; }
message(0xd53276db) TbolaExcesses { query_id: Int as uint64; }
message(0x642b7d07) TbolaMint { query_id: Int as uint64; amount: Int as coins; receiver: Address; }
contract TbolaWallet {
    balance: Int as coins; owner: Address; jetton_master: Address;
    init(owner: Address, jetton_master: Address) { self.balance=0; self.owner=owner; self.jetton_master=jetton_master; }
    receive(msg: TbolaTransfer) {
        require(sender()==self.owner||sender()==self.jetton_master,"Unauthorized");
        require(self.balance>=msg.amount,"Insufficient"); self.balance=self.balance-msg.amount;
        let init:StateInit=initOf TbolaWallet(msg.destination,self.jetton_master);
        send(SendParameters{to:contractAddress(init),value:msg.forward_ton_amount+ton("0.01"),mode:SendIgnoreErrors,bounce:true,body:TbolaTransferNotification{query_id:msg.query_id,amount:msg.amount,sender:self.owner,forward_payload:msg.forward_payload}.toCell(),code:init.code,data:init.data});
        if(msg.response_destination!=newAddress(0,0)){send(SendParameters{to:msg.response_destination,value:0,mode:SendRemainingValue|SendIgnoreErrors,bounce:false,body:TbolaExcesses{query_id:msg.query_id}.toCell()});}
    }
    receive(msg: TbolaTransferNotification) { self.balance=self.balance+msg.amount; }
    get fun balance(): Int { return self.balance }
    get fun owner(): Address { return self.owner }
}
contract TbolaJetton {
    total_supply: Int as coins; mintable: Bool; owner: Address;
    presale_wallet: Address; liquidity_wallet: Address; team_wallet: Address; marketing_wallet: Address; reserve_wallet: Address;
    init(owner: Address, presale_wallet: Address, liquidity_wallet: Address, team_wallet: Address, marketing_wallet: Address, reserve_wallet: Address) {
        self.total_supply=0; self.mintable=true; self.owner=owner;
        self.presale_wallet=presale_wallet; self.liquidity_wallet=liquidity_wallet;
        self.team_wallet=team_wallet; self.marketing_wallet=marketing_wallet; self.reserve_wallet=reserve_wallet;
    }
    receive(msg: TbolaMint) { require(sender()==self.owner,"Only owner"); require(self.mintable,"Disabled"); self.mintInternal(msg.receiver,msg.amount); }
    receive("disable_minting") { require(sender()==self.owner,"Only owner"); self.mintable=false; }
    fun mintInternal(to: Address, amount: Int) {
        let init:StateInit=initOf TbolaWallet(to,myAddress());
        self.total_supply=self.total_supply+amount;
        send(SendParameters{to:contractAddress(init),value:ton("0.02"),mode:SendIgnoreErrors,bounce:true,body:TbolaTransferNotification{query_id:0,amount:amount,sender:myAddress(),forward_payload:emptySlice()}.toCell(),code:init.code,data:init.data});
    }
    get fun total_supply(): Int { return self.total_supply }
    get fun mintable(): Bool { return self.mintable }
    get fun get_wallet_address(owner: Address): Address { return contractAddress(initOf TbolaWallet(owner,myAddress())); }
}
TACT

cat > tact.config.json << 'EOF'
{"projects":[
  {"name":"MockUSDT","path":"contracts/mockusdt/MockUSDT.tact","output":"build/MockUSDT","options":{}},
  {"name":"TonBolaVault","path":"contracts/vault/TonBolaVault.tact","output":"build/TonBolaVault","options":{}},
  {"name":"TbolaJetton","path":"contracts/tbola/TbolaJetton.tact","output":"build/TbolaJetton","options":{}}
]}
EOF

echo "🔨 Compiling..."
./node_modules/.bin/tact --config tact.config.json
echo "✅ Done:" && for f in build/*/*.code.boc; do echo "  $(basename $f): $(wc -c < $f) bytes"; done

cat > deploy.ts << 'TSEOF'
import{Address,Cell,contractAddress,fromNano,internal,SendMode,toNano,WalletContractV4,beginCell}from"@ton/ton";
import{KeyPair,mnemonicToPrivateKey}from"@ton/crypto";
import{execSync}from"child_process";
import*as fs from"fs";
function curl(u:string):any{try{return JSON.parse(execSync(`curl -sf --max-time 12 "${u}"`,{encoding:"utf-8"}));}catch{return{};}}
function sendBoc(boc:string):any{try{const o=execSync(`curl -sf --max-time 15 -X POST -H 'Content-Type: application/json' -d '{"boc":"${boc}"}' "https://testnet.toncenter.com/api/v2/sendBoc"`,{encoding:"utf-8"});return JSON.parse(o);}catch(e:any){return{error:e.stderr?.toString().slice(0,80)};}}
function getSeqno(a:string):number{const d=curl(`https://testnet.toncenter.com/api/v2/runGetMethod?address=${encodeURIComponent(a)}&method=seqno&stack=%5B%5D`);try{return parseInt(d.result?.stack?.[0]?.[1]??"0x0",16);}catch{return 0;}}
async function getInfo(a:string){const d=curl(`https://testnet.tonapi.io/v2/accounts/${a}`);return{status:d.status??"unknown",balance:BigInt(d.balance??0)};}
async function sleep(ms:number){return new Promise(r=>setTimeout(r,ms));}
async function deploy(name:string,pkg:string,data:Cell,kp:KeyPair,w:WalletContractV4,wa:string,seq:number):Promise<string>{
  const p=JSON.parse(fs.readFileSync(pkg,"utf-8"));
  const si={code:Cell.fromBase64(p.code),data};
  const ca=contractAddress(0,si);
  const cs=ca.toString({testOnly:true,bounceable:false});
  console.log(`\n📦 ${name}\n   ${cs}`);
  if((await getInfo(cs)).status==="active"){console.log("   ✅ già deployato!");return cs;}
  const tx=w.createTransfer({secretKey:kp.secretKey,seqno:seq,sendMode:SendMode.PAY_GAS_SEPARATELY+SendMode.IGNORE_ERRORS,messages:[internal({to:ca,value:toNano("0.15"),init:si,body:"deploy",bounce:false})]});
  const r=sendBoc(tx.toBoc().toString("base64"));
  console.log(`   TX: ${r.ok?"✅ inviata":"⚠️ "+JSON.stringify(r).slice(0,80)}`);
  process.stdout.write("   ⏳ ");
  for(let i=0;i<30;i++){await sleep(3000);const{status:st,balance:b}=await getInfo(cs);if(st==="active"||st==="frozen"){console.log(` ✅ ${st} (${fromNano(b)} TON)`);return cs;}process.stdout.write("·");}
  console.log(`\n   ⚠️ https://testnet.tonscan.io/address/${cs}`);return cs;
}
async function main(){
  console.log("\n🚀 TonBola Deploy Testnet\n");
  const wf=JSON.parse(fs.readFileSync("build/wallet.json","utf-8"));
  const kp:KeyPair=await mnemonicToPrivateKey(wf.mnemonic);
  const w=WalletContractV4.create({publicKey:kp.publicKey,workchain:0});
  const wa=w.address.toString({testOnly:true,bounceable:false});
  console.log(`Wallet: ${wa}`);
  const{balance:bal}=await getInfo(wa);
  console.log(`Balance: ${fromNano(bal)} TON`);
  if(bal<toNano("0.4")){console.log("❌ Serve 0.4 TON");process.exit(1);}
  const seq=getSeqno(wa);console.log(`Seqno: ${seq}`);
  const o=w.address;
  const usdt=await deploy("MockUSDT",
    "build/MockUSDT/MockUSDT_MockUSDT.pkg",
    beginCell().storeUint(0,1).storeAddress(o).endCell(),
    kp,w,wa,seq);
  await sleep(8000);
  const ORACLE=BigInt("81596930447221648253673168568189894254664175305553746201413230980358321864729");
  const vault=await deploy("TonBolaVault",
    "build/TonBolaVault/TonBolaVault_TonBolaVault.pkg",
    beginCell().storeUint(0,1).storeAddress(o).storeAddress(o).storeAddress(o).storeRef(beginCell().storeAddress(o).storeInt(ORACLE,257).endCell()).endCell(),
    kp,w,wa,seq+1);
  await sleep(8000);
  const tbola=await deploy("TbolaJetton",
    "build/TbolaJetton/TbolaJetton_TbolaJetton.pkg",
    beginCell().storeUint(0,1).storeCoins(0).storeBit(true).storeAddress(o).storeAddress(o).storeAddress(o).storeRef(beginCell().storeAddress(o).storeAddress(o).storeAddress(o).endCell()).storeRef(beginCell().storeCoins(0).storeCoins(0).storeCoins(0).storeCoins(0).storeCoins(0).storeCoins(0).storeUint(0,32).storeCoins(0).endCell()).endCell(),
    kp,w,wa,seq+2);
  const res={TESTNET_USDT_MASTER:usdt,TESTNET_VAULT_ADDRESS:vault,TESTNET_TBOLA_MASTER:tbola};
  fs.writeFileSync("build/deployed.json",JSON.stringify(res,null,2));
  console.log(`\n╔══════════════════════════════════╗\n║  ✅ DEPLOY COMPLETATO!           ║\n╚══════════════════════════════════╝\nMockUSDT : ${usdt}\nVault    : ${vault}\nTBOLA    : ${tbola}\n\nhttps://testnet.tonscan.io/address/${usdt}\nhttps://testnet.tonscan.io/address/${vault}\nhttps://testnet.tonscan.io/address/${tbola}`);
}
main().catch(e=>{console.error("❌",e.message);process.exit(1);});
TSEOF

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ✅ Setup OK! Ora esegui:            ║"
echo "║                                      ║"
echo "║  npx ts-node --transpile-only        ║"
echo "║              deploy.ts               ║"
echo "╚══════════════════════════════════════╝"
