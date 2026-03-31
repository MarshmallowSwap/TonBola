#!/bin/bash
# Setup completo VPS — backend + oracle + bot + nginx
# Eseguire una volta su 95.217.10.201
set -e

echo "🚀 TonBola — VPS Services Setup"
echo "================================="

# ── 1. Fix nginx proxy ─────────────────────────────────────
echo ""
echo "📡 Configurando nginx..."

cat > /etc/nginx/sites-available/tonbola << 'NGINX'
server {
    listen 80;
    server_name api.fundshot.app;

    # TonBola backend
    location /tonbola/ {
        proxy_pass         http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }

    # Oracle
    location /oracle/ {
        proxy_pass         http://127.0.0.1:8003/oracle/;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    # FundShot (se esiste)
    location / {
        proxy_pass         http://127.0.0.1:8000/;
        proxy_set_header   Host $host;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/tonbola /etc/nginx/sites-enabled/tonbola
nginx -t && systemctl reload nginx
echo "✅ nginx configurato"

# ── 2. Install Python deps per oracle ─────────────────────
echo ""
echo "🐍 Installing Python oracle deps..."
pip install pynacl pytoniq-core uvicorn httpx --break-system-packages -q
echo "✅ Deps installati"

# ── 3. Oracle systemd service ─────────────────────────────
echo ""
echo "⚙️  Configurando oracle service..."

# Prima estrai la private key dal mnemonic oracle
cd /root/tbola
cat > /tmp/get_oracle_key.py << 'PYEOF'
import asyncio
from pytoniq_core.crypto.keys import mnemonic_to_private_key

MNEMONIC = "bulk royal camp fame baby accuse item method air reflect vendor bundle feel carpet rescue borrow switch bubble gentle grid summer fiction coffee token"

async def main():
    priv, pub = await mnemonic_to_private_key(MNEMONIC.split())
    print(f"ORACLE_PRIVATE_KEY_HEX={priv.hex()}")
    print(f"ORACLE_PUBKEY_HEX={pub.hex()}")

asyncio.run(main())
PYEOF

ORACLE_KEY=$(python3 /tmp/get_oracle_key.py | grep PRIVATE | cut -d= -f2)
echo "Oracle key extracted: ${ORACLE_KEY:0:8}..."

# Read vault address if available
VAULT_ADDR=""
if [ -f "/root/tbola/build/mainnet_vault.json" ]; then
  VAULT_ADDR=$(cat /root/tbola/build/mainnet_vault.json | python3 -c "import json,sys; print(json.load(sys.stdin)['MAINNET_VAULT_ADDRESS'])")
  echo "Vault address: $VAULT_ADDR"
fi

cat > /etc/systemd/system/tonbola-oracle.service << SYSTEMD
[Unit]
Description=TonBola Oracle Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/tonbola-pvp/backend
Environment="ORACLE_PRIVATE_KEY_HEX=${ORACLE_KEY}"
Environment="VAULT_ADDRESS=${VAULT_ADDR}"
ExecStart=/usr/bin/python3 /root/tonbola-pvp/backend/oracle.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
echo "✅ Oracle service configurato"

# ── 4. Bot Telegram setup ──────────────────────────────────
echo ""
echo "🤖 Setup Bot..."

cd /root/tonbola-pvp/bot
if [ ! -d node_modules ]; then
  npm install 2>&1 | tail -3
fi

# Check .env
if [ ! -f .env ]; then
  echo "⚠️  Crea /root/tonbola-pvp/bot/.env con:"
  echo "   BOT_TOKEN=..."
  echo "   SUPABASE_URL=https://lajeiwuumqbzcmdgsczq.supabase.co"
  echo "   SUPABASE_SERVICE_KEY=..."
  echo "   MINIAPP_URL=https://ton-bola.vercel.app"
fi

cat > /etc/systemd/system/tonbola-bot.service << SYSTEMD
[Unit]
Description=TonBola Telegram Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/tonbola-pvp/bot
EnvironmentFile=/root/tonbola-pvp/bot/.env
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
echo "✅ Bot service configurato"

# ── 5. Start services ──────────────────────────────────────
echo ""
echo "▶️  Avviando servizi..."

# Backend FastAPI già in esecuzione, reload
systemctl restart tonbola 2>/dev/null && echo "✅ Backend restarted" || echo "⚠️  Backend service non trovato, avvia manualmente"

# Oracle
systemctl enable tonbola-oracle
systemctl start tonbola-oracle
sleep 2
systemctl is-active tonbola-oracle && echo "✅ Oracle running" || echo "⚠️  Oracle failed"

# Bot (solo se .env esiste)
if [ -f /root/tonbola-pvp/bot/.env ]; then
  systemctl enable tonbola-bot
  systemctl start tonbola-bot
  sleep 2
  systemctl is-active tonbola-bot && echo "✅ Bot running" || echo "⚠️  Bot failed — check .env"
else
  echo "⚠️  Bot non avviato — manca .env"
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  Setup completato!                   ║"
echo "║                                      ║"
echo "║  Endpoints:                          ║"
echo "║  Backend: api.fundshot.app/tonbola/  ║"
echo "║  Oracle:  api.fundshot.app/oracle/   ║"
echo "║  Health:  curl api.fundshot.app/     ║"
echo "║           tonbola/health             ║"
echo "╚══════════════════════════════════════╝"
