export const TBOLA = {
  PER_CARD:    Number(process.env.TBOLA_PER_CARD)    || 50,
  PER_GAME:    Number(process.env.TBOLA_PER_GAME)    || 10,
  LINE_WIN:    Number(process.env.TBOLA_LINE_WIN)    || 100,
  BINGO_WIN:   Number(process.env.TBOLA_BINGO_WIN)   || 500,
  DAILY_LOGIN: Number(process.env.TBOLA_DAILY_LOGIN) || 5,
  STREAK_7D:   100,
  STREAK_30D:  500,
  STREAK_100D: 3000,
  REFERRAL_JOIN: 500,
  VIP_BONUS:   200,
}

export const XP = {
  PER_CARD:  10,
  LINE_WIN:  25,
  BINGO_WIN: 100,
  DAILY:     5,
}

export const ECONOMY = {
  PRIZE_POOL_PCT:      0.55,
  DEV_PCT:             0.32,
  TOKEN_FUND_PCT:      0.08,
  LEADERBOARD_PCT:     0.03,
  PLATFORM_PCT:        0.02,
  CREATOR_FEE_PCT:     0.02,  // private rooms
  PRIZE_POOL_PRIVATE:  0.53,  // 55% - 2% creator
}

export const GAME = {
  DRAW_INTERVAL_MS:  Number(process.env.DRAW_INTERVAL_MS) || 5000,
  LOBBY_WAIT_SEC:    Number(process.env.MAX_LOBBY_WAIT_SEC) || 120,
  CARD_NUMBERS:      15,  // numbers per bingo card
  TOTAL_NUMBERS:     90,  // 1–90 Italian bingo
  LINE_PRIZE_PCT:    0.25, // 25% of prize pool for first line
  BINGO_PRIZE_PCT:   0.75, // 75% of prize pool for full house
}

export const LEVELS = {
  // XP needed to reach each level (cumulative)
  thresholds: [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000],
  unlocks: {
    10: 'gold_cards',
    20: 'vip_rooms',
    30: 'double_xp_weekend',
    50: 'daily_free_card',
    75: 'legend_avatar',
  }
}
