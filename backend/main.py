"""
TonBola Backend — FastAPI v1.0
VPS: 95.217.10.201:8001
Uses only existing 13 Supabase tables.
"""
import os, json, random, asyncio, hashlib, hmac, uuid
from datetime import datetime, timedelta, timezone, date
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# ── Config ──
SUPABASE_URL = "https://lajeiwuumqbzcmdgsczq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhamVpd3V1bXFiemNtZGdzY3pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4NTgzNiwiZXhwIjoyMDkwMDYxODM2fQ.bmUUgJfpoOyj8QR9NfH_7Fyzg360VkuH-ReZsz-fRyk"
BOT_TOKEN = os.getenv("TONBOLA_BOT_TOKEN", "")
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"
JACKPOT_SENTINEL = "2099-01-01"  # week_start used as jackpot store
JACKPOT_THRESHOLD = 100.0

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── In-memory state ──
wheel_sessions: dict = {}    # session_id -> session data
bingo_rooms: dict = {}       # room_type -> room state
room_connections: dict = {}  # room_type -> [WebSocket]

# ── Wheel config ──
WHEEL_SEGMENTS = [
    {"label": "LOSE",    "mult": 0,   "idx": 0},
    {"label": "x0.5",   "mult": 0.5, "idx": 1},
    {"label": "LOSE",   "mult": 0,   "idx": 2},
    {"label": "x1",     "mult": 1,   "idx": 3},
    {"label": "LOSE",   "mult": 0,   "idx": 4},
    {"label": "x0.5",   "mult": 0.5, "idx": 5},
    {"label": "x2",     "mult": 2,   "idx": 6},
    {"label": "LOSE",   "mult": 0,   "idx": 7},
    {"label": "x1",     "mult": 1,   "idx": 8},
    {"label": "x5",     "mult": 5,   "idx": 9},
    {"label": "PASS",   "mult": -1,  "idx": 10},
    {"label": "JACKPOT","mult": -2,  "idx": 11},
]
WHEEL_PRICE = {"not": 250, "ton": 0.1}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("TonBola backend starting...")
    yield

