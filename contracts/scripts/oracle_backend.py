"""
TonBola Oracle Backend — FastAPI
Porta 8003 su VPS Hetzner.

Responsabilità:
  - Pagare vincitori bingo on-chain (PayWinner)
  - Pagare jackpot wheel/scratch on-chain (JackpotPayout)
  - Pagare rank pools ogni lunedì/1° mese (PayRank)
  - Auto-sweep oracle balance → owner quando > soglia
  - WithdrawDev per prelevare il 35% dev

Contratto: UQDF2yS_xqltxFi7M8DSx0yKza_UfQu2uP1kz82yvLRWQCuW
Oracle:    UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l
Owner:     UQCU4QrHnuuLUzu0qJEOwQFSTFol5ihNbmd0EkLX81zoJK5b
"""

import os, time, asyncio, json, base64, subprocess, tempfile
from typing import Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import httpx

app = FastAPI(title="TonBola Oracle", version="2.0")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────
VAULT_ADDRESS    = os.environ.get("VAULT_ADDRESS",
    "UQDF2yS_xqltxFi7M8DSx0yKza_UfQu2uP1kz82yvLRWQCuW")
ORACLE_MNEMONIC  = os.environ.get("ORACLE_MNEMONIC",
    "bulk royal camp fame baby accuse item method air reflect vendor "
    "bundle feel carpet rescue borrow switch bubble gentle grid summer "
    "fiction coffee token")
OWNER_WALLET     = os.environ.get("OWNER_WALLET",
    "UQCU4QrHnuuLUzu0qJEOwQFSTFol5ihNbmd0EkLX81zoJK5b")
SUPABASE_URL     = os.environ.get("SUPABASE_URL",
    "https://lajeiwuumqbzcmdgsczq.supabase.co")
SUPABASE_KEY     = os.environ.get("SUPABASE_SERVICE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhamVpd3V1bXFiemNtZGdzY3pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4NTgzNiwiZXhwIjoyMDkwMDYxODM2fQ.bmUUgJfpoOyj8QR9NfH_7Fyzg360VkuH-ReZsz-fRyk")
TONCENTER_KEY    = os.environ.get("TONCENTER_KEY", "")
NODE_DIR         = os.environ.get("NODE_DIR", "/root/tonbola-deploy/contract")

ORACLE_MAX_TON   = float(os.environ.get("ORACLE_MAX_TON", "2.0"))
ORACLE_KEEP_TON  = float(os.environ.get("ORACLE_KEEP_TON", "0.5"))

# ── Node.js TX sender ─────────────────────────────────────────
async def send_to_contract(msg_type: str, params: dict, attach_nano: int = 50_000_000) -> bool:
    """Invia una TX al vault dall'oracle wallet via Node.js (Node.js costruisce il BOC)."""
    params_json = json.dumps(params).replace("'", "\'")
    script = f"""
const {{ mnemonicToPrivateKey }} = require('@ton/crypto');
const {{ WalletContractV4, TonClient, internal, beginCell, Address, toNano }} = require('@ton/ton');

function buildBody(type, p) {{
    const b = beginCell();
    if (type === 'pay_winner') {{
        b.storeUint(0x02, 32);
        b.storeUint(BigInt(p.game_id), 64);
        b.storeAddress(Address.parse(p.winner));
        b.storeCoins(BigInt(p.amount_nano));
        b.storeUint(p.win_type || 1, 8);
    }} else if (type === 'jackpot') {{
        b.storeUint(0x04, 32);
        b.storeUint(p.game_type, 8);
        b.storeAddress(Address.parse(p.winner));
        b.storeCoins(BigInt(p.amount_nano));
    }} else if (type === 'pay_rank') {{
        b.storeUint(0x03, 32);
        b.storeUint(p.rank_type, 8);
        b.storeUint(BigInt(p.period_key), 64);
        for (const w of p.winners) {{
            b.storeAddress(Address.parse(w.address));
            b.storeCoins(BigInt(w.amount_nano));
        }}
    }} else if (type === 'withdraw_dev') {{
        b.storeUint(0x06, 32);
        b.storeCoins(BigInt(p.amount_nano));
    }} else if (type === 'direct') {{
        // No body — plain TON transfer
    }}
    return b.endCell();
}}

(async () => {{
    const mnemonic = `{ORACLE_MNEMONIC}`.trim().split(' ');
    const kp = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({{ publicKey: kp.publicKey, workchain: 0 }});
    const client = new TonClient({{ endpoint: 'https://toncenter.com/api/v2/jsonRPC' }});
    const wc = client.open(wallet);
    let seqno = 0;
    try {{ seqno = await wc.getSeqno(); }} catch(_e) {{ seqno = 0; }}
    const params = {params_json};
    const body = buildBody('{msg_type}', params);
    await wc.sendTransfer({{
        seqno,
        secretKey: kp.secretKey,
        messages: [internal({{
            to: '{VAULT_ADDRESS}',
            value: BigInt({attach_nano}),
            body,
            bounce: true
        }})]
    }});
    console.log('TX_OK seqno=' + seqno);
}})().catch(e => {{ console.error('TX_ERR', e.message); process.exit(1); }});
"""
    node_dir = NODE_DIR if os.path.exists(NODE_DIR) else "/root/tbola"
    with tempfile.NamedTemporaryFile(mode='w', suffix='.cjs', dir=node_dir, delete=False) as f:
        f.write(script); tmp = f.name
    try:
        r = subprocess.run(['node', tmp], capture_output=True, text=True, timeout=30, cwd=node_dir)
        os.unlink(tmp)
        if 'TX_OK' in r.stdout:
            print(f"[ORACLE] ✅ {r.stdout.strip()}")
            return True
        print(f"[ORACLE] ❌ {r.stderr[:200]}")
        return False
    except Exception as e:
        if os.path.exists(tmp): os.unlink(tmp)
        print(f"[ORACLE] send error: {e}")
        return False

