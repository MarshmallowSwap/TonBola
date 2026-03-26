-- ============================================================
-- TonBola — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                BIGSERIAL PRIMARY KEY,
  telegram_id       BIGINT UNIQUE NOT NULL,
  username          TEXT,
  first_name        TEXT,
  avatar_url        TEXT,           -- custom uploaded image
  avatar_preset     TEXT,           -- preset key (e.g. "ball_pink")
  level             INTEGER DEFAULT 1,
  xp                INTEGER DEFAULT 0,
  tbola_balance     BIGINT DEFAULT 0,
  streak_days       INTEGER DEFAULT 0,
  last_login_date   DATE,
  total_games       INTEGER DEFAULT 0,
  total_wins        INTEGER DEFAULT 0,
  total_lines       INTEGER DEFAULT 0,
  total_cards_bought INTEGER DEFAULT 0,
  squad_id          UUID,
  referrer_id       BIGINT,
  is_banned         BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SQUADS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS squads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  captain_id      BIGINT NOT NULL REFERENCES users(telegram_id),
  avatar_url      TEXT,
  avatar_preset   TEXT,
  description     TEXT,
  max_members     INTEGER DEFAULT 20,
  member_count    INTEGER DEFAULT 1,
  weekly_score    INTEGER DEFAULT 0,
  monthly_score   INTEGER DEFAULT 0,
  tbola_fund      BIGINT DEFAULT 0,  -- accumulated prize fund
  total_won       BIGINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Squad members junction
CREATE TABLE IF NOT EXISTS squad_members (
  squad_id      UUID REFERENCES squads(id) ON DELETE CASCADE,
  user_id       BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  role          TEXT DEFAULT 'member' CHECK (role IN ('captain','member')),
  weekly_xp     INTEGER DEFAULT 0,
  weekly_cards  INTEGER DEFAULT 0,
  monthly_xp    INTEGER DEFAULT 0,
  monthly_cards INTEGER DEFAULT 0,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (squad_id, user_id)
);

-- ─────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code           TEXT UNIQUE NOT NULL,  -- 6-char code e.g. "XK9P2M"
  type                TEXT NOT NULL CHECK (type IN ('public','private','vip_ton')),
  currency            TEXT NOT NULL CHECK (currency IN ('free','stars','ton')),
  card_price_stars    INTEGER,
  card_price_ton      NUMERIC(12,6),
  max_players         INTEGER DEFAULT 20,
  current_players     INTEGER DEFAULT 0,
  password_hash       TEXT,
  creator_id          BIGINT REFERENCES users(telegram_id),
  status              TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
  auto_start          BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- GAMES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id                 UUID REFERENCES rooms(id),
  status                  TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
  currency                TEXT NOT NULL,

  -- financials
  total_pot_stars         INTEGER DEFAULT 0,
  total_pot_ton           NUMERIC(12,6) DEFAULT 0,
  prize_pool_stars        INTEGER DEFAULT 0,   -- 55%
  prize_pool_ton          NUMERIC(12,6) DEFAULT 0,
  creator_fee_stars       INTEGER DEFAULT 0,   -- 2% (private rooms)
  creator_fee_ton         NUMERIC(12,6) DEFAULT 0,
  leaderboard_fund_stars  INTEGER DEFAULT 0,   -- 3%
  leaderboard_fund_ton    NUMERIC(12,6) DEFAULT 0,
  tbola_fund_amount       BIGINT DEFAULT 0,    -- 8% worth in $TBOLA

  -- draw state
  drawn_numbers           INTEGER[] DEFAULT '{}',
  last_drawn_at           TIMESTAMPTZ,

  -- results
  line_winner_id          BIGINT,
  bingo_winner_id         BIGINT,
  line_prize_stars        INTEGER DEFAULT 0,
  line_prize_ton          NUMERIC(12,6) DEFAULT 0,
  bingo_prize_stars       INTEGER DEFAULT 0,
  bingo_prize_ton         NUMERIC(12,6) DEFAULT 0,

  started_at              TIMESTAMPTZ,
  finished_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- GAME PLAYERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_players (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id           BIGINT REFERENCES users(telegram_id),
  cards             JSONB DEFAULT '[]',   -- array of 15-number cards
  cards_count       INTEGER DEFAULT 0,
  marked_numbers    INTEGER[] DEFAULT '{}',
  has_line          BOOLEAN DEFAULT FALSE,
  has_bingo         BOOLEAN DEFAULT FALSE,
  line_at_number    INTEGER,              -- which drawn number triggered line
  bingo_at_number   INTEGER,
  prize_stars       INTEGER DEFAULT 0,
  prize_ton         NUMERIC(12,6) DEFAULT 0,
  tbola_earned      BIGINT DEFAULT 0,
  xp_earned         INTEGER DEFAULT 0,
  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- ─────────────────────────────────────────
-- $TBOLA LEDGER (every token movement)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tbola_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT REFERENCES users(telegram_id),
  amount        BIGINT NOT NULL,    -- positive = credit, negative = debit
  balance_after BIGINT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN (
    'card_purchase',
    'game_played',
    'line_win',
    'bingo_win',
    'vip_room_bonus',
    'daily_login',
    'streak_7d',
    'streak_30d',
    'streak_100d',
    'referral_join',
    'referral_l1',
    'referral_l2',
    'referral_l3',
    'achievement',
    'leaderboard_weekly',
    'leaderboard_monthly',
    'squad_prize',
    'season_champion',
    'presale',
    'airdrop'
  )),
  reference_id  UUID,   -- game_id, achievement_id, etc.
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- REFERRALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id         BIGINT REFERENCES users(telegram_id),
  referred_id         BIGINT REFERENCES users(telegram_id),
  level               INTEGER DEFAULT 1 CHECK (level IN (1,2,3)),
  total_tbola_earned  BIGINT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- ─────────────────────────────────────────
