"""
oracle_connector.py — Modulo da importare nel backend main.py
Gestisce le chiamate all'oracle per i pagamenti on-chain.

Import in main.py:
    from oracle_connector import notify_bingo_winner, notify_wheel_collect, notify_scratch_win
"""

import httpx
import asyncio
import os

ORACLE_URL = os.environ.get("ORACLE_URL", "http://localhost:8003")


async def notify_bingo_winner(winner_wallet: str, amount_ton: float,
                               game_id: int, win_type: int = 1) -> bool:
    """
    Chiama l'oracle per pagare un vincitore bingo.
    Chiamare dopo aver verificato la vincita su Supabase.
    
    win_type: 0=line 1=bingo 2=pvp
    """
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(f"{ORACLE_URL}/oracle/pay-winner", json={
                "winner_wallet": winner_wallet,
                "amount_ton": amount_ton,
                "game_id": game_id,
                "win_type": win_type
            })
        if r.status_code == 200:
            print(f"[ORACLE] pay-winner OK: {amount_ton} TON → {winner_wallet[:20]}...")
            return True
        elif r.status_code == 409:
            print(f"[ORACLE] pay-winner: already paid (game_id={game_id})")
            return True  # Non è un errore
        else:
            print(f"[ORACLE] pay-winner error {r.status_code}: {r.text[:100]}")
            return False
    except Exception as e:
        print(f"[ORACLE] pay-winner connection error: {e}")
        return False


async def notify_wheel_collect(winner_wallet: str, amount_ton: float) -> bool:
    """
    Chiama l'oracle per pagare una sessione wheel completata.
    amount_ton = wheelSessionBal (saldo accumulato nella sessione)
    """
    if amount_ton <= 0:
        return True
    # La wheel non usa il contratto per i payout individuali —
    # il contratto gestisce solo lo split in entrata.
    # Il payout wheel avviene direttamente dal backend al wallet.
    # TODO: implementare payout diretto wallet-to-wallet
    print(f"[ORACLE] wheel collect: {amount_ton} TON → {winner_wallet[:20]} (TODO: direct payout)")
    return True


async def notify_scratch_win(winner_wallet: str, amount_ton: float,
                              game_id: int, is_jackpot: bool = False,
                              game_type: int = 2) -> bool:
    """
    Chiama l'oracle per pagare una vincita scratch.
    is_jackpot=True se è una vincita jackpot.
    game_type: 2=scratch
    """
    if amount_ton <= 0:
        return True
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            if is_jackpot:
                r = await c.post(f"{ORACLE_URL}/oracle/pay-jackpot", json={
                    "winner_wallet": winner_wallet,
                    "amount_ton": amount_ton,
                    "game_type": game_type
                })
            else:
                r = await c.post(f"{ORACLE_URL}/oracle/pay-winner", json={
                    "winner_wallet": winner_wallet,
                    "amount_ton": amount_ton,
                    "game_id": game_id,
                    "win_type": 3  # 3=jackpot/scratch
                })
        return r.status_code == 200
    except Exception as e:
        print(f"[ORACLE] scratch win error: {e}")
        return False


async def notify_jackpot_wheel(winner_wallet: str, amount_ton: float) -> bool:
    """Paga il jackpot della fortune wheel."""
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(f"{ORACLE_URL}/oracle/pay-jackpot", json={
                "winner_wallet": winner_wallet,
                "amount_ton": amount_ton,
                "game_type": 1  # 1=wheel
            })
        return r.status_code == 200
    except Exception as e:
        print(f"[ORACLE] jackpot wheel error: {e}")
        return False
