"""
Deploy TonBola Testnet — tutti e 3 i contratti
"""
import json, time, asyncio
from pathlib import Path

WALLET_FILE = "build/deploy_wallet.json"
DEPLOYED    = "build/deployed_testnet.json"

async def main():
    from tonutils.client import ToncenterClient
    from tonutils.contracts.wallet.versions.v4 import WalletV4R2
    from tonutils.contracts.wallet.messages import TransferItem
    from pytoniq_core import Cell, begin_cell, Address, StateInit

    w = json.loads(Path(WALLET_FILE).read_text())
    mnemonic = " ".join(w["mnemonic"])

    print("\n🚀 TonBola — Deploy Testnet")
    print("============================")

    # Client testnet
    client = ToncenterClient(
        base_url="https://testnet.toncenter.com/api/v2/",
        api_key=""
    )

    wallet = await WalletV4R2.from_mnemonic(client, mnemonic.split())
    addr = wallet.address.to_str(is_url_safe=True, is_bounceable=False)
    print(f"Wallet: {addr}")

    # Check balance
    import urllib.request
    with urllib.request.urlopen(f"https://testnet.tonapi.io/v2/accounts/{addr}") as r:
        bal_data = json.load(r)
    bal = int(bal_data.get("balance", 0))
    print(f"Balance: {bal/1e9:.4f} TON\n")

    if bal < 500_000_000:
        print("❌ Serve almeno 0.5 TON")
        return

    deployed = {}

    # ── Deploy function ──────────────────────────────────────
    async def deploy_contract(name, pkg_path, init_data_cell):
        pkg = json.loads(Path(pkg_path).read_text())
        code = Cell.one_from_boc(bytes.fromhex(
            Cell.one_from_boc(
                bytes.fromhex(
                    bytes.fromhex(pkg["code"].encode() if isinstance(pkg["code"], str) else pkg["code"])
                    .hex() if False else ""
                ).hex() if False else ""
            ).to_boc().hex() if False else ""
        ).hex() if False else "")
        
        # Simpler: load pkg code directly
        import base64
        code_boc = base64.b64decode(pkg["code"])
        code_cell = Cell.one_from_boc(code_boc)
        
        si = StateInit(code=code_cell, data=init_data_cell)
        contract_addr = si.address(workchain=0)
        addr_str = contract_addr.to_str(is_url_safe=True, is_bounceable=True)
        
        print(f"📦 Deploying {name}...")
        print(f"   Address: {addr_str}")

        # Check if deployed
        try:
            with urllib.request.urlopen(f"https://testnet.tonapi.io/v2/accounts/{addr_str}") as r:
                info = json.load(r)
            if info.get("status") == "active":
                print(f"   ✅ Già deployato!")
                return addr_str
        except:
            pass

        # Send deploy
        await wallet.transfer(
            destination=contract_addr,
            amount=int(0.15 * 1e9),
            state_init=si,
            body="deploy",
            bounce=False
        )
        
        print("   ⏳ Attendo conferma...")
        for i in range(30):
            await asyncio.sleep(3)
            try:
                with urllib.request.urlopen(f"https://testnet.tonapi.io/v2/accounts/{addr_str}") as r:
                    info = json.load(r)
                if info.get("status") in ("active", "frozen"):
                    print(f"   ✅ Deployato! Status: {info['status']}")
                    return addr_str
            except:
                pass
            print(".", end="", flush=True)
        
        print(f"\n   ⚠️ Timeout — verifica su https://testnet.tonscan.io/address/{addr_str}")
        return addr_str

    # ── MockUSDT ─────────────────────────────────────────────
    owner_addr = wallet.address
    usdt_data = begin_cell() \
        .store_address(owner_addr) \
        .store_coins(0) \
        .store_uint(0, 64) \
        .end_cell()
    
    usdt_addr = await deploy_contract(
        "MockUSDT (tUSDT Faucet)",
        "build/MockUSDT/MockUSDT_MockUSDT.pkg",
        usdt_data
    )
    deployed["mock_usdt"] = usdt_addr
    await asyncio.sleep(5)

    # ── TonBolaVault ─────────────────────────────────────────
    ORACLE_PK = 81596930447221648253673168568189894254664175305553746201413230980358321864729
    vault_data = begin_cell() \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_uint(ORACLE_PK, 256) \
        .store_uint(0, 64) \
        .store_coins(0) \
        .store_coins(0) \
        .store_coins(0) \
        .store_uint(0, 64) \
        .store_coins(0) \
        .end_cell()
    
    vault_addr = await deploy_contract(
        "TonBolaVault (Split Contract)",
        "build/TonBolaVault/TonBolaVault_TonBolaVault.pkg",
        vault_data
    )
    deployed["vault"] = vault_addr
    await asyncio.sleep(5)

    # ── $TBOLA Jetton ─────────────────────────────────────────
    tbola_data = begin_cell() \
        .store_coins(0) \
        .store_bit(True) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_address(owner_addr) \
        .store_coins(0) \
        .store_coins(0) \
        .store_coins(0) \
        .store_coins(0) \
        .store_coins(0) \
        .store_coins(0) \
        .store_uint(0, 32) \
        .store_coins(0) \
        .end_cell()
    
    tbola_addr = await deploy_contract(
        "$TBOLA Jetton",
        "build/TbolaJetton/TbolaJetton_TbolaJetton.pkg",
        tbola_data
    )
    deployed["tbola"] = tbola_addr

    # ── Risultato finale ─────────────────────────────────────
    result = {
        "network": "testnet",
        "deploy_wallet": addr,
        "mock_usdt":  deployed.get("mock_usdt"),
        "vault":      deployed.get("vault"),
        "tbola":      deployed.get("tbola"),
        "deployed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    Path(DEPLOYED).write_text(json.dumps(result, indent=2))
    
    print(f"""
╔══════════════════════════════════════════════╗
║   ✅ DEPLOY TESTNET COMPLETATO!              ║
╚══════════════════════════════════════════════╝

MockUSDT:  {deployed.get('mock_usdt','—')}
Vault:     {deployed.get('vault','—')}
$TBOLA:    {deployed.get('tbola','—')}

Explorer:
  https://testnet.tonscan.io/address/{deployed.get('mock_usdt','')}
  https://testnet.tonscan.io/address/{deployed.get('vault','')}
  https://testnet.tonscan.io/address/{deployed.get('tbola','')}

Salvato: build/deployed_testnet.json
""")

asyncio.run(main())
