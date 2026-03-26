import 'dotenv/config'
import { Bot, session } from 'grammy'
import { handleStart, handleProfile, handleReferral, handleHelp } from './commands/index.js'

// Validate required env vars
const required = ['BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`)
    process.exit(1)
  }
}

const bot = new Bot(process.env.BOT_TOKEN)

// ── SESSION ───────────────────────────────────────────────
bot.use(session({ initial: () => ({}) }))

// ── COMMANDS ──────────────────────────────────────────────
bot.command('start',    handleStart)
bot.command('profile',  handleProfile)
bot.command('referral', handleReferral)
bot.command('help',     handleHelp)

// ── CALLBACK QUERIES ──────────────────────────────────────
bot.callbackQuery('referral_link', async (ctx) => {
  await ctx.answerCallbackQuery()
  await handleReferral(ctx)
})

bot.callbackQuery('earn_menu', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(
    `💎 *Ways to Earn $TBOLA*\n\n` +
    `🃏 Buy a card → +50 $TBOLA\n` +
    `🎮 Play a game → +10 $TBOLA\n` +
    `📏 Win a line → +100 $TBOLA\n` +
    `🏆 Win a bingo → +500 $TBOLA\n\n` +
    `📅 Daily login → +5 $TBOLA\n` +
    `🔥 7-day streak → +100 $TBOLA\n` +
    `🔥 30-day streak → +500 $TBOLA\n\n` +
    `👥 Invite a friend → +500 $TBOLA\n` +
    `💸 Their earnings → +5% forever\n\n` +
    `_Airdrop snapshot at presale launch._`,
    { parse_mode: 'Markdown' }
  )
})

bot.callbackQuery('squad_menu', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(
    `👥 *Squads*\n\n` +
    `Form a team of up to 20 players.\n` +
    `Your combined weekly score earns a squad prize.\n\n` +
    `Use the Mini App to create or join a squad.`,
    { parse_mode: 'Markdown' }
  )
})

// ── ERROR HANDLER ─────────────────────────────────────────
bot.catch((err) => {
  console.error('Bot error:', err.message)
})

// ── START ─────────────────────────────────────────────────
console.log('🎱 TonBola Bot starting...')
bot.start({
  onStart: (info) => console.log(`✅ Bot running as @${info.username}`),
})
