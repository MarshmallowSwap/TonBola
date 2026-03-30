"""
TonBola Oracle Backend — FastAPI
Gira su Hetzner, firma i pagamenti vincitori e li invia al contratto.

Questo va integrato nel backend FastAPI esistente su porta 8001.
"""

import os
import time
import hashlib
import struct
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import httpx

# pip install PyNaCl tonsdk
from nacl.signing import SigningKey
from tonsdk.utils import Address as TonAddress
from tonsdk.boc import Cell, begin_cell

app = FastAPI()

# ── Configurazione ────────────────────────────────────────────
CONTRACT_ADDRESS = os.environ["CONTRACT_ADDRESS"]   # indirizzo del vault deployato
ORACLE_SECRET    = bytes.fromhex(os.environ["ORACLE_SECRET_KEY"])  # 64 bytes
SUPABASE_URL     = os.environ["SUPABASE_URL"]
SUPABASE_KEY     = os.environ["SUPABASE_SERVICE_KEY"]

# Il wallet che paga le gas fees delle TX verso il contratto
# (non quello che riceve i fondi — quello è il contratto)
SENDER_MNEMONIC  = os.environ["SENDER_MNEMONIC"]

signing_key = SigningKey(ORACLE_SECRET[:32])

# ── Modelli ───────────────────────────────────────────────────
class PayWinnerRequest(BaseModel):
    winner_wallet: str    # indirizzo TON del vincitore
    amount_ton: float     # importo in TON (es. 0.275)
    game_id: int          # ID partita da Supabase
    game_type: str        # "bingo" | "scratch" | "wheel" | "pvp"

class PayJackpotRequest(BaseModel):
    winner_wallet: str
    pool_id: int          # 0=wheel_ton, 1=wheel_usdt, 2=scratch_usdt, 3=scratch_ton

# ── Firma messaggi ────────────────────────────────────────────
def sign_pay_winner(winner: str, amount_nano: int, game_id: int, nonce: int) -> bytes:
    """Firma il messaggio PayWinner con la chiave oracle."""
    # Costruisce la cell da firmare (identica al contratto Tact)
    cell = (begin_cell()
        .store_address(TonAddress(winner))
        .store_coins(amount_nano)
        .store_uint(game_id, 64)
        .store_uint(nonce, 64)
        .end_cell()
    )
    msg_hash = cell.bytes_hash()
    return signing_key.sign(msg_hash).signature

def sign_pay_jackpot(winner: str, pool_id: int, nonce: int) -> bytes:
    """Firma il messaggio PayJackpot con la chiave oracle."""
    cell = (begin_cell()
        .store_address(TonAddress(winner))
        .store_uint(pool_id, 8)
        .store_uint(nonce, 64)
        .end_cell()
    )
    msg_hash = cell.bytes_hash()
    return signing_key.sign(msg_hash).signature

async def send_to_contract(body_cell: Cell, amount_ton: float = 0.05):
    """Invia una transazione al contratto (usa il backend TON)."""
    # In produzione: usa tonsdk o tonutils per firmare e inviare la TX
    # Per ora logga l'intent — verrà integrato con il wallet sender
    print(f"[ORACLE] Sending TX to {CONTRACT_ADDRESS}, amount={amount_ton} TON")
    print(f"[ORACLE] Body BOC: {body_cell.to_boc(False).hex()[:50]}...")

# ── Endpoint API ──────────────────────────────────────────────

