#!/bin/bash
# ============================================================
# TonBola Bot — Hetzner Setup Script
# Run this on your server: bash setup.sh
# ============================================================

set -e
echo "🎱 TonBola Bot — Server Setup"
echo "=============================="

# ── 1. System update ────────────────────────────────────────
echo "📦 Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Node.js 20 LTS ────────────────────────────────
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "✅ Node version: $(node -v)"
echo "✅ NPM version:  $(npm -v)"

# ── 3. Install PM2 ──────────────────────────────────────────
echo "📦 Installing PM2..."
npm install -g pm2 -q

# ── 4. Install Git ──────────────────────────────────────────
apt-get install -y git -qq

# ── 5. Clone repo ───────────────────────────────────────────
echo "📥 Cloning TonBola repo..."
cd /opt
if [ -d "TonBola" ]; then
  echo "Repo exists — pulling latest..."
  cd TonBola && git pull origin main
else
  git clone https://github.com/MarshmallowSwap/TonBola.git
  cd TonBola
fi

# ── 6. Install bot dependencies ─────────────────────────────
echo "📦 Installing bot dependencies..."
cd /opt/TonBola/bot
npm install --production

# ── 7. Create .env ──────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "⚙️  Creating .env file..."
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANT: Edit /opt/TonBola/bot/.env with your credentials!"
  echo "   nano /opt/TonBola/bot/.env"
fi

# ── 8. PM2 ecosystem config ─────────────────────────────────
cat > /opt/TonBola/bot/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name:        'tonbola-bot',
    script:      'index.js',
    cwd:         '/opt/TonBola/bot',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file:  '/var/log/tonbola/error.log',
    out_file:    '/var/log/tonbola/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
EOF

# ── 9. Log directory ────────────────────────────────────────
mkdir -p /var/log/tonbola

# ── 10. PM2 startup ─────────────────────────────────────────
echo "🚀 Configuring PM2 startup..."
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit your .env:  nano /opt/TonBola/bot/.env"
echo "  2. Start the bot:   pm2 start /opt/TonBola/bot/ecosystem.config.cjs"
echo "  3. Check logs:      pm2 logs tonbola-bot"
echo "=============================="
