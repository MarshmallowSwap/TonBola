import supabase from '../utils/supabase.js'
import { GAME, ECONOMY, TBOLA, XP } from '../utils/constants.js'
import { awardTbola, awardXp, unlockAchievement, handleReferralCommission } from './users.js'

// ── CARD GENERATION ──────────────────────────────────────
// Generate a valid bingo card (15 unique numbers 1-90)
export function generateCard() {
  const pool = Array.from({ length: 90 }, (_, i) => i + 1)
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 15).sort((a, b) => a - b)
}

// Generate N cards for a player
export function generateCards(n) {
  return Array.from({ length: n }, generateCard)
}

// ── ROOM MANAGEMENT ──────────────────────────────────────
export async function createRoom({ type, currency, cardPriceStars, cardPriceTon,
  maxPlayers, creatorId, password }) {

  const code = await supabase.rpc('generate_room_code').then(r => r.data)

  const { data: room } = await supabase.from('rooms').insert({
    room_code:        code,
    type:             type || 'public',
    currency:         currency || 'stars',
    card_price_stars: cardPriceStars || null,
    card_price_ton:   cardPriceTon || null,
    max_players:      maxPlayers || 20,
    creator_id:       creatorId || null,
    password_hash:    password || null,
    status:           'waiting',
  }).select().single()

  return room
}

export async function getRoomByCode(code) {
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', code.toUpperCase())
    .eq('status', 'waiting')
    .single()
  return data
}

// ── GAME LIFECYCLE ────────────────────────────────────────
export async function createGame(roomId, currency) {
  const { data: game } = await supabase.from('games').insert({
    room_id:  roomId,
    currency: currency,
    status:   'waiting',
  }).select().single()
  return game
}

export async function joinGame(gameId, userId, cardsCount, currency, cardPriceStars, cardPriceTon) {
  const cards = generateCards(cardsCount)

  // Calculate cost and pot contribution
  const potStars = currency === 'stars' ? cardPriceStars * cardsCount : 0
  const potTon   = currency === 'ton'   ? cardPriceTon   * cardsCount : 0

  // Insert player
  const { data: player } = await supabase.from('game_players').insert({
    game_id:     gameId,
    user_id:     userId,
    cards:       cards,
    cards_count: cardsCount,
  }).select().single()

  // Update game pot
  await supabase.from('games').update({
    total_pot_stars: supabase.rpc('total_pot_stars + ' + potStars),
    total_pot_ton:   supabase.rpc('total_pot_ton + ' + potTon),
  }).eq('id', gameId)

  // Update room player count
  await supabase.from('rooms').update({
    current_players: supabase.rpc('current_players + 1'),
  }).eq('id', (await supabase.from('games').select('room_id').eq('id', gameId).single()).data.room_id)

  return { player, cards }
}

// ── GAME START ────────────────────────────────────────────
export async function startGame(gameId) {
  // Fetch game and players
  const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single()
  const { data: players } = await supabase.from('game_players').select('*').eq('game_id', gameId)

  // Calculate prize pools
  const totalStars = game.total_pot_stars
  const totalTon   = game.total_pot_ton
  const isPrivate  = (await supabase.from('rooms').select('type,creator_id').eq('id', game.room_id).single()).data

  const creatorFeeStars = isPrivate.type === 'private' ? Math.floor(totalStars * ECONOMY.CREATOR_FEE_PCT) : 0
  const creatorFeeTon   = isPrivate.type === 'private' ? totalTon * ECONOMY.CREATOR_FEE_PCT : 0
  const poolPct = isPrivate.type === 'private' ? ECONOMY.PRIZE_POOL_PRIVATE : ECONOMY.PRIZE_POOL_PCT

  const prizeStars = Math.floor(totalStars * poolPct)
  const prizeTon   = totalTon * poolPct
  const lbStars    = Math.floor(totalStars * ECONOMY.LEADERBOARD_PCT)
  const lbTon      = totalTon * ECONOMY.LEADERBOARD_PCT
  const tbolaFund  = Math.floor((totalStars + totalTon * 100) * ECONOMY.TOKEN_FUND_PCT) // rough conversion

  await supabase.from('games').update({
    status:                 'playing',
    prize_pool_stars:       prizeStars,
    prize_pool_ton:         prizeTon,
    creator_fee_stars:      creatorFeeStars,
    creator_fee_ton:        creatorFeeTon,
    leaderboard_fund_stars: lbStars,
    leaderboard_fund_ton:   lbTon,
    tbola_fund_amount:      tbolaFund,
    started_at:             new Date().toISOString(),
  }).eq('id', gameId)

  // Pay creator fee immediately
  if (isPrivate.creator_id && (creatorFeeStars > 0 || creatorFeeTon > 0)) {
    // TODO: send Stars/TON to creator wallet
  }

  // Add to leaderboard prize fund pool
  await addToLeaderboardFund(game.currency, lbStars, lbTon)

  return { game, players, prizeStars, prizeTon }
}

