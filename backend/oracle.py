"""
TonBola Oracle Backend
Firma i pagamenti ai vincitori con la chiave privata oracle
e li invia al contratto TonBolaVault.

Endpoint: POST /oracle/pay_winner
Body: { game_id, winner_address, amount_nano, currency }

Gira come systemd service su porta 8003.
"""
import os, json, time, hashlib, struct
import nacl.signing
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Config ──────────────────────────────────────────────────
ORACLE_MNEMONIC = os.getenv("ORACLE_MNEMONIC", "")
VAULT_ADDRESS   = os.getenv("VAULT_ADDRESS", "")   # Mainnet vault
TON_API_KEY     = os.getenv("TON_API_KEY", "")

# Oracle keypair (da mnemonic salvato sul VPS)
# Pubkey: 81596930447221648253673168568189894254664175305553746201413230980358321864729
# Mnemonic: bulk royal camp fame baby accuse item method air reflect vendor bundle...
ORACLE_PRIVATE_KEY_HEX = os.getenv("ORACLE_PRIVATE_KEY_HEX", "")

app = FastAPI(title="TonBola Oracle", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Nonce counter (monotonically increasing)
_nonce = int(time.time() * 1000)

class PayWinnerRequest(BaseModel):
    game_id: int
    winner_address: str
    amount_nano: int      # in nanotons
    currency: str         # "TON" or "USDT"
    game_type: str        # "bingo", "wheel", "scratch", "pvp"

class PayWinnerResponse(BaseModel):
    success: bool
    tx_hash: str = ""
    message: str = ""
    signed_payload: str = ""

@app.get("/health")
def health():
    return {"status": "ok", "service": "tonbola-oracle"}

@app.post("/oracle/pay_winner", response_model=PayWinnerResponse)
async def pay_winner(req: PayWinnerRequest):
    global _nonce
    
    if not ORACLE_PRIVATE_KEY_HEX:
        raise HTTPException(500, "Oracle not configured — ORACLE_PRIVATE_KEY_HEX missing")
    if not VAULT_ADDRESS:
        raise HTTPException(500, "VAULT_ADDRESS not configured")
    
    try:
        # 1. Increment nonce
        _nonce += 1
        nonce = _nonce
        
        # 2. Build message to sign:
        # hash = sha256(winner_address_bytes + amount_nano + game_id + nonce)
        # This mirrors the contract's checkSignature logic
        
        # Parse winner address (raw workchain:hash)
        # For signing we use the 32-byte address hash
        from pytoniq_core import Address
        addr = Address(req.winner_address)
        addr_bytes = bytes.fromhex(addr.hash_part.hex())
        
        # Pack: address(32) + amount(8) + game_id(8) + nonce(8)
        msg_bytes = (
            addr_bytes +
            req.amount_nano.to_bytes(8, "big") +
            req.game_id.to_bytes(8, "big") +
            nonce.to_bytes(8, "big")
        )
        msg_hash = hashlib.sha256(msg_bytes).digest()
        
        # 3. Sign with oracle key
        private_key = bytes.fromhex(ORACLE_PRIVATE_KEY_HEX)
        signing_key = nacl.signing.SigningKey(private_key)
        signed = signing_key.sign(msg_hash)
        signature_hex = signed.signature.hex()
        
        # 4. Build TON transaction to call vault.PayWinner
        # This creates a signed message payload for the frontend
        # or the bot can send it directly
        
        payload = {
            "vault_address":  VAULT_ADDRESS,
            "winner_address": req.winner_address,
            "amount_nano":    req.amount_nano,
            "game_id":        req.game_id,
            "nonce":          nonce,
            "signature_hex":  signature_hex,
            "currency":       req.currency,
        }
        
        # 5. Optionally broadcast directly via TON API
        # For now return the signed payload — the bot/frontend sends it
        
        return PayWinnerResponse(
            success=True,
            message=f"Signed payment for {req.amount_nano} nanoTON to {req.winner_address[:16]}...",
            signed_payload=json.dumps(payload)
        )
        
    except Exception as e:
        raise HTTPException(500, f"Oracle error: {str(e)}")

@app.post("/oracle/verify_payment")
async def verify_payment(tx_hash: str, expected_amount: int, expected_to: str):
    """Verifica che una TX on-chain sia arrivata a destinazione."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://tonapi.io/v2/blockchain/transactions/{tx_hash}",
                timeout=10
            )
            tx = r.json()
            
        # Check that out_msgs contains payment to expected_to
        for msg in tx.get("out_msgs", []):
            dest = msg.get("destination", {}).get("address", "")
            value = int(msg.get("value", 0))
            if expected_to.lower() in dest.lower() and value >= expected_amount:
                return {"verified": True, "tx_hash": tx_hash}
        
        return {"verified": False, "reason": "Payment not found in TX"}
    except Exception as e:
        return {"verified": False, "reason": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
