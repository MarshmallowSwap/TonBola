#!/bin/bash
# ============================================================
# TonBola — Deploy update script
# Run after every git push: bash /opt/TonBola/bot/deploy.sh
# ============================================================

set -e
echo "🚀 Deploying TonBola Bot update..."

cd /opt/TonBola

# Pull latest code
git pull origin main

# Install any new dependencies
cd bot
npm install --production

# Restart bot with PM2 (zero downtime reload)
pm2 reload tonbola-bot --update-env

echo "✅ Deploy complete — $(date)"
pm2 status tonbola-bot
