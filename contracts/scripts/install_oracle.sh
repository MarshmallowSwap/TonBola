#!/bin/bash
# ═══════════════════════════════════════════════════════
# TonBola Oracle — Install script (esegui come root sul VPS)
# ═══════════════════════════════════════════════════════
set -e

echo "📦 Installing dependencies..."
pip install fastapi uvicorn httpx pytoniq-core --break-system-packages -q

echo "📁 Copying oracle backend..."
cp /root/tonbola-deploy/contracts/scripts/oracle_backend.py /root/tonbola-backend/oracle_backend.py

echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/tonbola-oracle.service << 'UNIT'
[Unit]
Description=TonBola Oracle Backend
After=network.target
Wants=network-online.target

[Service]
WorkingDirectory=/root/tonbola-backend
Environment="VAULT_ADDRESS=UQDF2yS_xqltxFi7M8DSx0yKza_UfQu2uP1kz82yvLRWQCuW"
Environment="ORACLE_MNEMONIC=bulk royal camp fame baby accuse item method air reflect vendor bundle feel carpet rescue borrow switch bubble gentle grid summer fiction coffee token"
Environment="OWNER_WALLET=UQCU4QrHnuuLUzu0qJEOwQFSTFol5ihNbmd0EkLX81zoJK5b"
Environment="SUPABASE_URL=https://lajeiwuumqbzcmdgsczq.supabase.co"
Environment="SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhamVpd3V1bXFiemNtZGdzY3pxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4NTgzNiwiZXhwIjoyMDkwMDYxODM2fQ.bmUUgJfpoOyj8QR9NfH_7Fyzg360VkuH-ReZsz-fRyk"
Environment="NODE_DIR=/root/tonbola-deploy/contract"
Environment="ORACLE_MAX_TON=2.0"
Environment="ORACLE_KEEP_TON=0.5"
Environment="ADMIN_SECRET=tonbola-dev-2026"
ExecStart=/usr/bin/python3 oracle_backend.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable tonbola-oracle
systemctl start tonbola-oracle
sleep 2
systemctl status tonbola-oracle --no-pager

echo ""
echo "🕐 Setting up weekly rank cron job (every Monday 00:05 UTC)..."
(crontab -l 2>/dev/null; echo "5 0 * * 1 curl -s -X POST 'http://localhost:8003/oracle/cron-rank-weekly?secret=tonbola-dev-2026' >> /var/log/tonbola-rank.log 2>&1") | crontab -

echo ""
echo "✅ Oracle installed!"
echo "   Health check: curl http://localhost:8003/oracle/health"
echo "   Logs: journalctl -u tonbola-oracle -f"
