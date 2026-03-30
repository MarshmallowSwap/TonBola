"""
Deploy TonBola testnet contracts via Python
Usa pytoniq-core per costruire le transazioni
"""
import json, os, time, urllib.request, urllib.parse
from pathlib import Path

# pip install pytoniq-core
try:
    from pytoniq_core import (
        WalletV4R2, LiteClient, Address, Cell, begin_cell,
        StateInit, MessageAny
    )
    print("pytoniq available")
except ImportError:
    print("Installing pytoniq-core...")
    os.system("pip install pytoniq-core --break-system-packages -q")

try:
    from pytoniq_core.crypto.keys import mnemonic_new, mnemonic_to_private_key
    print("keys module available")
except ImportError:
    pass

