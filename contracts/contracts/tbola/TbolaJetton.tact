// $TBOLA Jetton — TON Standard TEP-74/TEP-89
// Token nativo di TonBola su TON blockchain
// Supply: 1.000.000.000 $TBOLA (1 miliardo)

// ── Messaggi standard Jetton (TEP-74) ────────────────────────

message(0xf8a7ea5) Transfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x178d4519) TransferNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}

message(0x595f07bc) Burn {
    query_id: Int as uint64;
    amount: Int as coins;
    response_destination: Address;
    custom_payload: Cell?;
}

message(0x7bdd97de) BurnNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    response_destination: Address;
}

message(0xd53276db) Excesses {
    query_id: Int as uint64;
}

message(0x2c76b973) ProvideWalletAddress {
    query_id: Int as uint64;
    owner_address: Address;
    include_address: Bool;
}

message(0xd1735400) TakeWalletAddress {
    query_id: Int as uint64;
    wallet_address: Address;
    owner_address: Address?;
}

// Minting (solo owner)
message(0x642b7d07) Mint {
    query_id: Int as uint64;
    amount: Int as coins;
    receiver: Address;
}

// ── JettonWallet (contratto per ogni utente) ──────────────────
contract TbolaWallet {
    balance: Int as coins;
    owner: Address;
    jetton_master: Address;

    init(owner: Address, jetton_master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.jetton_master = jetton_master;
    }

    receive(msg: Transfer) {
        require(sender() == self.owner || sender() == self.jetton_master, "Unauthorized");
        require(self.balance >= msg.amount, "Insufficient balance");

        self.balance = self.balance - msg.amount;

        // Get destination wallet address and send tokens
        let init: StateInit = initOf TbolaWallet(msg.destination, self.jetton_master);
        let dest_wallet: Address = contractAddress(init);

        send(SendParameters{
            to: dest_wallet,
            value: msg.forward_ton_amount + ton("0.01"),
            mode: SendIgnoreErrors,
            bounce: true,
            body: TransferNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                forward_payload: msg.forward_payload
            }.toCell(),
            code: init.code,
            data: init.data
        });

        // Return excess TON to response_destination
        if (msg.response_destination != newAddress(0, 0)) {
            send(SendParameters{
                to: msg.response_destination,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: Excesses{ query_id: msg.query_id }.toCell()
            });
        }
    }

    receive(msg: TransferNotification) {
        // Ricevi token da un altro wallet
        require(sender() == self.getWalletAddress(msg.sender), "Invalid sender wallet");
        self.balance = self.balance + msg.amount;
    }

    receive(msg: Burn) {
        require(sender() == self.owner, "Not owner");
        require(self.balance >= msg.amount, "Insufficient balance");

        self.balance = self.balance - msg.amount;

        send(SendParameters{
            to: self.jetton_master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: BurnNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                response_destination: msg.response_destination
            }.toCell()
        });
    }

    fun getWalletAddress(owner: Address): Address {
        return contractAddress(initOf TbolaWallet(owner, self.jetton_master));
    }

    get fun get_wallet_data(): String {
        return "wallet";
    }

    get fun balance(): Int { return self.balance }
    get fun owner(): Address { return self.owner }
    get fun jetton_master(): Address { return self.jetton_master }
}

