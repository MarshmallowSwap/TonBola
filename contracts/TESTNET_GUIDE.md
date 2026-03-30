# TonBola — Guida Deploy Testnet Completo

## Ordine di deploy (importante!)

### Step 1 — Ottieni TON testnet
- Vai su https://testnet.tonfaucet.io
- Inserisci il tuo indirizzo wallet Tonkeeper (in modalità testnet)
- Ricevi 5 TON testnet gratis

### Step 2 — Deploy MockUSDT (il primo da fare)
1. Vai su https://testnet.ton.cx/
2. Clicca "Deploy Contract"
3. Carica: `build/MockUSDT/MockUSDT_MockUSDT.pkg`
4. **Init params**: solo `owner` = il tuo wallet testnet
5. Invia 0.2 TON per deploy
6. **Salva l'indirizzo** del contratto → questo è `TESTNET_USDT_MASTER`

**Test faucet**: invia 0.1 TON all'indirizzo MockUSDT → ricevi 1000 tUSDT automaticamente

### Step 3 — Deploy TonBolaVault
1. Carica: `build/TonBolaVault/TonBolaVault_TonBolaVault.pkg`
2. **Init params**:
   - `dev_wallet`:         il tuo wallet testnet (stesso per tutti in testnet)
   - `token_fund`:         il tuo wallet testnet
   - `leaderboard_wallet`: il tuo wallet testnet
   - `platform_wallet`:    il tuo wallet testnet
   - `oracle_pubkey`:      81596930447221648253673168568189894254664175305553746201413230980358321864729
3. Invia 0.3 TON per deploy
4. **Salva l'indirizzo** → `TESTNET_VAULT_ADDRESS`

### Step 4 — Deploy $TBOLA
1. Carica: `build/TbolaJetton/TbolaJetton_TbolaJetton.pkg`
2. **Init params**:
   - `owner`, `presale_wallet`, `liquidity_wallet`, `team_wallet`, `marketing_wallet`, `reserve_wallet`
   - Tutti = il tuo wallet testnet per ora
3. Salva indirizzo → `TESTNET_TBOLA_MASTER`
4. Invia messaggio `distribute_initial` per distribuzione iniziale

### Step 5 — Aggiorna il frontend
Sostituisci nel codice:
```js
// Modalità testnet
const IS_TESTNET = true
const USDT_JETTON_MASTER = 'TESTNET_USDT_MASTER'    // dal step 2
const PLATFORM_WALLET    = 'TESTNET_VAULT_ADDRESS'   // dal step 3
const TBOLA_JETTON_MASTER = 'TESTNET_TBOLA_MASTER'   // dal step 4
```

### Step 6 — Test end-to-end
1. **Faucet tUSDT**: invia 0.1 TON al MockUSDT → ricevi 1000 tUSDT
2. **Bingo USDT**: acquista card da 0.50 tUSDT → verifica split su explorer
3. **Scratch TON**: acquista Bronze 0.25 TON → verifica jackpot accumulato
4. **Wheel**: spin con tUSDT → verifica forward ai 4 wallet
5. **Verifica split**: su testnet.tonscan.io vedi le TX in uscita dal vault

## Indirizzi da completare dopo deploy

```
TESTNET_USDT_MASTER:  _______________  (dopo step 2)
TESTNET_VAULT_ADDRESS: ______________  (dopo step 3)
TESTNET_TBOLA_MASTER: _______________  (dopo step 4)
```

## Explorer testnet
- Contratti: https://testnet.tonscan.io/
- Wallet: https://testnet.tonscan.io/address/TUO_INDIRIZZO
