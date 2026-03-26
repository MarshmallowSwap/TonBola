# TonBola 🎱

**Live multiplayer Bingo on Telegram — Win real TON every game.**

> Buy cards · Mark numbers · Cash out instantly

---

## Overview

TonBola is a Telegram Mini App that brings live multiplayer bingo to the TON ecosystem. Every 5 minutes a new game starts. Players buy cards with Telegram Stars or TON, follow the live draw, and winners receive TON directly to their Telegram Wallet — instantly, no waiting.

**Core differentiators:**
- 55% of every card sold → instant live prize pool
- 8% → $TBOLA token fund (backed by real revenue)
- 3% → weekly/monthly leaderboard prize pool
- Real progression system (6 levels, permanent unlocks)
- Multi-level referral + influencer program
- $TBOLA token with presale → airdrop → DEX listing roadmap

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 / Vanilla JS (Telegram Mini App) |
| Landing | Static HTML — deployed on Vercel |
| Backend | Node.js + FastAPI (Railway) |
| Database | Supabase |
| Payments | TON Connect 2.0 + Telegram Stars |
| Blockchain | TON — Jetton standard for $TBOLA |
| Real-time | WebSocket (game sessions) |

---

## Project Structure

```
TonBola/
├── index.html          # Landing page (Vercel)
├── vercel.json         # Vercel deployment config
├── README.md
├── public/
│   └── og-image.png    # Social preview image
├── src/                # Game Mini App source (coming soon)
│   ├── bot/            # Telegram bot logic
│   ├── game/           # Game engine (bingo logic)
│   ├── api/            # Backend API routes
│   └── contracts/      # TON smart contracts ($TBOLA)
└── docs/
    └── whitepaper.md   # $TBOLA tokenomics
```

---

## Token — $TBOLA

**Supply:** 1,000,000,000

| Allocation | % |
|-----------|---|
| Player airdrop | 40% |
| Public presale | 20% |
| DEX liquidity | 15% |
| Team (24m vesting) | 15% |
| Marketing | 5% |
| Reserve | 5% |

The token fund is backed by real game revenue — 8% of every card purchased goes to the $TBOLA fund. Token value is anchored to actual cash flow, not speculation.

---

## Roadmap

- **Phase 1 (Now)** — Landing page live · Game development
- **Phase 2 (Month 4)** — Public presale · Whitelist for top players
- **Phase 3 (Month 6)** — TGE + Airdrop · Listing on STON.fi

---

## Links

- Telegram Bot: [@TonBola_bot](https://t.me/tonbola_bot)
- Community: [@TonBola_community](https://t.me/tonbola_community)
- Twitter: [@TonBola](https://twitter.com/tonbola)

---

Built with ❤️ on TON · © 2025 TonBola