async def send_ton_direct(to_addr: str, amount_nano: int, comment: str = "") -> bool:
    """Invia TON direttamente dall'oracle (per sweep/withdraw)."""
    script = f"""
const {{ mnemonicToPrivateKey }} = require('@ton/crypto');
const {{ WalletContractV4, TonClient, internal }} = require('@ton/ton');
(async () => {{
    const kp = await mnemonicToPrivateKey(`{ORACLE_MNEMONIC}`.trim().split(' '));
    const wallet = WalletContractV4.create({{ publicKey: kp.publicKey, workchain: 0 }});
    const client = new TonClient({{ endpoint: 'https://toncenter.com/api/v2/jsonRPC' }});
    const wc = client.open(wallet);
    let seqno = 0;
    try {{ seqno = await wc.getSeqno(); }} catch(_e) {{ seqno = 0; }}
    await wc.sendTransfer({{
        seqno, secretKey: kp.secretKey,
        messages: [internal({{ to: '{to_addr}', value: BigInt({amount_nano}), body: '{comment}', bounce: false }})]
    }});
    console.log('SEND_OK');
}})().catch(e => {{ console.error('SEND_ERR', e.message); process.exit(1); }});
"""
    node_dir = NODE_DIR if os.path.exists(NODE_DIR) else "/root/tbola"
    with tempfile.NamedTemporaryFile(mode='w', suffix='.cjs', dir=node_dir, delete=False) as f:
        f.write(script); tmp = f.name
    try:
        r = subprocess.run(['node', tmp], capture_output=True, text=True, timeout=30, cwd=node_dir)
        os.unlink(tmp)
        return 'SEND_OK' in r.stdout
    except Exception as e:
        if os.path.exists(tmp): os.unlink(tmp)
        return False

# ── TX sender (Node.js builds BOC + sends) ────────────────────
# BOC building moved entirely to Node.js to avoid pytoniq_core address issues

# ── Auto-sweep oracle → owner ─────────────────────────────────
async def check_and_sweep():
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(f"https://tonapi.io/v2/accounts/UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l", timeout=8)
        bal = int(r.json().get("balance", 0)) / 1e9
        if bal > ORACLE_MAX_TON:
            surplus = int((bal - ORACLE_KEEP_TON) * 1e9)
            print(f"[SWEEP] Balance {bal:.3f} TON > {ORACLE_MAX_TON} → sweeping {surplus/1e9:.3f} TON to owner")
            await send_ton_direct(OWNER_WALLET, surplus, "oracle_sweep")
    except Exception as e:
        print(f"[SWEEP] error: {e}")

# ── Helpers Supabase ──────────────────────────────────────────
async def sb_get(path: str):
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{SUPABASE_URL}/rest/v1/{path}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, timeout=8)
    return r.json()

