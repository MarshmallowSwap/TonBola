"""
TonBola — Multiplayer Bingo Engine
- Min 5 giocatori, max 20 per stanza
- Timer 5 minuti per riempire la stanza
- Apertura automatica stanza successiva
- Jackpot: 4 angoli + numero centrale
- Estrazione ogni 3 secondi (server-side)
- Auto-payout via oracle
"""
import asyncio, random, json, time, hashlib
from datetime import datetime, timezone
from typing import Optional

# ── Costanti ─────────────────────────────────────────────────
MIN_PLAYERS    = 1  # TEST: abbassare a 5 per lancio
MAX_PLAYERS    = 20
LOBBY_TIMEOUT  = 30    # TEST: 30s per test rapido (rimettere 300 per lancio)
DRAW_INTERVAL  = 3     # secondi tra estrazioni
COUNTDOWN_SECS = 10    # countdown prima del via

# Split percentuali
PRIZE_PCT   = 0.50   # 50% ai giocatori
JACKPOT_PCT = 0.05   # 5% jackpot
DEV_PCT     = 0.32
TOKEN_PCT   = 0.08
LB_PCT      = 0.03
PLAT_PCT    = 0.02

LINE_WIN_PCT  = 0.25  # 25% della prize pool
BINGO_WIN_PCT = 0.75  # 75% della prize pool

# ── Room state machine ────────────────────────────────────────
# LOBBY → COUNTDOWN → PLAYING → FINISHED

class BingoRoom:
    def __init__(self, room_id: str, room_type: str, currency: str, price: float):
        self.room_id    = room_id
        self.room_type  = room_type
        self.currency   = currency
        self.price      = price
        self.status     = "lobby"       # lobby/countdown/playing/finished
        self.players    = {}            # user_id -> player_data
        self.draw_seq   = []            # numeri da 1-90 in ordine casuale
        self.drawn      = []            # numeri estratti finora
        self.connections = []           # WebSocket connections
        self.created_at = time.time()
        self.started_at = None
        self.game_id    = None
        self.line_winner = None
        self.bingo_winner = None
        self.jackpot_winner = None
        self.lobby_task = None
        self.draw_task  = None

    @property
    def player_count(self):
        return len(self.players)

    @property
    def prize_pool(self):
        """Prize pool totale (50% di tutti i pagamenti)"""
        total_cards = sum(p["cards_n"] for p in self.players.values())
        return self.price * total_cards * PRIZE_PCT

    @property
    def jackpot_contribution(self):
        total_cards = sum(p["cards_n"] for p in self.players.values())
        return self.price * total_cards * JACKPOT_PCT

    def is_jackpot_pattern(self, card: list) -> bool:
        """
        Jackpot: 4 angoli + numero centrale
        Card è una lista di 15 numeri in griglia 3×5:
        [0]  [1]  [2]  [3]  [4]
        [5]  [6]  [7]  [8]  [9]
        [10] [11] [12] [13] [14]
        Angoli: 0, 4, 10, 14
        Centro: 7
        """
        jackpot_positions = [0, 4, 7, 10, 14]
        jackpot_numbers = [card[i] for i in jackpot_positions]
        return all(n in self.drawn for n in jackpot_numbers)

    def check_line(self, card: list) -> bool:
        """Riga completa (qualsiasi delle 3 righe)"""
        for r in range(3):
            row = card[r*5:(r+1)*5]
            if all(n in self.drawn for n in row):
                return True
        return False

    def check_bingo(self, card: list) -> bool:
        """Cartella completa"""
        return all(n in self.drawn for n in card)

    def to_dict(self):
        return {
            "room_id":      self.room_id,
            "room_type":    self.room_type,
            "currency":     self.currency,
            "price":        self.price,
            "status":       self.status,
            "player_count": self.player_count,
            "drawn":        self.drawn,
            "prize_pool":   round(self.prize_pool, 4),
            "line_prize":   round(self.prize_pool * LINE_WIN_PCT, 4),
            "bingo_prize":  round(self.prize_pool * BINGO_WIN_PCT, 4),
            "created_at":   self.created_at,
        }


