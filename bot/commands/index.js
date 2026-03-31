import { InlineKeyboard } from 'grammy'
import { getOrCreateUser, handleDailyLogin, getUserProfile } from '../game/users.js'

const MINIAPP_URL = process.env.MINIAPP_URL || 'https://ton-bola.vercel.app'

// ── /start ────────────────────────────────────────────────
export async function handleStart(ctx) {
  const tgUser = ctx.from
  const startParam = ctx.match // referral code from ?start=ref_123

  let referrerId = null
  if (startParam && startParam.startsWith('ref_')) {
    referrerId = parseInt(startParam.replace('ref_', ''))
  }

  const user = await getOrCreateUser(tgUser, referrerId)

  // Daily login check
  const { alreadyClaimed, streak } = await handleDailyLogin(tgUser.id)

  const streakMsg = alreadyClaimed
    ? `🔥 Streak: ${streak} days`
    : `✅ Daily login claimed! 🔥 Streak: ${streak} days (+${streak >= 7 ? 'BONUS' : '5 $TBOLA'})`

  const keyboard = new InlineKeyboard()
    .webApp('🎱  Open TonBola', `${process.env.MINIAPP_URL || 'https://ton-bola.vercel.app'}/app/index.html`)

  await ctx.reply(
    `🎱 *Welcome to TonBola*, ${user.first_name}!\n\n` +
    `${streakMsg}\n\n` +
    `💎 $TBOLA Balance: *${user.tbola_balance.toLocaleString()}*\n` +
    `⭐ Level: *${user.level}* · XP: *${user.xp}*`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
}

// ── /profile ──────────────────────────────────────────────
export async function handleProfile(ctx) {
  const user = await getUserProfile(ctx.from.id)
  if (!user) return ctx.reply('Profile not found. Use /start to register.')

  const squad = user.squad_members?.[0]?.squads

  const keyboard = new InlineKeyboard()
    .webApp('👤 Full Profile', `${process.env.MINIAPP_URL}/profile`)
    .row()
    .text('🔗 My Referral Link', 'referral_link')

  await ctx.reply(
    `👤 *${user.first_name}*${user.username ? ` @${user.username}` : ''}\n\n` +
    `🏅 Level *${user.level}* · ${user.xp} XP\n` +
    `💎 $TBOLA: *${user.tbola_balance.toLocaleString()}*\n` +
    `🔥 Streak: *${user.streak_days}* days\n\n` +
    `🎮 Games: ${user.total_games} · 🏆 Wins: ${user.total_wins}\n` +
    `🃏 Cards bought: ${user.total_cards_bought}\n` +
    (squad ? `\n👥 Squad: *${squad.name}*` : '\n👥 No squad — /squads to join one'),
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
}

// ── /referral ─────────────────────────────────────────────
export async function handleReferral(ctx) {
  const userId = ctx.from.id
  const refLink = `https://t.me/TonBolaBot_bot?start=ref_${userId}`

  await ctx.reply(
    `🔗 *Your Referral Link*\n\n` +
    `\`${refLink}\`\n\n` +
    `*You earn:*\n` +
    `• +500 $TBOLA when a friend joins\n` +
    `• +5% of their $TBOLA earnings forever (L1)\n` +
    `• +2% from their friends (L2)\n` +
    `• +1% from their friends' friends (L3)\n\n` +
    `Paid automatically via smart contract. Forever.`,
    { parse_mode: 'Markdown' }
  )
}

// ── /help ─────────────────────────────────────────────────
export async function handleHelp(ctx) {
  await ctx.reply(
    `🎱 *TonBola Help*\n\n` +
    `*Commands:*\n` +
    `/start — Main menu\n` +
    `/profile — Your stats\n` +
    `/referral — Your invite link\n` +
    `/squads — Squad menu\n` +
    `/rooms — Browse open rooms\n\n` +
    `*How to play:*\n` +
    `1. Choose a room (Free / Stars / TON)\n` +
    `2. Buy 1–10 cards\n` +
    `3. Numbers drawn every 5 seconds\n` +
    `4. First line → 25% of pool\n` +
    `5. Full house → 75% of pool\n` +
    `6. Prizes paid instantly in same currency\n\n` +
    `*Earn $TBOLA every game — airdrop coming!*`,
    { parse_mode: 'Markdown' }
  )
}