async def sb_patch(path: str, data: dict):
    async with httpx.AsyncClient() as c:
        await c.patch(f"{SUPABASE_URL}/rest/v1/{path}", json=data,
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                     "Content-Type": "application/json"}, timeout=8)

# ── Modelli ───────────────────────────────────────────────────
class PayWinnerReq(BaseModel):
    winner_wallet: str
    amount_ton: float
    game_id: int
    win_type: int = 1   # 0=line 1=bingo 2=pvp

class PayJackpotReq(BaseModel):
    winner_wallet: str
    amount_ton: float
    game_type: int       # 0=bingo 1=wheel 2=scratch

class RankWinner(BaseModel):
    address: str
    amount_nano: int

class PayRankReq(BaseModel):
    rank_type: int       # 0=weekly_ind 1=monthly_ind 2=weekly_squad 3=monthly_squad
    period_key: int
    winners: List[RankWinner]

class WithdrawDevReq(BaseModel):
    amount_ton: float
    secret: str          # protezione minima

# ── Endpoints ─────────────────────────────────────────────────

@app.post("/oracle/pay-winner")
async def pay_winner(req: PayWinnerReq, bg: BackgroundTasks):
    """Paga il vincitore di una partita bingo/pvp dal vault."""
    amount_nano = int(req.amount_ton * 1e9)
    if amount_nano <= 0:
        raise HTTPException(400, "Amount must be > 0")

    # Anti-double-pay: verifica stato partita (skip se game non esiste in DB)
    try:
        rows = await sb_get(f"games?id=eq.{req.game_id}&select=id,status")
        if isinstance(rows, list) and rows and rows[0].get("status") in ("paid", "payment_pending"):
            raise HTTPException(409, f"Game {req.game_id} already paid/pending")
    except HTTPException:
        raise
    except Exception:
        pass  # game non in DB, procedi comunque

    # Marca pending (ignora se game non in DB)
    try:
        await sb_patch(f"games?id=eq.{req.game_id}", {"status": "payment_pending"})
    except Exception:
        pass

    params = {
        "winner": req.winner_wallet,
        "amount_nano": amount_nano,
        "game_id": req.game_id,
        "win_type": req.win_type
    }

    # Invia TX in background
    async def do_pay():
        ok = await send_to_contract("pay_winner", params, 50_000_000)
        status = "paid" if ok else "payment_failed"
        await sb_patch(f"games?id=eq.{req.game_id}", {"status": status})
        await check_and_sweep()

    bg.add_task(do_pay)
    return {"status": "pending", "game_id": req.game_id,
            "amount_ton": req.amount_ton, "winner": req.winner_wallet}


@app.post("/oracle/pay-jackpot")
async def pay_jackpot(req: PayJackpotReq, bg: BackgroundTasks):
    """Paga il jackpot wheel o scratch."""
    amount_nano = int(req.amount_ton * 1e9)
    params = {
        "winner": req.winner_wallet,
        "amount_nano": amount_nano,
        "game_type": req.game_type
    }

    async def do_pay():
        await send_to_contract("jackpot", params, 50_000_000)
        await check_and_sweep()

    bg.add_task(do_pay)
    return {"status": "pending", "game_type": req.game_type,
            "winner": req.winner_wallet, "amount_ton": req.amount_ton}


@app.post("/oracle/pay-rank")
async def pay_rank(req: PayRankReq, bg: BackgroundTasks):
    """Paga i top 5 del rank pool. Chiamato dal cron job."""
    winners = [{"address": w.address, "amount_nano": w.amount_nano} for w in req.winners]
    # Pad to 5 winners
    while len(winners) < 5:
        winners.append({"address": winners[0]["address"], "amount_nano": 0})
    params = {"rank_type": req.rank_type, "period_key": req.period_key, "winners": winners[:5]}
    bg.add_task(send_to_contract, "pay_rank", params, 50_000_000)
    return {"status": "pending", "rank_type": req.rank_type,
            "period_key": req.period_key, "winners": len(req.winners)}


@app.post("/oracle/withdraw-dev")
async def withdraw_dev(req: WithdrawDevReq, bg: BackgroundTasks):
    """Ritira il dev balance (35%) dal vault all'owner."""
    if req.secret != os.environ.get("ADMIN_SECRET", "tonbola-dev-2026"):
        raise HTTPException(403, "Forbidden")
    amount_nano = int(req.amount_ton * 1e9)
    params = {"amount_nano": amount_nano}
    bg.add_task(send_to_contract, "withdraw_dev", params, 20_000_000)
    return {"status": "pending", "amount_ton": req.amount_ton,
            "note": "WithdrawDev sent to vault — funds go to owner wallet"}


