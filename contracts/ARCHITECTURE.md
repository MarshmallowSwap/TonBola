# TonBola Smart Contract — Architettura

## Contratti

### 1. TonBolaVault (contratto principale)
- Riceve TON/USDT da ogni pagamento di gioco
- Split automatico a 5 wallet al momento della ricezione
- Prize pool accumulato nel contratto stesso
- Oracle (backend Hetzner) può autorizzare pagamenti vincitori

### 2. Wallet di destinazione
- PRIZE_POOL:      il contratto stesso (55%) → pagato al vincitore via oracle
- DEV_WALLET:      UQAjEYy...g6TT (32%) → forwarded immediato
- TOKEN_FUND:      nuovo wallet (8%)   → forwarded immediato
- LEADERBOARD:     nuovo wallet (3%)   → forwarded immediato  
- PLATFORM:        UQAr0sQ...zC_ (2%) → forwarded immediato

## Flusso completo

### Pagamento entrata (bingo/scratch/wheel):
1. Utente → invia TON/USDT al contratto
2. Contratto → split immediato:
   - 55% rimane nel contratto (prize_pool balance)
   - 32% → forward a DEV_WALLET
   - 8%  → forward a TOKEN_FUND
   - 3%  → forward a LEADERBOARD
   - 2%  → forward a PLATFORM

### Pagamento vincitore (bingo/scratch jackpot):
1. Backend firma messaggio: (winner_address, amount, game_id, timestamp)
2. Backend → chiama contratto.payWinner(...)
3. Contratto verifica firma dell'oracle
4. Contratto → invia amount TON al winner_address

### Pagamento leaderboard settimanale:
1. Ogni lunedì backend chiama contratto.payLeaderboard([{addr, amount}, ...])
2. Contratto verifica firma oracle
3. Contratto → invia TON ai top players

### Jackpot scratch/wheel:
- Balance separato nel contratto: jackpot_usdt, jackpot_ton (in nanotons)
- 20% di ogni scratch/wheel va al jackpot (già nel 55% che rimane)
- Backend chiama payJackpot(winner, poolId) quando triggered
