"""
Deploy via HTTP API di TON testnet
Usa solo requests standard — nessuna lib esterna necessaria
"""
import json, base64, hashlib, time, struct, urllib.request, urllib.error
from pathlib import Path

WALLET_FILE = "build/deploy_wallet.json"
TONCENTER   = "https://testnet.toncenter.com/api/v2"
TONAPI      = "https://testnet.tonapi.io/v2"

def api_get(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.load(r)

def check_balance(addr):
    try:
        d = api_get(f"{TONAPI}/accounts/{addr}")
        return int(d.get("balance", 0))
    except:
        return 0

def get_seqno(addr):
    try:
        d = api_get(f"{TONCENTER}/runGetMethod?address={addr}&method=seqno&stack=%5B%5D")
        stack = d.get("result", {}).get("stack", [])
        if stack:
            return int(stack[0][1], 16)
        return 0
    except:
        return 0

def load_wallet():
    if not Path(WALLET_FILE).exists():
        print("Wallet file not found!")
        return None
    return json.loads(Path(WALLET_FILE).read_text())

def main():
    w = load_wallet()
    if not w:
        return

    print("\n🚀 TonBola Testnet Deploy (Python)")
    print("====================================")
    
    # Usa la libreria ton per fare il deploy
    # Prima proviamo con tonutils
    os.system("pip install tonutils --break-system-packages -q 2>/dev/null")
    
    try:
        from tonutils.client import TonapiClient
        from tonutils.wallet import WalletV4R2
        print("tonutils loaded")
        
        client = TonapiClient(api_key="", is_testnet=True)
        mnemonic = w["mnemonic"]
        wallet, pub, priv, mnem = WalletV4R2.from_mnemonic(client, mnemonic)
        
        addr = wallet.address.to_str(is_bounceable=False, is_url_safe=True)
        print(f"Wallet: {addr}")
        
        bal = check_balance(addr)
        print(f"Balance: {bal/1e9:.4f} TON")
        
        if bal < 500_000_000:
            print("❌ Serve almeno 0.5 TON")
            return
            
        print("✅ Pronto per il deploy!")
        return wallet, client
        
    except Exception as e:
        print(f"tonutils error: {e}")

import os
main()