@app.post("/oracle/pay-winner")
async def pay_winner(req: PayWinnerRequest, background_tasks: BackgroundTasks):
    """
    Chiamato dal backend dopo che una vincita è confermata su Supabase.
    Firma e invia il pagamento al vincitore tramite il contratto.
    """
    # 1. Verifica che il game esista e non sia già pagato
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/games?id=eq.{req.game_id}&select=id,status,bingo_winner_id",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        )
    
    games = resp.json()
    if not games:
        raise HTTPException(404, "Game not found")
    
    game = games[0]
    if game.get("status") == "paid":
        raise HTTPException(409, "Game already paid")

    # 2. Genera nonce unico (timestamp in ms)
    nonce = int(time.time() * 1000)
    amount_nano = int(req.amount_ton * 1_000_000_000)  # TON → nanoton

    # 3. Firma il messaggio
    signature = sign_pay_winner(req.winner_wallet, amount_nano, req.game_id, nonce)

    # 4. Costruisce il body del messaggio per il contratto
    body = (begin_cell()
        .store_uint(0x6d2b2321, 32)  # op code PayWinner (hash del nome)
        .store_address(TonAddress(req.winner_wallet))
        .store_coins(amount_nano)
        .store_uint(req.game_id, 64)
        .store_uint(nonce, 64)
        .store_bytes(signature)
        .end_cell()
    )

    # 5. Invia al contratto (background task per non bloccare la risposta)
    background_tasks.add_task(send_to_contract, body, 0.05)

    # 6. Marca game come "payment_pending" su Supabase
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/games?id=eq.{req.game_id}",
            json={"status": "payment_pending", "nonce": nonce},
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        )

    return {
        "status": "pending",
        "nonce": nonce,
        "amount_ton": req.amount_ton,
        "winner": req.winner_wallet,
        "game_id": req.game_id
    }

@app.post("/oracle/pay-jackpot")
async def pay_jackpot(req: PayJackpotRequest, background_tasks: BackgroundTasks):
    """Chiamato quando il jackpot viene triggerato (scratch/wheel)."""
    nonce = int(time.time() * 1000)
    signature = sign_pay_jackpot(req.winner_wallet, req.pool_id, nonce)

    body = (begin_cell()
        .store_uint(0x7f3a1b2c, 32)  # op code PayJackpot
        .store_address(TonAddress(req.winner_wallet))
        .store_uint(req.pool_id, 8)
        .store_uint(nonce, 64)
        .store_bytes(signature)
        .end_cell()
    )

    background_tasks.add_task(send_to_contract, body, 0.05)

    return {
        "status": "pending",
        "pool_id": req.pool_id,
        "winner": req.winner_wallet,
        "nonce": nonce
    }

@app.get("/oracle/contract-balance")
async def get_balance():
    """Controlla il bilancio del contratto via TON API."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://tonapi.io/v2/accounts/{CONTRACT_ADDRESS}",
            headers={"Accept": "application/json"}
        )
    data = resp.json()
    balance_nano = data.get("balance", 0)
    return {
        "balance_ton": balance_nano / 1_000_000_000,
        "balance_nano": balance_nano,
        "contract": CONTRACT_ADDRESS
    }

@app.post("/oracle/weekly-leaderboard")
async def pay_leaderboard(background_tasks: BackgroundTasks):
    """
    Chiamato ogni lunedì da un cron job.
    Legge i top player da Supabase e li paga.
    """
    # Recupera top 50 dalla settimana appena finita
    week_start = "2026-03-24"  # calcolare dynamicamente
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/leaderboard_weekly?week_start=eq.{week_start}&order=score.desc&limit=50",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        )
    
    players = resp.json()
    if not players:
        return {"status": "no_players"}

    # Distribuzione premi leaderboard (dal leaderboard_wallet, non dal contratto)
    # Top 50 ricevono quote del fondo leaderboard accumulato
    DISTRIBUTION = {
        1: 0.30, 2: 0.18, 3: 0.12,
        4: 0.05, 5: 0.05,  # 4-5
        6: 0.03, 7: 0.03, 8: 0.03, 9: 0.03, 10: 0.03,  # 6-10
        # 11-25: 0.10 diviso 15
        # 26-50: 0.05 diviso 25
    }
    
    return {
        "status": "queued",
        "players_count": len(players),
        "week_start": week_start
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
