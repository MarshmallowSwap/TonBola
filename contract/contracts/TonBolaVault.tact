// ═══════════════════════════════════════════════════════════════
//  TonBolaVault — Contratto Master TonBola
//  TON-only · Split universale · Prize pools · Rank pools
//
//  SPLIT per ogni TON ricevuto:
//    55.0% → Prize Pool partita
//     5.0% → Jackpot Pool (per gioco)
//     1.5% → Rank Weekly Individual
//     1.0% → Rank Monthly Individual
//     1.0% → Rank Weekly Squad
//     0.5% → Rank Monthly Squad
//    36.0% → Dev / Operations
// ═══════════════════════════════════════════════════════════════

import "@stdlib/deploy";
import "@stdlib/ownable";

// ── Messaggi ─────────────────────────────────────────────────

message(0x01) GamePayment {
    game_type: Int as uint8;   // 0=bingo 1=wheel 2=scratch
    game_id:   Int as uint64;  // ID partita/sessione
}

message(0x02) PayWinner {
    game_id:  Int as uint64;
    winner:   Address;
    amount:   Int as coins;
    win_type: Int as uint8;    // 0=line 1=bingo 2=pvp 3=jackpot
}

message(0x03) PayRank {
    rank_type:  Int as uint8;
    period_key: Int as uint64;
    w1: Address; a1: Int as coins;
    w2: Address; a2: Int as coins;
    w3: Address; a3: Int as coins;
    w4: Address; a4: Int as coins;
    w5: Address; a5: Int as coins;
}

message(0x04) JackpotPayout {
    game_type: Int as uint8;
    winner:    Address;
    amount:    Int as coins;
}

message(0x05) SetOracle  { oracle: Address; }
message(0x06) WithdrawDev { amount: Int as coins; }

// ── Struct ────────────────────────────────────────────────────

struct GamePool {
    amount:    Int as coins;
    game_type: Int as uint8;
    paid_out:  Bool;
}

// ── Contratto ─────────────────────────────────────────────────

