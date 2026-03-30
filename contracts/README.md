# TonBolaVault — Smart Contract

## Cosa fa
Ogni pagamento di gioco arriva al contratto e viene splittatato automaticamente:

```
Utente invia 0.5 USDT/TON
         ↓
  TonBolaVault (contratto)
         ↓
  ├── 55% → rimane nel contratto (prize pool)
  ├── 32% → DEV_WALLET (forward immediato)
  ├── 8%  → TOKEN_FUND (forward immediato)
  ├── 3%  → LEADERBOARD_WALLET (forward immediato)
  └── 2%  → PLATFORM_WALLET (forward immediato)
```

Quando qualcuno vince:
```
Backend (Hetzner) firma PayWinner con chiave oracle
         ↓
  Contratto verifica firma
         ↓
  Contratto → paga vincitore dalla prize pool
```

## Wallet necessari (da creare)

| Wallet | Scopo | Note |
|--------|-------|------|
| `DEV_WALLET` | Revenue sviluppatore | Già esiste (UQAjEYy...) |
| `TOKEN_FUND` | Fondo $TBOLA | Da creare nuovo |
| `LEADERBOARD_WALLET` | Premi classifica | Da creare nuovo |
| `PLATFORM_WALLET` | Fees operative | Già esiste (UQAr0sQ...) |
| `ORACLE_WALLET` | Paga gas TX oracle | Da creare + finanziare 5 TON |

## Deploy steps

### 1. Installa Blueprint (framework TON)
```bash
npm create ton@latest
npm install
```

### 2. Copia il contratto
```bash
cp contracts/TonBolaVault.tact ./contracts/
```

### 3. Genera chiave oracle
```bash
npx ts-node scripts/deploy.ts --gen-oracle-key
# Salva mnemonic e public key!
```

### 4. Crea TOKEN_FUND e LEADERBOARD_WALLET
- Usa Tonkeeper → crea 2 nuovi wallet
- Annota gli indirizzi

### 5. Deploy su testnet prima
```bash
npx blueprint run --network testnet
```

### 6. Testa con piccole somme
- Invia 0.1 TON al contratto con body GamePayment
- Verifica che 5 wallet ricevano le quote corrette
- Testa PayWinner con firma oracle

### 7. Deploy su mainnet
```bash
npx blueprint run --network mainnet
```

### 8. Integra l'oracle nel backend FastAPI
```bash
# Sul VPS Hetzner:
pip install PyNaCl tonsdk fastapi httpx
cp scripts/oracle_backend.py /root/tonbola-oracle/
# Aggiungi env vars: CONTRACT_ADDRESS, ORACLE_SECRET_KEY, ecc.
# Avvia come systemd service su porta 8003
```

### 9. Aggiorna frontend
- Sostituisci `PLATFORM_WALLET` con l'indirizzo del contratto
- I pagamenti ora vanno al contratto invece che al wallet diretto

## Variabili d'ambiente (VPS)
```bash
CONTRACT_ADDRESS=EQ...       # indirizzo del vault dopo deploy
ORACLE_SECRET_KEY=...        # 32 bytes hex (dalla generazione)
SUPABASE_URL=https://lajeiwuumqbzcmdgsczq.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SENDER_MNEMONIC="word1 word2 ..."  # wallet che paga gas oracle TX
```

## Supervisione (tutto quello che devi fare)
1. Controlla `admin/health.html` ogni tanto
2. Monitora il bilancio del contratto (deve sempre avere TON per le gas)
3. Controlla i log oracle: `journalctl -u tonbola-oracle -f`
4. Se jackpot da pagare: vedi la dashboard admin

## Stima costi
- Gas per split TX: ~0.05 TON per pagamento
- Gas per PayWinner: ~0.02 TON (pagato dall'oracle wallet)
- Oracle wallet: tenere sempre almeno 2 TON di buffer