// ── DRAW ENGINE ───────────────────────────────────────────
// Draw next number and check all players' cards
export async function drawNumber(gameId) {
  const { data: game } = await supabase.from('games')
    .select('drawn_numbers, prize_pool_stars, prize_pool_ton, currency')
    .eq('id', gameId).single()

  // Pick a number not yet drawn
  const available = Array.from({ length: 90 }, (_, i) => i + 1)
    .filter(n => !game.drawn_numbers.includes(n))

  if (available.length === 0) return { number: null, gameOver: true }

  const number = available[Math.floor(Math.random() * available.length)]
  const newDrawn = [...game.drawn_numbers, number]

  await supabase.from('games').update({
    drawn_numbers: newDrawn,
    last_drawn_at: new Date().toISOString(),
  }).eq('id', gameId)

  // Check all players for line/bingo
  const { data: players } = await supabase.from('game_players')
    .select('*').eq('game_id', gameId)

  const results = []
  for (const player of players) {
    const result = await checkPlayerCard(gameId, player, number, newDrawn,
      game.prize_pool_stars, game.prize_pool_ton)
    if (result) results.push(result)
  }

  return { number, drawn: newDrawn, results, gameOver: false }
}

// Check a player's cards against the new number
async function checkPlayerCard(gameId, player, newNumber, allDrawn,
  prizeStars, prizeTon) {

  // Mark the number on player's cards
  const newMarked = [...player.marked_numbers, newNumber]
    .filter(n => player.cards.flat().includes(n))

  let updates = { marked_numbers: newMarked }
  let won = null

  // Check for LINE (any row of 5 numbers all marked)
  if (!player.has_line) {
    const hasLine = player.cards.some(card => {
      // Split card into 3 rows of 5
      for (let row = 0; row < 3; row++) {
        const rowNums = card.slice(row * 5, row * 5 + 5)
        if (rowNums.every(n => newMarked.includes(n))) return true
      }
      return false
    })

    if (hasLine) {
      const lineStars = Math.floor(prizeStars * GAME.LINE_PRIZE_PCT)
      const lineTon   = prizeTon * GAME.LINE_PRIZE_PCT
      updates.has_line       = true
      updates.line_at_number = newNumber
      updates.prize_stars    = (player.prize_stars || 0) + lineStars
      updates.prize_ton      = (player.prize_ton || 0) + lineTon

      await supabase.from('games').update({
        line_winner_id:   player.user_id,
        line_prize_stars: lineStars,
        line_prize_ton:   lineTon,
      }).eq('id', gameId)

      won = { type: 'line', userId: player.user_id, stars: lineStars, ton: lineTon }
    }
  }

  // Check for BINGO (all 15 numbers marked)
  if (!player.has_bingo && newMarked.length >= 15) {
    const hasBingo = player.cards.some(card => card.every(n => newMarked.includes(n)))

    if (hasBingo) {
      const bingoStars = Math.floor(prizeStars * GAME.BINGO_PRIZE_PCT)
      const bingoTon   = prizeTon * GAME.BINGO_PRIZE_PCT
      updates.has_bingo       = true
      updates.bingo_at_number = newNumber
      updates.prize_stars     = (updates.prize_stars || player.prize_stars || 0) + bingoStars
      updates.prize_ton       = (updates.prize_ton   || player.prize_ton   || 0) + bingoTon

      await supabase.from('games').update({
        bingo_winner_id:   player.user_id,
        bingo_prize_stars: bingoStars,
        bingo_prize_ton:   bingoTon,
        status:            'finished',
        finished_at:       new Date().toISOString(),
      }).eq('id', gameId)

      won = { type: 'bingo', userId: player.user_id, stars: bingoStars, ton: bingoTon }
    }
  }

  await supabase.from('game_players').update(updates).eq('id', player.id)

  return won
}