class BingoRoomManager:
    def __init__(self, supabase_client, oracle_url: str):
        self.sb          = supabase_client
        self.oracle_url  = oracle_url
        self.rooms: dict[str, BingoRoom] = {}      # room_id -> BingoRoom
        self.active_by_type: dict[str, str] = {}   # room_type -> active room_id
        # Jackpot pools persistiti su Supabase
        self._jackpot_cache: dict[str, float] = {}  # currency -> amount

    def get_or_create_lobby(self, room_type: str, currency: str, price: float) -> BingoRoom:
        """Restituisce la stanza in lobby per questo tipo, creandola se non esiste"""
        room_id = self.active_by_type.get(room_type)
        if room_id and room_id in self.rooms:
            room = self.rooms[room_id]
            if room.status == "lobby" and room.player_count < MAX_PLAYERS:
                return room

        # Crea nuova stanza
        room_id = f"{room_type}_{int(time.time()*1000)}"
        room = BingoRoom(room_id, room_type, currency, price)
        self.rooms[room_id] = room
        self.active_by_type[room_type] = room_id
        return room

    async def join_room(self, room: BingoRoom, user_id: str, name: str,
                        cards_n: int, ws) -> dict:
        """Aggiunge un giocatore alla stanza e restituisce le sue carte"""
        if room.status != "lobby":
            return {"error": "room_not_in_lobby"}
        if room.player_count >= MAX_PLAYERS:
            return {"error": "room_full"}

        # Genera carte server-side (deterministico)
        cards = [self._gen_card() for _ in range(cards_n)]
        room.players[user_id] = {
            "name":     name,
            "cards":    cards,
            "cards_n":  cards_n,
            "has_line": False,
            "has_bingo": False,
            "has_jackpot": False,
        }
        room.connections.append(ws)

        # Avvia timer lobby se è il primo giocatore
        if room.player_count == 1 and not room.lobby_task:
            room.lobby_task = asyncio.create_task(
                self._lobby_timer(room)
            )

        # Parte subito se ha raggiunto MAX_PLAYERS
        if room.player_count >= MAX_PLAYERS:
            if room.lobby_task:
                room.lobby_task.cancel()
            asyncio.create_task(self._start_countdown(room))

        return {"cards": cards, "room": room.to_dict()}

    async def _lobby_timer(self, room: BingoRoom):
        """Aspetta LOBBY_TIMEOUT secondi, poi parte se ci sono abbastanza giocatori"""
        try:
            # Manda aggiornamenti countdown ogni 30s
            elapsed = 0
            while elapsed < LOBBY_TIMEOUT:
                await asyncio.sleep(30)
                elapsed += 30
                remaining = LOBBY_TIMEOUT - elapsed
                await self._broadcast(room, {
                    "type": "lobby_update",
                    "player_count": room.player_count,
                    "seconds_remaining": remaining,
                    "min_players": MIN_PLAYERS,
                })

            # Tempo scaduto
            if room.player_count >= MIN_PLAYERS:
                await self._start_countdown(room)
            elif room.player_count >= 2:
                # Parte lo stesso ma con avviso
                await self._broadcast(room, {
                    "type": "lobby_warning",
                    "message": f"Solo {room.player_count} giocatori — la partita parte con prize pool ridotta"
                })
                await self._start_countdown(room)
            else:
                # Rimborso — troppo pochi giocatori
                await self._broadcast(room, {
                    "type": "lobby_cancelled",
                    "message": "Partita annullata — troppo pochi giocatori. Rimborso in arrivo."
                })
                room.status = "finished"
        except asyncio.CancelledError:
            pass

    async def _start_countdown(self, room: BingoRoom):
        """Countdown di 10 secondi poi inizia la partita"""
        room.status = "countdown"
        # Apri già la prossima stanza
        self.active_by_type[room.room_type] = None  # forza creazione nuova

        for i in range(COUNTDOWN_SECS, 0, -1):
            await self._broadcast(room, {
                "type": "countdown",
                "seconds": i,
                "player_count": room.player_count,
                "prize_pool": round(room.prize_pool, 4),
                "line_prize": round(room.prize_pool * LINE_WIN_PCT, 4),
                "bingo_prize": round(room.prize_pool * BINGO_WIN_PCT, 4),
            })
            await asyncio.sleep(1)

        await self._start_game(room)

    async def _start_game(self, room: BingoRoom):
        """Avvia la partita: genera sequenza, salva su DB, inizia draw loop"""
        room.status = "playing"
        room.started_at = time.time()

        # Sequenza estrazione server-side (seed da player data per fairness)
        seed_str = json.dumps([room.room_id] + sorted(room.players.keys()))
        seed = int(hashlib.sha256(seed_str.encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)
        room.draw_seq = list(range(1, 91))
        rng.shuffle(room.draw_seq)

        # Salva su Supabase
        try:
            total_cards = sum(p["cards_n"] for p in room.players.values())
            result = self.sb.table("games").insert({
                "currency":   room.currency,
                "status":     "active",
                "started_at": datetime.now(timezone.utc).isoformat(),
                "player_count": room.player_count,
                "prize_pool": room.prize_pool,
            }).execute()
            room.game_id = result.data[0]["id"]
        except Exception as e:
            room.game_id = f"local-{room.room_id}"

        # Contribuisci al jackpot
        await self._add_to_jackpot(room.currency, room.jackpot_contribution)

        jackpot_amount = await self._get_jackpot(room.currency)

        await self._broadcast(room, {
            "type":         "game_start",
            "player_count": room.player_count,
            "prize_pool":   round(room.prize_pool, 4),
            "line_prize":   round(room.prize_pool * LINE_WIN_PCT, 4),
            "bingo_prize":  round(room.prize_pool * BINGO_WIN_PCT, 4),
            "jackpot":      round(jackpot_amount, 4),
            "currency":     room.currency,
            "draw_interval": DRAW_INTERVAL,
        })

        room.draw_task = asyncio.create_task(self._draw_loop(room))

    async def _draw_loop(self, room: BingoRoom):
        """Estrae un numero ogni DRAW_INTERVAL secondi e controlla vincitori"""
        try:
            for number in room.draw_seq:
                if room.status != "playing":
                    break

                room.drawn.append(number)
                jackpot_amount = self._jackpot_cache.get(room.currency, 0.0)
                wins = self._check_all_wins(room, number, jackpot_amount)

                msg = {
                    "type":   "draw",
                    "number": number,
                    "drawn":  room.drawn,
                    "count":  len(room.drawn),
                }
                msg.update(wins)

                await self._broadcast(room, msg)

                # Se c'è stato bingo, fine partita
                if wins.get("bingo_winner"):
                    await asyncio.sleep(2)
                    await self._finish_game(room)
                    break

                await asyncio.sleep(DRAW_INTERVAL)

            # Tutti i numeri estratti senza bingo
            if room.status == "playing":
                await self._finish_game(room)

        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Draw loop error: {e}")

    def _check_all_wins(self, room: BingoRoom, last_number: int, jackpot_amount: float = 0.0) -> dict:
        """Controlla vincitori su tutte le carte di tutti i giocatori"""
        result = {}

        for uid, player in room.players.items():
            for ci, card in enumerate(player["cards"]):

                # Jackpot: 4 angoli + centro — solo se sopra soglia minima
                min_jp = self.JACKPOT_MIN.get(room.currency, 10.0)
                if not room.jackpot_winner and not player["has_jackpot"] and jackpot_amount >= min_jp:
                    if room.is_jackpot_pattern(card):
                        room.jackpot_winner = uid
                        player["has_jackpot"] = True
                        result["jackpot_winner"] = uid
                        result["jackpot_winner_name"] = player["name"]
                        result["jackpot_card_idx"] = ci

                # Linea
                if not room.line_winner and not player["has_line"]:
                    if room.check_line(card):
                        room.line_winner = uid
                        player["has_line"] = True
                        result["line_winner"] = uid
                        result["line_winner_name"] = player["name"]
                        result["line_prize"] = round(room.prize_pool * LINE_WIN_PCT, 4)

                # Bingo (full house)
                if not room.bingo_winner and not player["has_bingo"]:
                    if room.check_bingo(card):
                        room.bingo_winner = uid
                        player["has_bingo"] = True
                        result["bingo_winner"] = uid
                        result["bingo_winner_name"] = player["name"]
                        result["bingo_prize"] = round(room.prize_pool * BINGO_WIN_PCT, 4)

        return result

    async def _finish_game(self, room: BingoRoom):
        """Chiude la partita e paga i vincitori"""
        room.status = "finished"

        jackpot_amount = await self._get_jackpot(room.currency)

        summary = {
            "type":           "game_over",
            "drawn":          room.drawn,
            "line_winner":    room.line_winner,
            "bingo_winner":   room.bingo_winner,
            "jackpot_winner": room.jackpot_winner,
            "prize_pool":     round(room.prize_pool, 4),
            "jackpot":        round(jackpot_amount, 4),
            "currency":       room.currency,
        }

        if room.line_winner:
            summary["line_prize"] = round(room.prize_pool * LINE_WIN_PCT, 4)
        if room.bingo_winner:
            summary["bingo_prize"] = round(room.prize_pool * BINGO_WIN_PCT, 4)
        if room.jackpot_winner:
            summary["jackpot_prize"] = round(jackpot_amount, 4)
            # Reset jackpot
            await self._reset_jackpot(room.currency)

        await self._broadcast(room, summary)

        # Aggiorna DB
        try:
            self.sb.table("games").update({
                "status":     "finished",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "winner_id":  room.bingo_winner,
            }).eq("id", room.game_id).execute()
        except: pass

        # Paga i vincitori via oracle
        asyncio.create_task(self._payout_winners(room, jackpot_amount))

    async def _payout_winners(self, room: BingoRoom, jackpot_amount: float):
        """Chiama oracle per pagare linea, bingo, jackpot"""
        import httpx
        winners_to_pay = []

        if room.line_winner and room.line_winner in room.players:
            winners_to_pay.append({
                "uid":     room.line_winner,
                "amount":  room.prize_pool * LINE_WIN_PCT,
                "type":    "line"
            })
        if room.bingo_winner and room.bingo_winner in room.players:
            winners_to_pay.append({
                "uid":     room.bingo_winner,
                "amount":  room.prize_pool * BINGO_WIN_PCT,
                "type":    "bingo"
            })
        if room.jackpot_winner and room.jackpot_winner in room.players:
            winners_to_pay.append({
                "uid":     room.jackpot_winner,
                "amount":  jackpot_amount,
                "type":    "jackpot"
            })

        for w in winners_to_pay:
            player = room.players[w["uid"]]
            wallet = player.get("wallet_address")
            if not wallet:
                continue

            decimals = 6 if room.currency == "usdt" else 9
            amount_nano = int(w["amount"] * (10 ** decimals))

            try:
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        f"http://127.0.0.1:8001/pay_winner",
                        json={
                            "game_id":        int(room.game_id) if str(room.game_id).isdigit() else 0,
                            "winner_address": wallet,
                            "amount_nano":    amount_nano,
                            "currency":       room.currency,
                            "game_type":      f"bingo_{w['type']}",
                        },
                        timeout=15
                    )
                    if r.status_code == 200:
                        data = r.json()
                        print(f"✅ Payout {w['type']}: {w['amount']} {room.currency} → {wallet[:12]}...")
                        # Notifica giocatore vincitore
                        await self._notify_winner(room, w["uid"], data.get("signed_payload", ""), w)
            except Exception as e:
                print(f"⚠️ Payout error: {e}")

    async def _notify_winner(self, room: BingoRoom, uid: str, signed_payload: str, win: dict):
        """Manda notifica di pagamento al giocatore vincitore"""
        for ws in room.connections:
            try:
                player_id = getattr(ws, "_player_id", None)
                if player_id == uid:
                    await ws.send_json({
                        "type":           "payout_ready",
                        "win_type":       win["type"],
                        "amount":         win["amount"],
                        "currency":       room.currency,
                        "signed_payload": signed_payload,
                    })
            except: pass

    async def _broadcast(self, room: BingoRoom, msg: dict):
        dead = []
        for ws in room.connections:
            try:
                await ws.send_json(msg)
            except:
                dead.append(ws)
        for ws in dead:
            room.connections.remove(ws)

    async def _add_to_jackpot(self, currency: str, amount: float):
        try:
            key = f"jackpot_{currency}"
            current = self._jackpot_cache.get(currency, 0)
            new_val = current + amount
            self._jackpot_cache[currency] = new_val
            # Persist to Supabase jackpot table
            self.sb.table("jackpot_pools").upsert({
                "currency": currency,
                "amount": new_val,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        except Exception as e:
            print(f"Jackpot update error: {e}")

    # Soglia minima per pagare il jackpot
    JACKPOT_MIN = {"usdt": 10.0, "ton": 2.0}

    async def _get_jackpot(self, currency: str) -> float:
        if currency not in self._jackpot_cache:
            try:
                r = self.sb.table("jackpot_pools").select("amount").eq("currency", currency).single().execute()
                self._jackpot_cache[currency] = float(r.data.get("amount", 0.0))
            except:
                self._jackpot_cache[currency] = 0.0  # parte da 0
        return self._jackpot_cache.get(currency, 0.0)

    async def _reset_jackpot(self, currency: str):
        seed = 0.0  # riparte da 0 dopo vincita
        self._jackpot_cache[currency] = seed
        try:
            self.sb.table("jackpot_pools").upsert({
                "currency": currency,
                "amount": seed,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        except: pass

    def _gen_card(self) -> list:
        nums = list(range(1, 91))
        random.shuffle(nums)
        return sorted(nums[:15])

    def leave_room(self, room: BingoRoom, ws, user_id: str):
        if ws in room.connections:
            room.connections.remove(ws)
        # Non rimuovere il giocatore se la partita è in corso
