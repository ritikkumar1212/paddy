CREATE TABLE races (
  id SERIAL PRIMARY KEY,

  race_time_ist TEXT NOT NULL,
  race_time_uk TEXT NOT NULL,

  runner_count INTEGER NOT NULL,

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scraped_date DATE NOT NULL DEFAULT CURRENT_DATE,

  race_signature TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE race_runners (
  id SERIAL PRIMARY KEY,

  race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,

  runner_number INTEGER NOT NULL,
  horse_name TEXT,
  jockey_name TEXT,
  odds TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE race_results (
  id SERIAL PRIMARY KEY,

  race_time_capture TEXT,

  video_race_time_uk TEXT,

  position INTEGER,
  horse_number INTEGER,

  raw_text TEXT,
  full_line TEXT,

  scraped_at TIMESTAMPTZ DEFAULT now()
);


CREATE INDEX idx_races_scraped_at ON races(scraped_at DESC);

CREATE INDEX idx_runners_race_id ON race_runners(race_id);

CREATE INDEX idx_results_scraped_at ON race_results(scraped_at DESC);

CREATE INDEX idx_results_race_time_capture ON race_results(race_time_capture);