@app.post("/oracle/set-max-balance")
async def set_max_balance(max_ton: float, keep_ton: float = 0.5):
    global ORACLE_MAX_TON, ORACLE_KEEP_TON
    ORACLE_MAX_TON = max_ton
    ORACLE_KEEP_TON = keep_ton
    return {"oracle_max_ton": ORACLE_MAX_TON, "oracle_keep_ton": ORACLE_KEEP_TON}


@app.get("/oracle/vault-status")
async def vault_status():
    async with httpx.AsyncClient() as c:
        r = await c.get(f"https://tonapi.io/v2/accounts/{VAULT_ADDRESS}", timeout=8)
    d = r.json()
    return {
        "vault": VAULT_ADDRESS,
        "balance_ton": int(d.get("balance", 0)) / 1e9,
        "status": d.get("status"),
    }


@app.get("/oracle/balance")
async def oracle_balance():
    async with httpx.AsyncClient() as c:
        r = await c.get("https://tonapi.io/v2/accounts/UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l", timeout=8)
    bal = int(r.json().get("balance", 0)) / 1e9
    return {"oracle_balance_ton": bal, "max_before_sweep": ORACLE_MAX_TON,
            "will_sweep": bal > ORACLE_MAX_TON}


@app.get("/oracle/health")
async def health():
    return {"status": "ok", "vault": VAULT_ADDRESS,
            "oracle": "UQA3AUgpuq-MtHI26RhOr6MfGFtxMfa7C_N_ZDhK8yYnY17l",
            "owner": OWNER_WALLET}


# ── Cron rank (da chiamare ogni lunedì) ───────────────────────
@app.post("/oracle/cron-rank-weekly")
async def cron_rank_weekly(secret: str, bg: BackgroundTasks):
    """Eseguito ogni lunedì. Legge top 5 da Supabase e paga dal contratto."""
    if secret != os.environ.get("ADMIN_SECRET", "tonbola-dev-2026"):
        raise HTTPException(403, "Forbidden")

    # Calcola period_key = lunedì di questa settimana (Unix timestamp)
    import datetime
    now = datetime.datetime.utcnow()
    monday = now - datetime.timedelta(days=now.weekday())
    period_key = int(monday.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())

    async def do_rank():
        try:
            # Leggi top 5 dalla leaderboard settimanale
            week_start = monday.strftime("%Y-%m-%d")
            rows = await sb_get(
                f"leaderboard_weekly?week_start=eq.{week_start}&order=score.desc&limit=5"
                f"&select=user_id,score,users(wallet_address)"
            )
            if not rows:
                print(f"[RANK] No players for week {week_start}")
                return

            # Leggi il pool disponibile dal contratto getter
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"https://tonapi.io/v2/blockchain/accounts/{VAULT_ADDRESS}/methods/rankWeeklyInd",
                    timeout=8)
            pool_nano = int(r.json().get("decoded", {}).get("rankWeeklyInd", 0) or
                           r.json().get("stack", [{}])[0].get("num", 0))

            if pool_nano <= 0:
                print("[RANK] Pool is empty, skip")
                return

            # Distribuzione: 40/25/15/10/10 percent
            dist = [0.40, 0.25, 0.15, 0.10, 0.10]
            winners = []
            for i, row in enumerate(rows[:5]):
                wallet = (row.get("users") or {}).get("wallet_address")
                if not wallet:
                    continue
                amount = int(pool_nano * dist[i])
                winners.append({"address": wallet, "amount_nano": amount})

            if not winners:
                print("[RANK] No valid wallet addresses found")
                return

            params = {"rank_type": 0, "period_key": period_key, "winners": winners}
            ok = await send_to_contract("pay_rank", params, 50_000_000)
            print(f"[RANK] Weekly individual: {'OK' if ok else 'FAILED'}, {len(winners)} winners, pool={pool_nano/1e9:.4f} TON")
        except Exception as e:
            print(f"[RANK] Error: {e}")

    bg.add_task(do_rank)
    return {"status": "pending", "period_key": period_key}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
