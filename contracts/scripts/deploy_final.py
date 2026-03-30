import json, time, asyncio, base64, urllib.request
from pathlib import Path
from pytoniq_core import Cell, begin_cell, Address, StateInit

WALLET_FILE = "build/deploy_wallet.json"
TONAPI      = "https://testnet.tonapi.io/v2"

def check_status(addr):
    try:
        with urllib.request.urlopen(f"{TONAPI}/accounts/{addr}", timeout=8) as r:
            d = json.load(r)
        return d.get("status"), int(d.get("balance", 0))
    except Exception as e:
        return None, 0

async def main():
    from tonutils.clients.http.clients.toncenter import ToncenterClient
    from tonutils.contracts.wallet.versions.v4 import WalletV4R2

    w = json.loads(Path(WALLET_FILE).read_text())
    mnemonic = w["mnemonic"]

    print("\n🚀 TonBola — Deploy Testnet")
    print("============================")

    from tonutils.clients.protocol import NetworkGlobalID
    client = ToncenterClient(
        NetworkGlobalID.TESTNET,
        api_key=""
    )

    wallet, pub_key, priv_key, _ = WalletV4R2.from_mnemonic(client, mnemonic)
    addr = wallet.address.to_str(is_url_safe=True, is_bounceable=False)
    print(f"Wallet: {addr}")

    status, bal = check_status(addr)
    print(f"Balance: {bal/1e9:.4f} TON  (status: {status})\n")

    if bal < 400_000_000:
        print("❌ Serve almeno 0.4 TON")
        return

    owner = wallet.address

    async def deploy(name, pkg_path, init_data):
        pkg = json.loads(Path(pkg_path).read_text())
        code_boc = base64.b64decode(pkg["code"])
        code = Cell.one_from_boc(code_boc)
        si = StateInit(code=code, data=init_data)
        
        # Contract address
        caddr = si.address
        caddr_str = caddr.to_str(is_url_safe=True, is_bounceable=True)
        print(f"\n📦 {name}")
        print(f"   {caddr_str}")

        # Check if already active
        st, cb = check_status(caddr_str)
        if st == "active":
            print(f"   ✅ Già deployato")
            return caddr_str

        # Deploy
        await wallet.transfer(
            destination=caddr,
            amount=int(0.15 * 1e9),
            state_init=si,
            body="deploy",
            bounce=False
        )
        print("   ⏳ ", end="", flush=True)
        
        for i in range(40):
            await asyncio.sleep(3)
            st, cb = check_status(caddr_str)
            if st in ("active", "frozen"):
                print(f" ✅ OK (balance: {cb/1e9:.3f} TON)")
                return caddr_str
            print("·", end="", flush=True)

        print(f"\n   ⚠️ Controlla: https://testnet.tonscan.io/address/{caddr_str}")
        return caddr_str

    # MockUSDT
    usdt_data = begin_cell()\
        .store_address(owner)\
        .store_coins(0)\
        .store_uint(0, 64)\
        .end_cell()
    usdt = await deploy("MockUSDT (tUSDT Faucet)", "build/MockUSDT/MockUSDT_MockUSDT.pkg", usdt_data)
    await asyncio.sleep(4)

    # TonBolaVault
    ORACLE = 81596930447221648253673168568189894254664175305553746201413230980358321864729
    vault_data = begin_cell()\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_uint(ORACLE, 256)\
        .store_uint(0, 64)\
        .store_coins(0)\
        .store_coins(0)\
        .store_coins(0)\
        .store_uint(0, 64)\
        .store_coins(0)\
        .end_cell()
    vault = await deploy("TonBolaVault (Split)", "build/TonBolaVault/TonBolaVault_TonBolaVault.pkg", vault_data)
    await asyncio.sleep(4)

    # $TBOLA
    tbola_data = begin_cell()\
        .store_coins(0)\
        .store_bit(True)\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_address(owner)\
        .store_coins(0).store_coins(0).store_coins(0)\
        .store_coins(0).store_coins(0).store_coins(0)\
        .store_uint(0, 32)\
        .store_coins(0)\
        .end_cell()
    tbola = await deploy("$TBOLA Jetton", "build/TbolaJetton/TbolaJetton_TbolaJetton.pkg", tbola_data)

    # Save result
    result = {
        "network": "testnet",
        "wallet": addr,
        "TESTNET_USDT_MASTER":   usdt,
        "TESTNET_VAULT_ADDRESS": vault,
        "TESTNET_TBOLA_MASTER":  tbola,
        "deployed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    Path("build/deployed_testnet.json").write_text(json.dumps(result, indent=2))

    print(f"""
╔══════════════════════════════════════════╗
║   ✅  DEPLOY COMPLETATO!                 ║
╚══════════════════════════════════════════╝

MockUSDT  : {usdt}
Vault     : {vault}
$TBOLA    : {tbola}

🔍 https://testnet.tonscan.io/address/{usdt}
🔍 https://testnet.tonscan.io/address/{vault}
🔍 https://testnet.tonscan.io/address/{tbola}
""")

asyncio.run(main())