// ── JettonMaster — contratto principale $TBOLA ────────────────
contract TbolaJetton {
    // Tokenomics
    // Supply totale: 1.000.000.000 $TBOLA
    // Decimali: 9 (standard TON)
    total_supply: Int as coins;
    mintable: Bool;
    owner: Address;

    // Metadata on-chain
    // name: "TonBola Token"
    // symbol: "$TBOLA"
    // decimals: 9
    // description: "Native token of TonBola — the Telegram gaming hub on TON"
    // image: "https://ton-bola.vercel.app/img/tbola-logo.png"

    // Distribuzione tokenomics (in millesimi, /1000)
    // 400 = 40% Airdrop giocatori
    // 200 = 20% Presale pubblica
    // 150 = 15% Liquidità DEX (STON.fi)
    // 150 = 15% Team (vesting 24 mesi)
    //  50 =  5% Marketing
    //  50 =  5% Reserve

    // Tracking distribuzioni
    minted_airdrop: Int as coins;
    minted_presale: Int as coins;
    minted_liquidity: Int as coins;
    minted_team: Int as coins;
    minted_marketing: Int as coins;
    minted_reserve: Int as coins;

    // Wallet destinatari
    presale_wallet: Address;
    liquidity_wallet: Address;
    team_wallet: Address;
    marketing_wallet: Address;
    reserve_wallet: Address;

    // Vesting team (cliff 6m, linear 24m)
    team_vesting_start: Int as uint32;  // timestamp
    team_vesting_claimed: Int as coins;

    const TOTAL_SUPPLY: Int  = 1000000000000000000; // 1B con 9 decimali
    const DECIMALS: Int      = 9;
    const AIRDROP_PCT: Int   = 400;  // 40%
    const PRESALE_PCT: Int   = 200;  // 20%
    const LIQUIDITY_PCT: Int = 150;  // 15%
    const TEAM_PCT: Int      = 150;  // 15%
    const MARKETING_PCT: Int = 50;   // 5%
    const RESERVE_PCT: Int   = 50;   // 5%

    init(
        owner: Address,
        presale_wallet: Address,
        liquidity_wallet: Address,
        team_wallet: Address,
        marketing_wallet: Address,
        reserve_wallet: Address
    ) {
        self.total_supply = 0;
        self.mintable = true;
        self.owner = owner;
        self.presale_wallet = presale_wallet;
        self.liquidity_wallet = liquidity_wallet;
        self.team_wallet = team_wallet;
        self.marketing_wallet = marketing_wallet;
        self.reserve_wallet = reserve_wallet;
        self.minted_airdrop = 0;
        self.minted_presale = 0;
        self.minted_liquidity = 0;
        self.minted_team = 0;
        self.minted_marketing = 0;
        self.minted_reserve = 0;
        self.team_vesting_start = 0;
        self.team_vesting_claimed = 0;
    }

    // ── Mint airdrop (chiamato dall'oracle dopo ogni gioco) ───
    receive(msg: Mint) {
        require(sender() == self.owner, "Only owner can mint");
        require(self.mintable, "Minting disabled");

        let max_airdrop: Int = self.TOTAL_SUPPLY * self.AIRDROP_PCT / 1000;
        require(self.minted_airdrop + msg.amount <= max_airdrop, "Airdrop cap exceeded");

        self.mintInternal(msg.receiver, msg.amount);
        self.minted_airdrop = self.minted_airdrop + msg.amount;
    }

    // ── Distribuzione iniziale (owner, una sola volta) ────────
    receive("distribute_initial") {
        require(sender() == self.owner, "Only owner");
        require(self.minted_presale == 0, "Already distributed");

        let presale_amt:   Int = self.TOTAL_SUPPLY * self.PRESALE_PCT / 1000;
        let liquidity_amt: Int = self.TOTAL_SUPPLY * self.LIQUIDITY_PCT / 1000;
        let marketing_amt: Int = self.TOTAL_SUPPLY * self.MARKETING_PCT / 1000;
        let reserve_amt:   Int = self.TOTAL_SUPPLY * self.RESERVE_PCT / 1000;

        self.mintInternal(self.presale_wallet,   presale_amt);
        self.mintInternal(self.liquidity_wallet, liquidity_amt);
        self.mintInternal(self.marketing_wallet, marketing_amt);
        self.mintInternal(self.reserve_wallet,   reserve_amt);

        self.minted_presale   = presale_amt;
        self.minted_liquidity = liquidity_amt;
        self.minted_marketing = marketing_amt;
        self.minted_reserve   = reserve_amt;

        // Avvia vesting team
        self.team_vesting_start = now();
    }

    // ── Claim vesting team (linear, cliff 6 mesi) ─────────────
    receive("claim_team_vesting") {
        require(sender() == self.team_wallet, "Only team wallet");
        require(self.team_vesting_start > 0, "Vesting not started");

        let elapsed: Int = now() - self.team_vesting_start;
        let cliff: Int   = 180 * 24 * 3600;  // 6 mesi
        let duration: Int = 730 * 24 * 3600; // 24 mesi

        require(elapsed >= cliff, "Cliff period not reached");

        let total_team: Int = self.TOTAL_SUPPLY * self.TEAM_PCT / 1000;
        let vested: Int = min(total_team * elapsed / duration, total_team);
        let claimable: Int = vested - self.team_vesting_claimed;

        require(claimable > 0, "Nothing to claim");

        self.mintInternal(self.team_wallet, claimable);
        self.minted_team = self.minted_team + claimable;
        self.team_vesting_claimed = self.team_vesting_claimed + claimable;
    }

    // ── Burn notification (da wallet) ─────────────────────────
    receive(msg: BurnNotification) {
        let wallet_init: StateInit = initOf TbolaWallet(msg.sender, myAddress());
        require(sender() == contractAddress(wallet_init), "Invalid wallet");

        self.total_supply = self.total_supply - msg.amount;

        if (msg.response_destination != newAddress(0, 0)) {
            send(SendParameters{
                to: msg.response_destination,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: Excesses{ query_id: msg.query_id }.toCell()
            });
        }
    }

    // ── Discover wallet address ───────────────────────────────
    receive(msg: ProvideWalletAddress) {
        let wallet_init: StateInit = initOf TbolaWallet(msg.owner_address, myAddress());
        let wallet_addr: Address = contractAddress(wallet_init);

        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TakeWalletAddress{
                query_id: msg.query_id,
                wallet_address: wallet_addr,
                owner_address: msg.include_address ? msg.owner_address : null
            }.toCell()
        });
    }

    // ── Disabilita minting (solo owner) ───────────────────────
    receive("disable_minting") {
        require(sender() == self.owner, "Only owner");
        self.mintable = false;
    }

    // ── Internal mint ─────────────────────────────────────────
    fun mintInternal(to: Address, amount: Int) {
        let wallet_init: StateInit = initOf TbolaWallet(to, myAddress());
        let wallet_addr: Address = contractAddress(wallet_init);

        self.total_supply = self.total_supply + amount;

        send(SendParameters{
            to: wallet_addr,
            value: ton("0.02"),
            mode: SendIgnoreErrors,
            bounce: true,
            body: TransferNotification{
                query_id: 0,
                amount: amount,
                sender: myAddress(),
                forward_payload: emptySlice()
            }.toCell(),
            code: wallet_init.code,
            data: wallet_init.data
        });
    }

    // ── Getters ───────────────────────────────────────────────
    get fun get_jetton_data(): String {
        return "TBOLA:1000000000:9";  // symbol:supply:decimals
    }

    get fun total_supply(): Int { return self.total_supply }
    get fun mintable(): Bool { return self.mintable }
    get fun owner(): Address { return self.owner }
    get fun minted_airdrop(): Int { return self.minted_airdrop }
    get fun minted_presale(): Int { return self.minted_presale }
    get fun minted_team(): Int { return self.minted_team }
    get fun circulating_supply(): Int {
        return self.minted_airdrop + self.minted_presale + 
               self.minted_liquidity + self.minted_marketing + 
               self.minted_reserve + self.minted_team;
    }

    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf TbolaWallet(owner, myAddress()));
    }

    get fun vesting_claimable(): Int {
        if (self.team_vesting_start == 0) { return 0 }
        let elapsed: Int = now() - self.team_vesting_start;
        let cliff: Int   = 180 * 24 * 3600;
        if (elapsed < cliff) { return 0 }
        let duration: Int = 730 * 24 * 3600;
        let total_team: Int = self.TOTAL_SUPPLY * self.TEAM_PCT / 1000;
        let vested: Int = min(total_team * elapsed / duration, total_team);
        return vested - self.team_vesting_claimed;
    }
}
