"""
TonBola Oracle Backend — FastAPI
Gira su VPS porta 8003 — firma e invia i pagamenti al TonBolaVault mainnet.

AUTH: il contratto verifica sender() == oracle_address (indirizzo, non firma)
Quindi l'oracle deve inviare le TX con il wallet oracle UQA3AUgp...17l
"""

import os, time, asyncio, json, base64
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import httpx

app = FastAPI(title="TonBola Oracle")

# ── Config da env ────────────────────────────────────────────
VAULT_ADDRESS   = os.environ.get("VAULT_ADDRESS", "")      # dopo il deploy
ORACLE_MNEMONIC = os.environ.get("ORACLE_MNEMONIC",
    "bulk royal camp fame baby accuse item method air reflect vendor "
    "bundle feel carpet rescue borrow switch bubble gentle grid summer "
    "fiction coffee token")
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = os.environ.get("SUPABASE_SERVICE_KEY", "")
TONCENTER_KEY   = os.environ.get("TONCENTER_KEY", "")
TONAPI_KEY      = os.environ.get("TONAPI_KEY", "")

# ── TON wallet oracle ─────────────────────────────────────────
_oracle_wallet  = None
_oracle_kp      = None

async def get_oracle_wallet():
    """Inizializza il wallet oracle (lazy)."""
    global _oracle_wallet, _oracle_kp
    if _oracle_wallet:
        return _oracle_wallet, _oracle_kp
    try:
        from pytoniq_core.crypto.keys import mnemonic_to_private_key
        priv, pub = mnemonic_to_private_key(ORACLE_MNEMONIC.split())
        _oracle_kp = (bytes(priv), bytes(pub))
        _oracle_wallet = True  # flag init
        return _oracle_wallet, _oracle_kp
    except Exception as e:
        print(f"[ORACLE] Wallet init error: {e}")
        return None, None

# ── Costruttori messaggi Tact ────────────────────────────────
# I message op codes sono generati da Tact automaticamente
# Per TonBolaVault: 0x01=GamePayment, 0x02=PayWinner, 0x03=PayRank, 0x04=JackpotPayout

def build_pay_winner_boc(winner_addr: str, amount_nano: int,
                          game_id: int, win_type: int) -> str:
    """Costruisce il BOC del messaggio PayWinner per il contratto Tact."""
    try:
        from pytoniq_core import begin_cell, Address
        body = (begin_cell()
            .store_uint(0x02, 32)          # op = PayWinner
            .store_uint(game_id, 64)       # game_id
            .store_address(Address(winner_addr))  # winner
            .store_coins(amount_nano)      # amount
            .store_uint(win_type, 8)       # win_type: 0=line 1=bingo 2=pvp 3=jackpot
            .end_cell()
        )
        return base64.b64encode(body.to_boc()).decode()
    except Exception as e:
        raise ValueError(f"BOC build error: {e}")

def build_jackpot_payout_boc(winner_addr: str, amount_nano: int,
                               game_type: int) -> str:
    """Costruisce il BOC del messaggio JackpotPayout."""
    try:
        from pytoniq_core import begin_cell, Address
        body = (begin_cell()
            .store_uint(0x04, 32)          # op = JackpotPayout
            .store_uint(game_type, 8)      # 0=bingo 1=wheel 2=scratch
            .store_address(Address(winner_addr))
            .store_coins(amount_nano)
            .end_cell()
        )
        return base64.b64encode(body.to_boc()).decode()
    except Exception as e:
        raise ValueError(f"BOC build error: {e}")

def build_pay_rank_boc(rank_type: int, period_key: int,
                        winners: list) -> str:
    """Costruisce il BOC del messaggio PayRank (top 5)."""
    try:
        from pytoniq_core import begin_cell, Address
        # winners = [{address, amount_nano}, ...] max 5
        while len(winners) < 5:
            winners.append({"address": winners[0]["address"], "amount_nano": 0})
        b = begin_cell()
        b.store_uint(0x03, 32)              # op = PayRank
        b.store_uint(rank_type, 8)          # 0=weekly_ind 1=monthly_ind 2=weekly_squad 3=monthly_squad
        b.store_uint(period_key, 64)        # anti-replay
        for w in winners[:5]:
            b.store_address(Address(w["address"]))
            b.store_coins(w["amount_nano"])
        return base64.b64encode(b.end_cell().to_boc()).decode()
    except Exception as e:
        raise ValueError(f"BOC build error: {e}")

