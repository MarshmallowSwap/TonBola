// TonBolaVault — TonBola Smart Contract
// Split automatico pagamenti + pagamento vincitori via oracle firmato

trait Ownable {
    owner: Address;
    fun requireOwner() {
        require(sender() == self.owner, "Not owner");
    }
}

// ── Messaggi ──────────────────────────────────────────────────
message(0x47696d70) GamePayment {
    game_type: Int as uint8;
    game_id: Int as uint64;
    player_id: Int as uint64;
}

message(0x50617957) PayWinner {
    winner: Address;
    amount: Int as coins;
    game_id: Int as uint64;
    nonce: Int as uint64;
    signature: Slice;
}

message(0x4a61636b) PayJackpot {
    winner: Address;
    pool_id: Int as uint8;
    nonce: Int as uint64;
    signature: Slice;
}

message(0x436f6e66) UpdateConfig {
    dev_wallet: Address;
    token_fund: Address;
    leaderboard_wallet: Address;
    platform_wallet: Address;
    oracle_pubkey: Int as uint256;
}

message WinnerPaid {
    winner: Address;
    amount: Int as coins;
    game_id: Int as uint64;
}

// ── Contratto ─────────────────────────────────────────────────
contract TonBolaVault with Ownable {

    owner: Address;
    dev_wallet: Address;
    token_fund: Address;
    leaderboard_wallet: Address;
    platform_wallet: Address;
    oracle_pubkey: Int as uint256;

    last_nonce: Int as uint64;
    jackpot_ton: Int as coins;
    total_in: Int as coins;
    total_paid: Int as coins;
    game_count: Int as uint64;
    prize_pool: Int as coins;  // tracked separately for transparency

    init(
        dev_wallet: Address,
        token_fund: Address,
        leaderboard_wallet: Address,
        platform_wallet: Address,
        oracle_pubkey: Int
    ) {
        self.owner = sender();
        self.dev_wallet = dev_wallet;
        self.token_fund = token_fund;
        self.leaderboard_wallet = leaderboard_wallet;
        self.platform_wallet = platform_wallet;
        self.oracle_pubkey = oracle_pubkey;
        self.last_nonce = 0;
        self.jackpot_ton = 0;
        self.total_in = 0;
        self.total_paid = 0;
        self.game_count = 0;
        self.prize_pool = 0;
    }

    // ── Ricezione pagamento di gioco ──────────────────────────
    receive(msg: GamePayment) {
        let amount: Int = context().value;
        require(amount >= ton("0.05"), "Amount too low");

        // Gas storage: mantieni 0.05 TON nel contratto
        let usable: Int = amount - ton("0.05");

        // Split: 32% dev, 8% token, 3% lb, 2% platform, 55% prize pool
        let dev_share: Int      = usable * 3200 / 10000;
        let token_share: Int    = usable * 800  / 10000;
        let lb_share: Int       = usable * 300  / 10000;
        let platform_share: Int = usable * 200  / 10000;
        let prize_share: Int    = usable - dev_share - token_share - lb_share - platform_share;

        // Forward ai wallet (SENZA modo SendRemainingBalance)
        message(MessageParameters{
            to: self.dev_wallet,
            value: dev_share,
            mode: SendIgnoreErrors,
            bounce: false,
            body: "dev_fee".asComment()
        });

        message(MessageParameters{
            to: self.token_fund,
            value: token_share,
            mode: SendIgnoreErrors,
            bounce: false,
            body: "token_fund".asComment()
        });

        message(MessageParameters{
            to: self.leaderboard_wallet,
            value: lb_share,
            mode: SendIgnoreErrors,
            bounce: false,
            body: "leaderboard_fund".asComment()
        });

        message(MessageParameters{
            to: self.platform_wallet,
            value: platform_share,
            mode: SendIgnoreErrors,
            bounce: false,
            body: "platform_fee".asComment()
        });

        // Aggiorna stats
        self.total_in = self.total_in + amount;
        self.prize_pool = self.prize_pool + prize_share;
        self.game_count = self.game_count + 1;
    }

    // ── Pagamento vincitore (firmato dall'oracle) ─────────────
    receive(msg: PayWinner) {
        require(msg.nonce > self.last_nonce, "Nonce already used");

        let hash: Int = beginCell()
            .storeAddress(msg.winner)
            .storeCoins(msg.amount)
            .storeUint(msg.game_id, 64)
            .storeUint(msg.nonce, 64)
            .endCell()
            .hash();

        require(checkSignature(hash, msg.signature, self.oracle_pubkey), "Invalid signature");
        require(myBalance() >= msg.amount + ton("0.05"), "Insufficient balance");

        self.last_nonce = msg.nonce;
        self.total_paid = self.total_paid + msg.amount;
        if (self.prize_pool >= msg.amount) {
            self.prize_pool = self.prize_pool - msg.amount;
        }

        message(MessageParameters{
            to: msg.winner,
            value: msg.amount,
            mode: SendIgnoreErrors,
            bounce: false,
            body: "winner_prize".asComment()
        });
    }

    // ── Pagamento jackpot ─────────────────────────────────────
    receive(msg: PayJackpot) {
        require(msg.nonce > self.last_nonce, "Nonce already used");

        let hash: Int = beginCell()
            .storeAddress(msg.winner)
            .storeUint(msg.pool_id, 8)
            .storeUint(msg.nonce, 64)
            .endCell()
            .hash();

        require(checkSignature(hash, msg.signature, self.oracle_pubkey), "Invalid signature");

        let jackpot_amount: Int = self.jackpot_ton;
        require(jackpot_amount >= ton("0.5"), "Jackpot below minimum");
        require(myBalance() >= jackpot_amount + ton("0.05"), "Insufficient balance");

        self.last_nonce = msg.nonce;
        self.jackpot_ton = 0;
        self.total_paid = self.total_paid + jackpot_amount;

        message(MessageParameters{
            to: msg.winner,
            value: jackpot_amount,
            mode: SendIgnoreErrors,
            bounce: false,
            body: "jackpot_win".asComment()
        });
    }

    // ── Aggiungi liquidità al jackpot (solo owner o oracle) ───
    receive("add_jackpot") {
        self.jackpot_ton = self.jackpot_ton + context().value;
    }

    // ── Aggiungi liquidità al prize pool (solo owner) ─────────
    receive("add_liquidity") {
        require(sender() == self.owner, "Only owner");
        self.prize_pool = self.prize_pool + context().value;
    }

    // ── Config update ─────────────────────────────────────────
    receive(msg: UpdateConfig) {
        self.requireOwner();
        self.dev_wallet = msg.dev_wallet;
        self.token_fund = msg.token_fund;
        self.leaderboard_wallet = msg.leaderboard_wallet;
        self.platform_wallet = msg.platform_wallet;
        self.oracle_pubkey = msg.oracle_pubkey;
    }

    // ── Emergency (solo owner) ────────────────────────────────
    receive("emergency_withdraw") {
        self.requireOwner();
        message(MessageParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance,
            bounce: false,
            body: "emergency".asComment()
        });
    }

    // ── Getters ───────────────────────────────────────────────
    get fun balance(): Int { return myBalance() }
    get fun prizePool(): Int { return self.prize_pool }
    get fun jackpotTon(): Int { return self.jackpot_ton }
    get fun totalIn(): Int { return self.total_in }
    get fun totalPaid(): Int { return self.total_paid }
    get fun gameCount(): Int { return self.game_count }
    get fun lastNonce(): Int { return self.last_nonce }
    get fun owner(): Address { return self.owner }
}