contract TonBolaVault with Deployable, Ownable {

    owner:   Address;
    oracle:  Address;

    // Prize pools (game_id → pool)
    game_pools: map<Int, GamePool>;

    // Jackpot pools
    jackpot_bingo:   Int as coins = 0;
    jackpot_wheel:   Int as coins = 0;
    jackpot_scratch: Int as coins = 0;

    // Rank pools
    rank_weekly_ind:    Int as coins = 0;
    rank_monthly_ind:   Int as coins = 0;
    rank_weekly_squad:  Int as coins = 0;
    rank_monthly_squad: Int as coins = 0;

    // Dev balance (36%)
    dev_balance: Int as coins = 0;

    // Stats
    total_processed: Int as coins = 0;

    // Anti-replay rank
    paid_periods: map<Int, Bool>;

    // ── Constants ────────────────────────────────────────────
    // Split in basis points (10000 = 100%)
    const BP_PRIZE:         Int = 5500;
    const BP_JACKPOT:       Int = 500;
    const BP_RANK_WEEKLY_I: Int = 150;
    const BP_RANK_MONTHLY_I:Int = 100;
    const BP_RANK_WEEKLY_S: Int = 100;
    const BP_RANK_MONTHLY_S:Int = 50;
    // dev = remainder = 3600

    // Jackpot threshold: 5 TON
    const JACKPOT_MIN: Int = 5000000000;

    // Minimum contract balance for gas
    const MIN_BALANCE: Int = 200000000;  // 0.2 TON

    init(owner: Address, oracle: Address) {
        self.owner  = owner;
        self.oracle = oracle;
    }

    // ── Ricevi pagamento gioco ────────────────────────────────
    receive(msg: GamePayment) {
        let amt: Int = context().value;
        require(amt >= 10000000, "Min 0.01 TON");   // spam guard

        // Calcola split
        let prize:   Int = amt * self.BP_PRIZE         / 10000;
        let jackpot: Int = amt * self.BP_JACKPOT        / 10000;
        let rwi:     Int = amt * self.BP_RANK_WEEKLY_I  / 10000;
        let rmi:     Int = amt * self.BP_RANK_MONTHLY_I / 10000;
        let rws:     Int = amt * self.BP_RANK_WEEKLY_S  / 10000;
        let rms:     Int = amt * self.BP_RANK_MONTHLY_S / 10000;
        let dev:     Int = amt - prize - jackpot - rwi - rmi - rws - rms;

        // Prize pool partita
        let existing: GamePool? = self.game_pools.get(msg.game_id);
        if (existing != null) {
            let ex: GamePool = existing!!;
            self.game_pools.set(msg.game_id, GamePool{
                amount:    ex.amount + prize,
                game_type: msg.game_type,
                paid_out:  false
            });
        } else {
            self.game_pools.set(msg.game_id, GamePool{
                amount:    prize,
                game_type: msg.game_type,
                paid_out:  false
            });
        }

        // Jackpot per gioco
        if (msg.game_type == 0) {
            self.jackpot_bingo   = self.jackpot_bingo   + jackpot;
        } else if (msg.game_type == 1) {
            self.jackpot_wheel   = self.jackpot_wheel   + jackpot;
        } else {
            self.jackpot_scratch = self.jackpot_scratch + jackpot;
        }

        // Rank pools
        self.rank_weekly_ind    = self.rank_weekly_ind    + rwi;
        self.rank_monthly_ind   = self.rank_monthly_ind   + rmi;
        self.rank_weekly_squad  = self.rank_weekly_squad  + rws;
        self.rank_monthly_squad = self.rank_monthly_squad + rms;

        // Dev
        self.dev_balance     = self.dev_balance     + dev;
        self.total_processed = self.total_processed + amt;
    }

    // ── Oracle paga vincitore ────────────────────────────────
    receive(msg: PayWinner) {
        require(sender() == self.oracle, "Only oracle");

        let pool: GamePool? = self.game_pools.get(msg.game_id);
        require(pool != null, "Pool not found");
        let p: GamePool = pool!!;
        require(!p.paid_out, "Already paid");
        require(msg.amount > 0 && msg.amount <= p.amount, "Invalid amount");
        require(myBalance() - msg.amount >= self.MIN_BALANCE, "Low balance");

        // Aggiorna pool
        let is_final: Bool = (msg.win_type == 1 || msg.win_type == 2);
        self.game_pools.set(msg.game_id, GamePool{
            amount:    p.amount - msg.amount,
            game_type: p.game_type,
            paid_out:  is_final
        });

        send(SendParameters{
            to:   msg.winner,
            value: msg.amount,
            mode:  SendPayGasSeparately,
            body: "TonBola prize".asComment()
        });
    }

    // ── Oracle paga jackpot ──────────────────────────────────
    receive(msg: JackpotPayout) {
        require(sender() == self.oracle, "Only oracle");

        let jp: Int = 0;
        if (msg.game_type == 0) {
            jp = self.jackpot_bingo;
            require(jp >= self.JACKPOT_MIN, "Below 5 TON threshold");
            self.jackpot_bingo = 0;
        } else if (msg.game_type == 1) {
            jp = self.jackpot_wheel;
            require(jp >= self.JACKPOT_MIN, "Below 5 TON threshold");
            self.jackpot_wheel = 0;
        } else {
            jp = self.jackpot_scratch;
            require(jp >= self.JACKPOT_MIN, "Below 5 TON threshold");
            self.jackpot_scratch = 0;
        }

        require(msg.amount <= jp, "Exceeds jackpot");
        require(myBalance() - msg.amount >= self.MIN_BALANCE, "Low balance");

        send(SendParameters{
            to:    msg.winner,
            value: msg.amount,
            mode:  SendPayGasSeparately,
            body:  "TonBola jackpot".asComment()
        });
    }

    // ── Oracle paga rank (top 5, amounts pre-calcolati) ──────
    receive(msg: PayRank) {
        require(sender() == self.oracle, "Only oracle");

        // Anti-replay
        let done: Bool? = self.paid_periods.get(msg.period_key);
        require(done == null || !done!!, "Period already paid");
        self.paid_periods.set(msg.period_key, true);

        // Seleziona e azzera pool
        let pool: Int = 0;
        if (msg.rank_type == 0) {
            pool = self.rank_weekly_ind;    self.rank_weekly_ind    = 0;
        } else if (msg.rank_type == 1) {
            pool = self.rank_monthly_ind;   self.rank_monthly_ind   = 0;
        } else if (msg.rank_type == 2) {
            pool = self.rank_weekly_squad;  self.rank_weekly_squad  = 0;
        } else {
            pool = self.rank_monthly_squad; self.rank_monthly_squad = 0;
        }

        require(pool > 0, "Empty pool");
        let total_pay: Int = msg.a1 + msg.a2 + msg.a3 + msg.a4 + msg.a5;
        require(total_pay <= pool, "Exceeds pool");
        require(myBalance() - total_pay >= self.MIN_BALANCE, "Low balance");

        // Paga top 5 (amount=0 viene skippato automaticamente da TON)
        if (msg.a1 > 0) { send(SendParameters{ to: msg.w1, value: msg.a1, mode: SendPayGasSeparately, body: "TonBola rank 1".asComment() }); }
        if (msg.a2 > 0) { send(SendParameters{ to: msg.w2, value: msg.a2, mode: SendPayGasSeparately, body: "TonBola rank 2".asComment() }); }
        if (msg.a3 > 0) { send(SendParameters{ to: msg.w3, value: msg.a3, mode: SendPayGasSeparately, body: "TonBola rank 3".asComment() }); }
        if (msg.a4 > 0) { send(SendParameters{ to: msg.w4, value: msg.a4, mode: SendPayGasSeparately, body: "TonBola rank 4".asComment() }); }
        if (msg.a5 > 0) { send(SendParameters{ to: msg.w5, value: msg.a5, mode: SendPayGasSeparately, body: "TonBola rank 5".asComment() }); }
    }

    // ── Admin ─────────────────────────────────────────────────
    receive(msg: SetOracle) {
        self.requireOwner();
        self.oracle = msg.oracle;
    }

    receive(msg: WithdrawDev) {
        self.requireOwner();
        require(msg.amount <= self.dev_balance, "Exceeds dev balance");
        require(myBalance() - msg.amount >= self.MIN_BALANCE, "Low balance");
        self.dev_balance = self.dev_balance - msg.amount;
        send(SendParameters{
            to:    self.owner,
            value: msg.amount,
            mode:  SendPayGasSeparately,
            body:  "Dev withdrawal".asComment()
        });
    }

    // ── Getters ───────────────────────────────────────────────
    get fun getPool(game_id: Int): Int {
        let p: GamePool? = self.game_pools.get(game_id);
        if (p == null) { return 0; }
        return p!!.amount;
    }

    get fun jackpotBingo():   Int { return self.jackpot_bingo;   }
    get fun jackpotWheel():   Int { return self.jackpot_wheel;   }
    get fun jackpotScratch(): Int { return self.jackpot_scratch; }

    get fun rankWeeklyInd():    Int { return self.rank_weekly_ind;    }
    get fun rankMonthlyInd():   Int { return self.rank_monthly_ind;   }
    get fun rankWeeklySquad():  Int { return self.rank_weekly_squad;  }
    get fun rankMonthlySquad(): Int { return self.rank_monthly_squad; }

    get fun devBalance():      Int { return self.dev_balance;      }
    get fun totalProcessed():  Int { return self.total_processed;  }
    get fun oracle():          Address { return self.oracle;       }
    get fun balance():         Int { return myBalance();           }
}