# ── Invia TX on-chain ─────────────────────────────────────────
async def send_to_contract(body_boc: str, attach_ton: int = 50_000_000):
    """
    Invia una transazione al vault dal wallet oracle.
    attach_ton: nanoton allegati al messaggio (per gas del contratto)
    """
    if not VAULT_ADDRESS:
        print("[ORACLE] VAULT_ADDRESS non configurato — skip TX")
        return False

    try:
        from pytoniq_core.crypto.keys import mnemonic_to_private_key
        from pytoniq_core import WalletV4R2, LiteBalancer
    except ImportError:
        # Fallback: usa toncenter API per inviare il BOC direttamente
        pass

    # Metodo più robusto: costruisci TX con @ton/ton via subprocess Node
    # (già installato sul VPS nel contratto)
    import subprocess, tempfile, os

    script = f"""
const {{ mnemonicToPrivateKey }} = require('@ton/crypto');
const {{ WalletContractV4, TonClient, internal, toNano, Cell, beginCell }} = require('@ton/ton');

async function main() {{
    const mnemonic = '{ORACLE_MNEMONIC}'.split(' ');
    const kp = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({{ publicKey: kp.publicKey, workchain: 0 }});

    const client = new TonClient({{
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: '{TONCENTER_KEY}'
    }});

    const wc = client.open(wallet);
    const seqno = await wc.getSeqno();

    const body = Cell.fromBoc(Buffer.from('{body_boc}', 'base64'))[0];

    await wc.sendTransfer({{
        seqno,
        secretKey: kp.secretKey,
        messages: [internal({{
            to: '{VAULT_ADDRESS}',
            value: BigInt({attach_ton}),
            body: body,
            bounce: true
        }})]
    }});

    console.log('TX_SENT seqno=' + seqno);
}}
main().catch(e => {{ console.error('TX_ERROR', e.message); process.exit(1); }});
"""

    # Salva script temporaneo nella dir con node_modules
    node_dir = "/root/tonbola-deploy/contract"
    if not os.path.exists(node_dir):
        node_dir = "/root/tbola"
    if not os.path.exists(node_dir):
        print(f"[ORACLE] node_dir non trovato — TX non inviata")
        return False

    with tempfile.NamedTemporaryFile(mode='w', suffix='.cjs',
                                      dir=node_dir, delete=False) as f:
        f.write(script)
        tmp = f.name

    try:
        r = subprocess.run(['node', tmp], capture_output=True, text=True,
                           timeout=30, cwd=node_dir)
        os.unlink(tmp)
        if 'TX_SENT' in r.stdout:
            print(f"[ORACLE] ✅ {r.stdout.strip()}")
            return True
        else:
            print(f"[ORACLE] ❌ TX error: {r.stderr[:200]}")
            return False
    except Exception as e:
        print(f"[ORACLE] send error: {e}")
        if os.path.exists(tmp):
            os.unlink(tmp)
        return False


# ── Auto-sweep oracle → owner ─────────────────────────────────
ORACLE_MAX_BALANCE = float(os.environ.get("ORACLE_MAX_TON", "2.0"))   # default 2 TON
ORACLE_KEEP        = float(os.environ.get("ORACLE_KEEP_TON", "0.5"))  # tieni sempre 0.5 TON
OWNER_WALLET       = os.environ.get("OWNER_WALLET",
    "UQCU4QrHnuuLUzu0qJEOwQFSTFol5ihNbmd0EkLX81zoJK5b")