// ── POST GAME REWARDS ─────────────────────────────────────
export async function distributeRewards(gameId) {
  const { data: players } = await supabase.from('game_players')
    .select('*').eq('game_id', gameId)

  for (const player of players) {
    let tbola = TBOLA.PER_GAME + (player.cards_count * TBOLA.PER_CARD)
    let xp    = player.cards_count * XP.PER_CARD

    if (player.has_line)  { tbola += TBOLA.LINE_WIN;  xp += XP.LINE_WIN  }
    if (player.has_bingo) { tbola += TBOLA.BINGO_WIN; xp += XP.BINGO_WIN }

    // Award TBOLA
    await awardTbola(player.user_id, tbola, player.has_bingo ? 'bingo_win'
      : player.has_line ? 'line_win' : 'game_played', gameId)

    // Award XP and check level up
    await awardXp(player.user_id, xp)

    // Referral commissions cascade
    await handleReferralCommission(player.user_id, tbola)

    // Update game_players with tbola/xp earned
    await supabase.from('game_players').update({
      tbola_earned: tbola,
      xp_earned:    xp,
    }).eq('id', player.id)

    // Update user totals
    await supabase.from('users').update({
      total_games:        supabase.rpc('total_games + 1'),
      total_cards_bought: supabase.rpc(`total_cards_bought + ${player.cards_count}`),
      total_wins:         player.has_bingo
        ? supabase.rpc('total_wins + 1') : undefined,
      total_lines:        player.has_line
        ? supabase.rpc('total_lines + 1') : undefined,
    }).eq('telegram_id', player.user_id)

    // Achievement checks
    await checkAchievements(player.user_id, player)
  }
}

// ── ACHIEVEMENTS ──────────────────────────────────────────
async function checkAchievements(userId, player) {
  const { data: user } = await supabase.from('users')
    .select('total_games, total_wins').eq('telegram_id', userId).single()

  const milestones = { games_10: 10, games_100: 100, games_1000: 1000 }
  const rewards    = { games_10: 200, games_100: 1000, games_1000: 5000 }

  for (const [type, threshold] of Object.entries(milestones)) {
    if (user.total_games >= threshold) {
      await unlockAchievement(userId, type, rewards[type])
    }
  }

  if (player.has_bingo) await unlockAchievement(userId, 'first_bingo')
  if (player.has_line)  await unlockAchievement(userId, 'first_line')
}

// ── LEADERBOARD FUND ──────────────────────────────────────
async function addToLeaderboardFund(currency, stars, ton) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + 1) // Monday
  const weekKey = weekStart.toISOString().split('T')[0]

  const fundType = currency === 'stars' ? 'leaderboard_weekly_stars' : 'leaderboard_weekly_ton'

  await supabase.from('prize_funds')
    .upsert({
      fund_type:    fundType,
      period_start: weekKey,
    }, { onConflict: 'fund_type,period_start' })

  if (stars > 0) {
    await supabase.rpc('exec_sql', {
      query: `UPDATE prize_funds SET balance_stars = balance_stars + ${stars}
              WHERE fund_type = '${fundType}' AND period_start = '${weekKey}'`
    }).catch(() => {}) // fallback — handle via backend cron
  }
}