app = FastAPI(title="TonBola API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ══════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════

def verify_telegram_init(init_data: str) -> dict:
    if not BOT_TOKEN:
        params = dict(p.split("=", 1) for p in init_data.split("&") if "=" in p)
        try:
            return json.loads(params.get("user", "{}"))
        except:
            return {"id": 12345, "first_name": "TestUser"}
    params = dict(p.split("=", 1) for p in init_data.split("&") if "=" in p)
    received_hash = params.pop("hash", "")
    data_check = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        raise HTTPException(401, "Invalid Telegram auth")
    return json.loads(params.get("user", "{}"))

def get_user(x_init_data: str = Header(default="")) -> dict:
    if not x_init_data:
        raise HTTPException(401, "Missing X-Init-Data")
    return verify_telegram_init(x_init_data)

def get_jackpot_pool() -> float:
    try:
        r = sb.table("leaderboard_weekly").select("score").eq("week_start", JACKPOT_SENTINEL).single().execute()
        return round(r.data["score"] / 10, 1)
    except:
        return 67.3

def set_jackpot_pool(value: float):
    try:
        score = int(value * 10)
        existing = sb.table("leaderboard_weekly").select("id").eq("week_start", JACKPOT_SENTINEL).execute()
        if existing.data:
            sb.table("leaderboard_weekly").update({"score": score}).eq("week_start", JACKPOT_SENTINEL).execute()
        else:
            sb.table("leaderboard_weekly").insert({"week_start": JACKPOT_SENTINEL, "score": score}).execute()
    except:
        pass

async def upsert_user(tg: dict) -> dict:
    tid = tg["id"]
    today = date.today().isoformat()
    data = {
        "telegram_id": tid,
        "first_name": tg.get("first_name", ""),
        "username": tg.get("username", ""),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        existing = sb.table("users").select("*").eq("telegram_id", tid).execute()
        if existing.data:
            u = existing.data[0]
            last = u.get("last_login_date", "")
            if last != today:
                yesterday = (date.today() - timedelta(days=1)).isoformat()
                data["streak_days"] = (u.get("streak_days", 0) + 1) if last == yesterday else 1
                data["last_login_date"] = today
            sb.table("users").update(data).eq("telegram_id", tid).execute()
        else:
            data.update({"id": tid, "last_login_date": today})
            sb.table("users").insert(data).execute()
        return sb.table("users").select("*").eq("telegram_id", tid).single().execute().data
    except Exception as e:
        return {"id": tid, **data, "level": 1, "xp": 0, "tbola_balance": 0, "error": str(e)}

# ══════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════

@app.get("/health")
def health():
    return {"status": "ok", "service": "tonbola-backend", "version": "1.0.0",
            "jackpot_pool": get_jackpot_pool()}

@app.post("/auth/login")
async def login(tg: dict = Depends(get_user)):
    user = await upsert_user(tg)
    return {"ok": True, "user": user}

@app.get("/user/me")
async def get_me(tg: dict = Depends(get_user)):
    return await upsert_user(tg)

# ── Jackpot ──
@app.get("/jackpot")
def jackpot():
    pool = get_jackpot_pool()
    return {"pool_ton": pool, "threshold": JACKPOT_THRESHOLD, "locked": pool < JACKPOT_THRESHOLD}

@app.post("/jackpot/contribute")
def jackpot_contribute(amount_ton: float):
    pool = get_jackpot_pool()
    set_jackpot_pool(pool + amount_ton)
    return {"pool_ton": pool + amount_ton}

# ── Leaderboard ──
@app.get("/leaderboard/weekly")
def lb_weekly(limit: int = 20):
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    try:
        rows = (sb.table("leaderboard_weekly")
                .select("score, rank, wins, user_id, users(first_name, username, avatar_preset)")
                .eq("week_start", week_start)
                .neq("week_start", JACKPOT_SENTINEL)
                .order("score", desc=True).limit(limit).execute())
        return {"week_start": week_start, "entries": rows.data}
    except Exception as e:
        return {"week_start": week_start, "entries": [], "error": str(e)}

@app.get("/leaderboard/monthly")
def lb_monthly(limit: int = 20):
    month_start = date.today().replace(day=1).isoformat()
    try:
        rows = (sb.table("leaderboard_monthly")
                .select("score, rank, wins, user_id, users(first_name, username, avatar_preset)")
                .eq("month_start", month_start)
                .order("score", desc=True).limit(limit).execute())
        return {"month_start": month_start, "entries": rows.data}
    except Exception as e:
        return {"month_start": month_start, "entries": [], "error": str(e)}

@app.get("/leaderboard/squads")
def lb_squads(limit: int = 20):
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    try:
        rows = (sb.table("leaderboard_squads_weekly")
                .select("score, rank, squad_id, squads(name, avatar_preset, member_count)")
                .eq("week_start", week_start)
                .order("score", desc=True).limit(limit).execute())
        return {"week_start": week_start, "entries": rows.data}
    except Exception as e:
        return {"week_start": week_start, "entries": [], "error": str(e)}

# ── Room stats ──
@app.get("/rooms/{room_type}/stats")
def room_stats(room_type: str):
    online = len(room_connections.get(room_type, []))
    return {"room_type": room_type, "online": online}

# ── Fortune Wheel ──
class WheelStartReq(BaseModel):
    currency: str
    spins: int

class WheelSpinReq(BaseModel):
    session_id: str

@app.post("/wheel/start")
def wheel_start(req: WheelStartReq, tg: dict = Depends(get_user)):
    if req.currency not in WHEEL_PRICE or req.spins < 1 or req.spins > 200:
        raise HTTPException(400, "Invalid params")
    price = WHEEL_PRICE[req.currency]
    sid = str(uuid.uuid4())
    wheel_sessions[sid] = {
        "user_id": tg["id"],
        "currency": req.currency,
        "spins_remaining": req.spins,
        "price_per_spin": price,
        "session_balance": 0.0,
        "active": True,
    }
    return {"ok": True, "session_id": sid, "price_per_spin": price,
            "total_cost": price * req.spins, "spins": req.spins}

@app.post("/wheel/spin")
def wheel_spin(req: WheelSpinReq, tg: dict = Depends(get_user)):
    sess = wheel_sessions.get(req.session_id)
    if not sess or sess["user_id"] != tg["id"] or not sess["active"]:
        raise HTTPException(400, "Session not found or expired")
    if sess["spins_remaining"] <= 0:
        raise HTTPException(400, "No spins remaining")

    pool = get_jackpot_pool()
    seg_idx = 11 if (pool >= JACKPOT_THRESHOLD and random.random() < 0.01) else random.randint(0, 10)
    seg = WHEEL_SEGMENTS[seg_idx]
    price = sess["price_per_spin"]
    won = 0.0
    result_type = "normal"

    if seg["mult"] == -2:  # JACKPOT
        won = pool * 0.8
        set_jackpot_pool(pool * 0.2)
        result_type = "jackpot"
        try:
            sb.table("tbola_ledger").insert({
                "user_id": tg["id"], "amount": int(won * 1000),
                "balance_after": 0, "type": "wheel_jackpot",
                "note": f"Jackpot win: {won:.2f} TON"
            }).execute()
        except: pass
    elif seg["mult"] == -1:  # PASS = free spin
        sess["spins_remaining"] += 1
        result_type = "free_spin"
    elif seg["mult"] == 0:
        result_type = "lose"
    else:
        won = round(price * seg["mult"], 4)
        result_type = "win"

    sess["spins_remaining"] -= 1
    sess["session_balance"] = round(sess["session_balance"] + won, 4)
    if sess["spins_remaining"] <= 0:
        sess["active"] = False

    # Grow jackpot pool from each spin
    if sess["currency"] == "ton":
        set_jackpot_pool(pool + price * 0.15)

    return {
        "seg_idx": seg_idx,
        "result_type": result_type,
        "won": won,
        "session_balance": sess["session_balance"],
        "spins_remaining": sess["spins_remaining"],
        "jackpot_pool": get_jackpot_pool(),
    }

@app.post("/wheel/collect")
def wheel_collect(session_id: str, tg: dict = Depends(get_user)):
    sess = wheel_sessions.get(session_id)
    if not sess or sess["user_id"] != tg["id"]:
        raise HTTPException(400, "Session not found")
    balance = sess["session_balance"]
    sess["session_balance"] = 0
    sess["active"] = False
    try:
        sb.table("tbola_ledger").insert({
            "user_id": tg["id"], "amount": int(balance * 1000),
            "balance_after": 0, "type": "wheel_collect",
            "note": f"Wheel collect: {balance} {sess['currency']}"
        }).execute()
    except: pass
    return {"ok": True, "collected": balance, "currency": sess["currency"]}


# ══════════════════════════════════════════
# TELEGRAM STARS PAYMENTS
# ══════════════════════════════════════════

ROOM_STARS = {"free": 0, "stars": 100, "ton": 50, "vip": 250}

@app.post("/payments/invoice")
async def create_invoice(room: str, n_cards: int, user_id: int = 0):
    price = ROOM_STARS.get(room, 50)
    if price == 0:
        return {"ok": True, "free": True, "invoice_url": None}
    total = price * n_cards
    if not BOT_TOKEN:
        return {"ok": False, "error": "Bot token not configured"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{TELEGRAM_API}/createInvoiceLink", json={
                "title": f"TonBola {room.upper()} Room",
                "description": f"{n_cards} bingo card{'s' if n_cards>1 else ''}",
                "payload": f"bingo:{room}:{n_cards}:{user_id}",
                "currency": "XTR",
                "prices": [{"label": f"{n_cards} card{'s' if n_cards>1 else ''}", "amount": total}],
            })
        data = resp.json()
        if not data.get("ok"):
            raise HTTPException(400, str(data))
        return {"ok": True, "invoice_url": data["result"], "stars": total}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/telegram/webhook")
async def telegram_webhook(req: Request):
    update = await req.json()
    if "pre_checkout_query" in update:
        pcq = update["pre_checkout_query"]
        async with httpx.AsyncClient() as client:
            await client.post(f"{TELEGRAM_API}/answerPreCheckoutQuery",
                json={"pre_checkout_query_id": pcq["id"], "ok": True})
    if "message" in update:
        msg = update["message"]
        if "successful_payment" in msg:
            sp = msg["successful_payment"]
            parts = sp.get("invoice_payload","").split(":")
            if len(parts)==4 and parts[0]=="bingo":
                uid = int(parts[3])
                try:
                    sb.table("tbola_ledger").insert({
                        "user_id": uid, "amount": sp["total_amount"],
                        "balance_after": 0, "type": "stars_payment",
                        "note": f"Stars: {sp['total_amount']} XTR room={parts[1]}"
                    }).execute()
                except: pass
    return {"ok": True}

# ══════════════════════════════════════════
# WEBSOCKET — Bingo Engine
# ══════════════════════════════════════════

def gen_card() -> list:
    ranges = [(1,15),(16,30),(31,45),(46,60),(61,75)]
    card = [random.sample(range(lo,hi+1), 5) for lo,hi in ranges]
    card[2][2] = 0  # FREE center
    return card

def check_line(card, marked):
    m = set(marked) | {0}
    for r in range(5):
        if all(card[c][r] in m for c in range(5)): return True
    for c in range(5):
        if all(card[c][r] in m for r in range(5)): return True
    return False

def check_bingo(card, marked):
    if not check_line(card, marked): return False
    nums = {card[c][r] for c in range(5) for r in range(5) if card[c][r] != 0}
    return nums.issubset(set(marked))

async def broadcast(room_id, msg):
    dead = []
    for ws in room_connections.get(room_id, []):
        try:
            await ws.send_json(msg)
        except:
            dead.append(ws)
    for d in dead:
        room_connections[room_id].remove(d)

async def draw_loop(room_id: str, game_id: str):
    numbers = list(range(1, 76))
    random.shuffle(numbers)
    drawn = []
    for num in numbers:
        await asyncio.sleep(3)
        room = bingo_rooms.get(room_id)
        if not room or room["status"] != "active": break
        drawn.append(num)
        room["drawn"] = drawn
        try:
            sb.table("games").update({
                "drawn_numbers": drawn,
                "last_drawn_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", game_id).execute()
        except: pass

        msg = {"type": "draw", "number": num, "drawn": drawn, "count": len(drawn)}
        line_winner = bingo_winner = None

        for uid, pd in room["players"].items():
            marked = set(drawn)
            for card in pd["cards"]:
                if not pd.get("has_line") and check_line(card, marked):
                    pd["has_line"] = True
                    line_winner = uid
                if pd.get("has_line") and check_bingo(card, marked):
                    pd["has_bingo"] = True
                    bingo_winner = uid

        if line_winner and not room.get("line_winner"):
            room["line_winner"] = line_winner
            msg["line_winner"] = line_winner
            msg["line_winner_name"] = room["players"][line_winner].get("name", "Player")

        if bingo_winner:
            room["status"] = "finished"
            msg["type"] = "game_over"
            msg["bingo_winner"] = bingo_winner
            msg["bingo_winner_name"] = room["players"][bingo_winner].get("name", "Player")
            try:
                sb.table("games").update({
                    "status": "finished",
                    "bingo_winner_id": int(bingo_winner),
                    "finished_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", game_id).execute()
            except: pass

        await broadcast(room_id, msg)
        if room["status"] == "finished": break

    await asyncio.sleep(60)
    bingo_rooms.pop(room_id, None)
    room_connections.pop(room_id, None)

@app.websocket("/ws/bingo/{room_type}")
async def bingo_ws(ws: WebSocket, room_type: str):
    from bingo_multiplayer import BingoRoomManager

    # Init manager (singleton)
    if not hasattr(app.state, "bingo_manager"):
        oracle_url = f"http://127.0.0.1:8001"
        app.state.bingo_manager = BingoRoomManager(sb, oracle_url)
    mgr: BingoRoomManager = app.state.bingo_manager

    await ws.accept()
    room = None
    user_id = None

    # Room config
    ROOM_CONFIG = {
        "free":  {"currency": "free",  "price": 0.0},
        "stars": {"currency": "usdt",  "price": 0.25},
        "ton":   {"currency": "ton",   "price": 0.20},
        "vip":   {"currency": "ton",   "price": 1.00},
    }
    cfg = ROOM_CONFIG.get(room_type, {"currency": "usdt", "price": 0.25})

    try:
        init = await ws.receive_json()
        user_id     = str(init.get("user_id", f"anon_{id(ws)}"))
        name        = init.get("name", "Player")
        cards_n     = max(1, min(int(init.get("cards", 1)), 6))
        wallet_addr = init.get("wallet_address", "")

        # Tag ws con user_id per notifiche
        ws._player_id = user_id

        # Get or create lobby
        room = mgr.get_or_create_lobby(room_type, cfg["currency"], cfg["price"])

        # Join room
        result = await mgr.join_room(room, user_id, name, cards_n, ws)
        if "error" in result:
            await ws.send_json({"type": "error", "message": result["error"]})
            return

        # Store wallet for payouts
        room.players[user_id]["wallet_address"] = wallet_addr

        # Send join confirmation
        jackpot = await mgr._get_jackpot(cfg["currency"])
        await ws.send_json({
            "type":              "joined",
            "cards":             result["cards"],
            "drawn":             room.drawn,
            "player_count":      room.player_count,
            "status":            room.status,
            "min_players":       5,
            "max_players":       20,
            "prize_pool":        round(room.prize_pool, 4),
            "jackpot":           round(jackpot, 4),
            "seconds_remaining": max(0, 300 - int(time.time() - room.created_at)),
            "room_id":           room.room_id,
        })

        # Broadcast new player to others
        await mgr._broadcast(room, {
            "type":         "player_joined",
            "player_count": room.player_count,
            "name":         name,
            "min_players":  5,
        })

        # Keep connection alive
        while True:
            try:
                data = await asyncio.wait_for(ws.receive_json(), timeout=60)
                if data.get("type") == "ping":
                    await ws.send_json({"type": "pong"})
                elif data.get("type") == "get_state":
                    jackpot = await mgr._get_jackpot(cfg["currency"])
                    await ws.send_json({
                        "type":         "state",
                        "drawn":        room.drawn,
                        "player_count": room.player_count,
                        "status":       room.status,
                        "prize_pool":   round(room.prize_pool, 4),
                        "jackpot":      round(jackpot, 4),
                    })
            except asyncio.TimeoutError:
                await ws.send_json({"type": "ping"})

    except Exception:
        pass
    finally:
        if room and user_id:
            mgr.leave_room(room, ws, user_id)


@app.get("/jackpot/bingo")
async def get_bingo_jackpot():
    """Get current bingo jackpot amounts"""
    try:
        r = sb.table("jackpot_pools").select("currency,amount").execute()
        result = {}
        for row in (r.data or []):
            result[row["currency"]] = row["amount"]
        # Defaults se non esistono
        for cur in ["usdt", "ton"]:
            if cur not in result:
                result[cur] = 5.0
        return result
    except:
        return {"usdt": 5.0, "ton": 5.0}


# ══════════════════════════════════════════
# ORACLE — PRIZE PAYOUT
# ══════════════════════════════════════════
ORACLE_PRIVATE_KEY_HEX = os.getenv("ORACLE_PRIVATE_KEY_HEX", "")
VAULT_ADDR = os.getenv("VAULT_ADDRESS", "UQB_Gcot0yD5pPCQ7qn4OvkLjLtU1zSfvuLh1IrVWbl_1HkR")
_payout_nonce = int(__import__("time").time() * 1000)

class PayoutReq(BaseModel):
    game_id: int
    winner_address: str
    amount_nano: int
    currency: str = "ton"
    game_type: str = "bingo"

@app.post("/pay_winner")
async def pay_winner(req: PayoutReq):
    global _payout_nonce
    if not ORACLE_PRIVATE_KEY_HEX:
        raise HTTPException(500, "Oracle key not configured — set ORACLE_PRIVATE_KEY_HEX env var")

    try:
        import nacl.signing
        import base64, re

        _payout_nonce += 1
        nonce = _payout_nonce

        # Decode TON address to 32-byte hash
        addr = req.winner_address.strip()
        # Remove bounceable/non-bounceable prefix (UQ/EQ/kQ/0Q etc) — base64url decode
        addr_b64 = addr.replace('-','+').replace('_','/')
        addr_bytes = base64.b64decode(addr_b64 + '==')
        # TON address: 1 byte flags + 1 byte workchain + 32 bytes hash + 2 bytes CRC
        addr_hash = addr_bytes[2:34]  # 32-byte hash

        # Build message to sign (mirrors Tact contract checkSignature)
        import struct
        msg = (
            addr_hash +
            req.amount_nano.to_bytes(8, 'big') +
            req.game_id.to_bytes(8, 'big') +
            nonce.to_bytes(8, 'big')
        )
        msg_hash = hashlib.sha256(msg).digest()

        # Sign
        priv = bytes.fromhex(ORACLE_PRIVATE_KEY_HEX)
        sk = nacl.signing.SigningKey(priv)
        sig = sk.sign(msg_hash).signature

        payload = {
            "vault_address": VAULT_ADDR,
            "winner_address": req.winner_address,
            "amount_nano": req.amount_nano,
            "game_id": req.game_id,
            "nonce": nonce,
            "signature_hex": sig.hex(),
            "currency": req.currency,
        }

        return {"success": True, "signed_payload": json.dumps(payload), "nonce": nonce}

    except Exception as e:
        raise HTTPException(500, f"Oracle error: {str(e)}")