async def check_and_sweep_oracle():
    """
    Controlla il balance oracle. Se supera ORACLE_MAX_BALANCE,
    invia il surplus all'owner automaticamente.
    Chiamato in background dopo ogni pagamento.
    """
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"https://tonapi.io/v2/accounts/UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l",
                timeout=8
            )
        d = r.json()
        balance_ton = int(d.get("balance", 0)) / 1e9

        if balance_ton > ORACLE_MAX_BALANCE:
            surplus_ton  = balance_ton - ORACLE_KEEP
            surplus_nano = int(surplus_ton * 1e9)
            print(f"[ORACLE SWEEP] Balance {balance_ton:.3f} TON > max {ORACLE_MAX_BALANCE} TON")
            print(f"[ORACLE SWEEP] Sending {surplus_ton:.3f} TON → {OWNER_WALLET}")

            # Costruisci TX: oracle → owner
            script = f"""
const {{ mnemonicToPrivateKey }} = require('@ton/crypto');
const {{ WalletContractV4, TonClient, internal, toNano }} = require('@ton/ton');
async function main() {{
    const kp = await mnemonicToPrivateKey('{ORACLE_MNEMONIC}'.split(' '));
    const wallet = WalletContractV4.create({{ publicKey: kp.publicKey, workchain: 0 }});
    const client = new TonClient({{ endpoint: 'https://toncenter.com/api/v2/jsonRPC', apiKey: '{TONCENTER_KEY}' }});
    const wc = client.open(wallet);
    const seqno = await wc.getSeqno();
    await wc.sendTransfer({{
        seqno, secretKey: kp.secretKey,
        messages: [internal({{
            to: '{OWNER_WALLET}',
            value: BigInt({surplus_nano}),
            body: 'oracle_sweep',
            bounce: false
        }})]
    }});
    console.log('SWEEP_SENT surplus=' + {surplus_ton:.4f});
}}
main().catch(e => console.error('SWEEP_ERROR', e.message));
"""
            import subprocess, tempfile
            node_dir = "/root/tonbola-deploy/contract"
            if not __import__('os').path.exists(node_dir):
                node_dir = "/root/tbola"
            with tempfile.NamedTemporaryFile(mode='w', suffix='.cjs',
                                              dir=node_dir, delete=False) as f:
                f.write(script)
                tmp = f.name
            r2 = subprocess.run(['node', tmp], capture_output=True, text=True,
                                timeout=30, cwd=node_dir)
            __import__('os').unlink(tmp)
            if 'SWEEP_SENT' in r2.stdout:
                print(f"[ORACLE SWEEP] ✅ Inviati {surplus_ton:.4f} TON all'owner")
            else:
                print(f"[ORACLE SWEEP] ❌ Errore: {r2.stderr[:100]}")
        else:
            print(f"[ORACLE] Balance OK: {balance_ton:.3f} TON (max: {ORACLE_MAX_BALANCE})")
    except Exception as e:
        print(f"[ORACLE SWEEP] error: {e}")

# ── Modelli API ───────────────────────────────────────────────
class PayWinnerReq(BaseModel):
    winner_wallet: str
    amount_ton: float
    game_id: int
    win_type: int = 1    # 0=line 1=bingo 2=pvp

class PayJackpotReq(BaseModel):
    winner_wallet: str
    amount_ton: float
    game_type: int       # 0=bingo 1=wheel 2=scratch

class PayRankReq(BaseModel):
    rank_type: int       # 0=weekly_ind 1=monthly_ind 2=weekly_squad 3=monthly_squad
    period_key: int      # unix timestamp del periodo (lunedì 00:00 UTC)
    winners: list        # [{address, amount_nano}, ...]

