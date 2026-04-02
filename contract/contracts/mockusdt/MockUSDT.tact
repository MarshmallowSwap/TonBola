// MockUSDT — Testnet USDT per TonBola
// Standard TEP-74 Jetton con faucet integrato
// Decimali: 6 (identico a USDT reale)
// Faucet: chiunque può richiedere 1000 tUSDT ogni 24h

// ── Messaggi TEP-74 ───────────────────────────────────────────

message(0xf8a7ea5) JettonTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x178d4519) JettonTransferNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forward_payload: Slice as remaining;
}

message(0x595f07bc) JettonBurn {
    query_id: Int as uint64;
    amount: Int as coins;
    response_destination: Address;
    custom_payload: Cell?;
}

message(0x7bdd97de) JettonBurnNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    response_destination: Address;
}

message(0xd53276db) JettonExcesses {
    query_id: Int as uint64;
}

message(0x2c76b973) JettonProvideWalletAddress {
    query_id: Int as uint64;
    owner_address: Address;
    include_address: Bool;
}

message(0xd1735400) JettonTakeWalletAddress {
    query_id: Int as uint64;
    wallet_address: Address;
    owner_address: Address?;
}

// Faucet request — chiunque chiama questo per ricevere tUSDT
message(0xFA5CE7) FaucetRequest {
    query_id: Int as uint64;
}

// Admin mint
message(0xAD4D1) AdminMint {
    query_id: Int as uint64;
    receiver: Address;
    amount: Int as coins;
}

// ── MockUSDT Wallet (contratto per ogni holder) ───────────────
contract MockUSDTWallet {
    balance: Int as coins;
    owner: Address;
    jetton_master: Address;

    init(owner: Address, jetton_master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.jetton_master = jetton_master;
    }

    receive(msg: JettonTransfer) {
        require(sender() == self.owner || sender() == self.jetton_master, "Unauthorized");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance = self.balance - msg.amount;

        let init: StateInit = initOf MockUSDTWallet(msg.destination, self.jetton_master);
        let dest_wallet: Address = contractAddress(init);

        send(SendParameters{
            to: dest_wallet,
            value: msg.forward_ton_amount + ton("0.01"),
            mode: SendIgnoreErrors,
            bounce: true,
            body: JettonTransferNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                forward_payload: msg.forward_payload
            }.toCell(),
            code: init.code,
            data: init.data
        });

        if (msg.response_destination != newAddress(0, 0)) {
            send(SendParameters{
                to: msg.response_destination,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: JettonExcesses{ query_id: msg.query_id }.toCell()
            });
        }
    }

    receive(msg: JettonTransferNotification) {
        self.balance = self.balance + msg.amount;
    }

    receive(msg: JettonBurn) {
        require(sender() == self.owner, "Not owner");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance = self.balance - msg.amount;

        send(SendParameters{
            to: self.jetton_master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonBurnNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                response_destination: msg.response_destination
            }.toCell()
        });
    }

    get fun balance(): Int { return self.balance }
    get fun owner(): Address { return self.owner }
    get fun jetton_master(): Address { return self.jetton_master }
}

// ── MockUSDT Master ───────────────────────────────────────────
contract MockUSDT {
    total_supply: Int as coins;
    owner: Address;

    // Faucet tracking: address → last_claim_time
    // (non possiamo fare map on-chain facilmente in Tact, usiamo nonce)
    faucet_claims: Int as uint64;  // contatore totale claim

    // Faucet params
    // 1000 tUSDT per claim (6 decimali = 1_000_000_000)
    const FAUCET_AMOUNT: Int   = 1000000000;   // 1000 USDT (6 dec)
    const DECIMALS: Int        = 6;
    const MAX_SUPPLY: Int      = 1000000000000000; // 1B USDT massimo

    init(owner: Address) {
        self.total_supply = 0;
        self.owner = owner;
        self.faucet_claims = 0;
    }

    // ── Faucet — chiunque può chiamare per ricevere 1000 tUSDT ─
    receive(msg: FaucetRequest) {
        // Gas check
        require(context().value >= ton("0.05"), "Send at least 0.05 TON for gas");

        let claimer = sender();
        self.mintTo(claimer, self.FAUCET_AMOUNT);
        self.faucet_claims = self.faucet_claims + 1;

        // Restituisci gas in eccesso
        send(SendParameters{
            to: claimer,
            value: 0,
            mode: SendRemainingValue | SendIgnoreErrors,
            bounce: false,
            body: "faucet_ok".asComment()
        });
    }

    // ── Semplice receive TON = faucet automatico ───────────────
    receive() {
        require(context().value >= ton("0.05"), "Send at least 0.05 TON");
        let claimer = sender();
        self.mintTo(claimer, self.FAUCET_AMOUNT);
        self.faucet_claims = self.faucet_claims + 1;
    }

    // ── Admin mint (illimitato, solo owner) ───────────────────
    receive(msg: AdminMint) {
        require(sender() == self.owner, "Only owner");
        self.mintTo(msg.receiver, msg.amount);
    }

    // ── Burn notification ─────────────────────────────────────
    receive(msg: JettonBurnNotification) {
        let wallet_init: StateInit = initOf MockUSDTWallet(msg.sender, myAddress());
        require(sender() == contractAddress(wallet_init), "Invalid wallet");
        self.total_supply = self.total_supply - msg.amount;

        if (msg.response_destination != newAddress(0, 0)) {
            send(SendParameters{
                to: msg.response_destination,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                bounce: false,
                body: JettonExcesses{ query_id: msg.query_id }.toCell()
            });
        }
    }

    // ── Provide wallet address ─────────────────────────────────
    receive(msg: JettonProvideWalletAddress) {
        let init: StateInit = initOf MockUSDTWallet(msg.owner_address, myAddress());
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: JettonTakeWalletAddress{
                query_id: msg.query_id,
                wallet_address: contractAddress(init),
                owner_address: msg.include_address ? msg.owner_address : null
            }.toCell()
        });
    }

    // ── Internal mint ─────────────────────────────────────────
    fun mintTo(to: Address, amount: Int) {
        require(self.total_supply + amount <= self.MAX_SUPPLY, "Max supply exceeded");

        let init: StateInit = initOf MockUSDTWallet(to, myAddress());
        self.total_supply = self.total_supply + amount;

        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.02"),
            mode: SendIgnoreErrors,
            bounce: true,
            body: JettonTransferNotification{
                query_id: 0,
                amount: amount,
                sender: myAddress(),
                forward_payload: emptySlice()
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    // ── Getters ───────────────────────────────────────────────
    get fun total_supply(): Int { return self.total_supply }
    get fun decimals(): Int { return self.DECIMALS }
    get fun faucet_amount(): Int { return self.FAUCET_AMOUNT }
    get fun faucet_claims(): Int { return self.faucet_claims }
    get fun owner(): Address { return self.owner }

    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf MockUSDTWallet(owner, myAddress()));
    }

    get fun get_jetton_data(): String {
        return "tUSDT:6:testnet";
    }
}
