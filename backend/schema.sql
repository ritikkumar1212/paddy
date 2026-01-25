-- =============================
-- CLEAN RESET (safe notices)
-- =============================
DROP TABLE IF EXISTS race_runners CASCADE;
DROP TABLE IF EXISTS race_results CASCADE;
DROP TABLE IF EXISTS races CASCADE;

-- =============================
-- RACES
-- =============================
CREATE TABLE races (
  id BIGSERIAL PRIMARY KEY,

  race_time_ist VARCHAR(10) NOT NULL,
  race_time_uk  VARCHAR(10) NOT NULL,

  runner_count INT NOT NULL CHECK (runner_count BETWEEN 1 AND 30),

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ✅ manually set by backend
  scraped_date DATE NOT NULL,

  race_signature TEXT,

  -- ✅ valid unique constraint
  UNIQUE (race_time_uk, scraped_date)
);

-- =============================
-- RACE RUNNERS
-- =============================
CREATE TABLE race_runners (
  id BIGSERIAL PRIMARY KEY,

  race_id BIGINT NOT NULL REFERENCES races(id) ON DELETE CASCADE,

  runner_number INT NOT NULL CHECK (runner_number BETWEEN 1 AND 30),
  horse_name TEXT NOT NULL,
  jockey_name TEXT,
  odds TEXT,

  UNIQUE (race_id, runner_number)
);

-- =============================
-- RACE RESULTS
-- =============================
CREATE TABLE race_results (
  id BIGSERIAL PRIMARY KEY,

  race_time_capture TEXT NOT NULL,
  video_race_time_uk VARCHAR(10),

  position INT NOT NULL CHECK (position BETWEEN 1 AND 4),
  horse_number INT,

  raw_text TEXT,
  full_line TEXT,

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- INDEXES
-- =============================
CREATE INDEX idx_races_latest ON races(scraped_at DESC);
CREATE INDEX idx_race_signature ON races(race_signature);
CREATE INDEX idx_runners_race ON race_runners(race_id);
CREATE INDEX idx_results_video_time ON race_results(video_race_time_uk);