# ── Endpoints ─────────────────────────────────────────────────
@app.post("/oracle/pay-winner")
async def pay_winner(req: PayWinnerReq, bg: BackgroundTasks):
    """Chiamato dal backend dopo che una vincita è confermata. Paga il vincitore tramite contratto."""
    amount_nano = int(req.amount_ton * 1e9)
    if amount_nano <= 0:
        raise HTTPException(400, "Amount must be > 0")

    # Verifica non sia già pagato
    if SUPABASE_URL:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/bingo_games?id=eq.{req.game_id}&select=id,status",
                headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            )
        games = r.json()
        if games and games[0].get("status") == "paid":
            raise HTTPException(409, "Already paid")

    boc = build_pay_winner_boc(req.winner_wallet, amount_nano,
                                req.game_id, req.win_type)

    # Invia TX in background (non blocca la risposta)
    bg.add_task(send_to_contract, boc, 50_000_000)  # 0.05 TON per gas
    bg.add_task(check_and_sweep_oracle)  # controlla surplus oracle

    # Marca come payment_pending su Supabase
    if SUPABASE_URL:
        async with httpx.AsyncClient() as c:
            await c.patch(
                f"{SUPABASE_URL}/rest/v1/bingo_games?id=eq.{req.game_id}",
                json={"status": "payment_pending"},
                headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            )

    return {"status": "pending", "amount_ton": req.amount_ton,
            "winner": req.winner_wallet, "game_id": req.game_id}

@app.post("/oracle/pay-jackpot")
async def pay_jackpot(req: PayJackpotReq, bg: BackgroundTasks):
    """Chiamato quando il jackpot ≥ 5 TON e viene triggerato."""
    amount_nano = int(req.amount_ton * 1e9)
    boc = build_jackpot_payout_boc(req.winner_wallet, amount_nano, req.game_type)
    bg.add_task(send_to_contract, boc, 50_000_000)
    return {"status": "pending", "game_type": req.game_type,
            "winner": req.winner_wallet, "amount_ton": req.amount_ton}

@app.post("/oracle/pay-rank")
async def pay_rank(req: PayRankReq, bg: BackgroundTasks):
    """Chiamato ogni lunedì/1° del mese per i rank payout."""
    boc = build_pay_rank_boc(req.rank_type, req.period_key, req.winners)
    bg.add_task(send_to_contract, boc, 50_000_000)
    return {"status": "pending", "rank_type": req.rank_type,
            "period_key": req.period_key, "winners_count": len(req.winners)}

@app.get("/oracle/vault-status")
async def vault_status():
    """Controlla saldi e pool del vault via TON API getter."""
    if not VAULT_ADDRESS:
        return {"error": "VAULT_ADDRESS not configured"}
    async with httpx.AsyncClient() as c:
        r = await c.get(f"https://tonapi.io/v2/accounts/{VAULT_ADDRESS}")
    d = r.json()
    return {
        "balance_ton": int(d.get("balance", 0)) / 1e9,
        "status": d.get("status"),
        "vault": VAULT_ADDRESS
    }

@app.get("/oracle/health")
async def health():
    return {
        "status": "ok",
        "vault": VAULT_ADDRESS or "NOT CONFIGURED",
        "oracle": "UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l"
    }


@app.post("/oracle/set-max-balance")
async def set_max_balance(max_ton: float, keep_ton: float = 0.5):
    """Configura la soglia di auto-sweep (default: max=2 TON, keep=0.5 TON)."""
    global ORACLE_MAX_BALANCE, ORACLE_KEEP
    ORACLE_MAX_BALANCE = max_ton
    ORACLE_KEEP = keep_ton
    return {
        "oracle_max_ton": ORACLE_MAX_BALANCE,
        "oracle_keep_ton": ORACLE_KEEP,
        "note": f"Oracle invia il surplus all'owner quando supera {max_ton} TON"
    }

@app.get("/oracle/balance")
async def oracle_balance():
    """Controlla il balance corrente del wallet oracle."""
    async with httpx.AsyncClient() as c:
        r = await c.get(
            "https://tonapi.io/v2/accounts/UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l"
        )
    d = r.json()
    bal = int(d.get("balance", 0)) / 1e9
    return {
        "oracle_balance_ton": bal,
        "max_before_sweep": ORACLE_MAX_BALANCE,
        "keep_minimum": ORACLE_KEEP,
        "will_sweep": bal > ORACLE_MAX_BALANCE,
        "surplus_ton": max(0, bal - ORACLE_KEEP) if bal > ORACLE_MAX_BALANCE else 0
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
