import supabase from '../utils/supabase.js'
import { TBOLA, XP, LEVELS } from '../utils/constants.js'

// Register or fetch user on /start
export async function getOrCreateUser(telegramUser, referrerId = null) {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramUser.id)
    .single()

  if (existing) return existing

  // New user — create and handle referral
  const { data: user } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramUser.id,
      username:    telegramUser.username,
      first_name:  telegramUser.first_name,
      referrer_id: referrerId || null,
    })
    .select()
    .single()

  // Handle referral chain
  if (referrerId) {
    await handleReferralChain(referrerId, telegramUser.id)
  }

  // Award join bonus TBOLA
  await awardTbola(user.telegram_id, TBOLA.REFERRAL_JOIN, 'referral_join', null, 'Welcome bonus')

  return user
}

// Daily login streak check
export async function handleDailyLogin(telegramId) {
  const { data: user } = await supabase
    .from('users')
    .select('streak_days, last_login_date, tbola_balance')
    .eq('telegram_id', telegramId)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const lastLogin = user.last_login_date

  if (lastLogin === today) return { alreadyClaimed: true, streak: user.streak_days }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak = lastLogin === yesterday ? user.streak_days + 1 : 1

  await supabase.from('users').update({
    last_login_date: today,
    streak_days: newStreak,
    updated_at: new Date().toISOString(),
  }).eq('telegram_id', telegramId)

  // Base daily reward
  await awardTbola(telegramId, TBOLA.DAILY_LOGIN, 'daily_login', null, `Day ${newStreak} login`)

  // Streak milestones
  const streakRewards = { 7: 'streak_7d', 30: 'streak_30d', 100: 'streak_100d' }
  const streakAmounts = { 7: TBOLA.STREAK_7D, 30: TBOLA.STREAK_30D, 100: TBOLA.STREAK_100D }

  if (streakRewards[newStreak]) {
    await awardTbola(telegramId, streakAmounts[newStreak], streakRewards[newStreak],
      null, `${newStreak}-day streak bonus!`)
    await unlockAchievement(telegramId, `streak_${newStreak}`, streakAmounts[newStreak])
  }

  return { alreadyClaimed: false, streak: newStreak }
}

// Award TBOLA via SQL function
export async function awardTbola(userId, amount, type, referenceId = null, note = null) {
  const { data } = await supabase.rpc('award_tbola', {
    p_user_id:      userId,
    p_amount:       amount,
    p_type:         type,
    p_reference_id: referenceId,
    p_note:         note,
  })
  return data
}

// Award XP via SQL function
export async function awardXp(userId, xp) {
  const { data: newLevel } = await supabase.rpc('award_xp', {
    p_user_id: userId,
    p_xp:      xp,
  })
  return newLevel
}

// Handle 3-level referral TBOLA commission
export async function handleReferralCommission(userId, tbolaEarned) {
  const PCTS = { 1: 0.05, 2: 0.02, 3: 0.01 }

  // Find referral chain up to 3 levels
  let currentId = userId
  for (let level = 1; level <= 3; level++) {
    const { data: ref } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('referred_id', currentId)
      .eq('level', 1)
      .single()

    if (!ref) break

    const commission = Math.floor(tbolaEarned * PCTS[level])
    if (commission > 0) {
      await awardTbola(ref.referrer_id, commission, `referral_l${level}`,
        null, `L${level} commission from user ${userId}`)

      // Update total earned in referrals table
      await supabase.from('referrals')
        .update({ total_tbola_earned: supabase.rpc('total_tbola_earned + ' + commission) })
        .eq('referrer_id', ref.referrer_id)
        .eq('referred_id', userId)
    }

    currentId = ref.referrer_id
  }
}

// Build referral chain when new user joins
async function handleReferralChain(referrerId, newUserId) {
  // Direct referral (L1)
  await supabase.from('referrals').insert({
    referrer_id: referrerId,
    referred_id: newUserId,
    level: 1,
  }).onConflict('referrer_id,referred_id').ignore()

  // L2 — find referrer's referrer
  const { data: l2 } = await supabase
    .from('referrals')
    .select('referrer_id')
    .eq('referred_id', referrerId)
    .eq('level', 1)
    .single()

  if (l2) {
    await supabase.from('referrals').insert({
      referrer_id: l2.referrer_id,
      referred_id: newUserId,
      level: 2,
    }).onConflict('referrer_id,referred_id').ignore()

    // L3
    const { data: l3 } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('referred_id', l2.referrer_id)
      .eq('level', 1)
      .single()

    if (l3) {
      await supabase.from('referrals').insert({
        referrer_id: l3.referrer_id,
        referred_id: newUserId,
        level: 3,
      }).onConflict('referrer_id,referred_id').ignore()
    }
  }
}

// Unlock achievement and reward TBOLA
export async function unlockAchievement(userId, type, tbolaReward = 0) {
  const { error } = await supabase.from('achievements').insert({
    user_id: userId,
    type,
    tbola_rewarded: tbolaReward,
  })
  if (!error && tbolaReward > 0) {
    await awardTbola(userId, tbolaReward, 'achievement', null, `Achievement: ${type}`)
  }
}

// Get user profile summary
export async function getUserProfile(telegramId) {
  const { data } = await supabase
    .from('users')
    .select(`
      *,
      squad_members(role, squads(name, avatar_url))
    `)
    .eq('telegram_id', telegramId)
    .single()
  return data
}