-- LEADERBOARD — WEEKLY (users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          DATE NOT NULL,
  user_id             BIGINT REFERENCES users(telegram_id),
  score               INTEGER DEFAULT 0,
  games_played        INTEGER DEFAULT 0,
  cards_bought        INTEGER DEFAULT 0,
  xp_earned           INTEGER DEFAULT 0,
  wins                INTEGER DEFAULT 0,
  prize_paid_stars    INTEGER DEFAULT 0,
  prize_paid_ton      NUMERIC(12,6) DEFAULT 0,
  prize_paid_tbola    BIGINT DEFAULT 0,
  rank                INTEGER,
  UNIQUE(week_start, user_id)
);

-- ─────────────────────────────────────────
-- LEADERBOARD — MONTHLY (users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard_monthly (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_start         DATE NOT NULL,
  user_id             BIGINT REFERENCES users(telegram_id),
  score               INTEGER DEFAULT 0,
  games_played        INTEGER DEFAULT 0,
  cards_bought        INTEGER DEFAULT 0,
  xp_earned           INTEGER DEFAULT 0,
  wins                INTEGER DEFAULT 0,
  prize_paid_stars    INTEGER DEFAULT 0,
  prize_paid_ton      NUMERIC(12,6) DEFAULT 0,
  prize_paid_tbola    BIGINT DEFAULT 0,
  rank                INTEGER,
  UNIQUE(month_start, user_id)
);

-- ─────────────────────────────────────────
-- LEADERBOARD — WEEKLY (squads)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard_squads_weekly (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          DATE NOT NULL,
  squad_id            UUID REFERENCES squads(id),
  score               INTEGER DEFAULT 0,
  active_members      INTEGER DEFAULT 0,
  total_cards_bought  INTEGER DEFAULT 0,
  total_xp            INTEGER DEFAULT 0,
  prize_paid_stars    INTEGER DEFAULT 0,
  prize_paid_ton      NUMERIC(12,6) DEFAULT 0,
  prize_paid_tbola    BIGINT DEFAULT 0,
  rank                INTEGER,
  UNIQUE(week_start, squad_id)
);

-- ─────────────────────────────────────────
-- ACHIEVEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT REFERENCES users(telegram_id),
  type            TEXT NOT NULL CHECK (type IN (
    'games_10','games_100','games_1000',
    'streak_7','streak_30','streak_100',
    'referral_1','referral_5','referral_25',
    'leaderboard_top10_weekly','leaderboard_top3_monthly',
    'squad_champion',
    'first_bingo','first_line',
    'vip_room_first'
  )),
  unlocked_at     TIMESTAMPTZ DEFAULT NOW(),
  tbola_rewarded  BIGINT DEFAULT 0,
  UNIQUE(user_id, type)
);

-- ─────────────────────────────────────────
-- PRIZE FUNDS (tracked pools)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prize_funds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_type       TEXT NOT NULL CHECK (fund_type IN (
    'leaderboard_weekly_stars',
    'leaderboard_weekly_ton',
    'leaderboard_monthly_stars',
    'leaderboard_monthly_ton',
    'squad_weekly',
    'season'
  )),
  period_start    DATE NOT NULL,
  period_end      DATE,
  balance_stars   INTEGER DEFAULT 0,
  balance_ton     NUMERIC(12,6) DEFAULT 0,
  balance_tbola   BIGINT DEFAULT 0,
  is_distributed  BOOLEAN DEFAULT FALSE,
  distributed_at  TIMESTAMPTZ,
  UNIQUE(fund_type, period_start)
);

-- ─────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_squad_id ON users(squad_id);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_tbola_ledger_user_id ON tbola_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_tbola_ledger_created_at ON tbola_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_week ON leaderboard_weekly(week_start, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_monthly_month ON leaderboard_monthly(month_start, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_squads_week ON leaderboard_squads_weekly(week_start, score DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbola_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (bot backend)
CREATE POLICY "service_role_all_users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_games" ON games FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_gp" ON game_players FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_ledger" ON tbola_ledger FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_squads" ON squads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_sm" ON squad_members FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────

-- Add TBOLA to user balance and log it
CREATE OR REPLACE FUNCTION award_tbola(
  p_user_id BIGINT,
  p_amount BIGINT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  UPDATE users
  SET tbola_balance = tbola_balance + p_amount,
      updated_at = NOW()
  WHERE telegram_id = p_user_id
  RETURNING tbola_balance INTO new_balance;

  INSERT INTO tbola_ledger (user_id, amount, balance_after, type, reference_id, note)
  VALUES (p_user_id, p_amount, new_balance, p_type, p_reference_id, p_note);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add XP and handle level up
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id BIGINT,
  p_xp INTEGER
) RETURNS INTEGER AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE users
  SET xp = xp + p_xp,
      updated_at = NOW()
  WHERE telegram_id = p_user_id
  RETURNING xp INTO new_xp;

  -- Level thresholds: 100xp per level (simple formula, tune later)
  new_level := GREATEST(1, FLOOR(new_xp / 100) + 1);

  UPDATE users SET level = new_level WHERE telegram_id = p_user_id AND level < new_level;

  RETURN new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique 6-char room code
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────
-- Tables created:
--   users, squads, squad_members, rooms, games,
--   game_players, tbola_ledger, referrals,
--   leaderboard_weekly, leaderboard_monthly,
--   leaderboard_squads_weekly, achievements, prize_funds
--
-- Functions created:
--   award_tbola(), award_xp(), generate_room_code()
