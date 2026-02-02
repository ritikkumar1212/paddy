const pool = require("../config/db");

async function getLatestRaceLive() {

  // =====================================
  // CURRENT RACE (latest IST <= now)
  // =====================================

  const raceRes = await pool.query(`
    SELECT *,
    scraped_date + race_time_ist::time AS race_ts
    FROM races
    WHERE scraped_date = CURRENT_DATE
      AND scraped_date + race_time_ist::time <= NOW() AT TIME ZONE 'Asia/Kolkata'
    ORDER BY race_ts DESC
    LIMIT 1
  `);

  if (!raceRes.rows.length) {
    return {
      current_race: null,
      runners: [],
      last_results: [],
      duplicate_count: 0,
      last_seen: null
    };
  }

  const currentRace = raceRes.rows[0];

  // =====================================
  // RUNNERS
  // =====================================

  const runnersRes = await pool.query(`
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
  `,[currentRace.id]);

  // =====================================
  // RESULTS (ONLY AFTER 90 SECONDS)
  // =====================================

  const resultGate = await pool.query(`
    SELECT NOW() AT TIME ZONE 'Asia/Kolkata' > $1 + INTERVAL '90 seconds' AS allowed
  `,[currentRace.race_ts]);

  let lastResults = [];

  if (resultGate.rows[0].allowed) {

    const resultsRes = await pool.query(`
      SELECT position, horse_number, raw_text
      FROM race_results
      WHERE video_race_time_uk = $1
      ORDER BY position
    `,[currentRace.race_time_uk]);

    lastResults = resultsRes.rows;
  }

  // =====================================
  // DUPLICATES
  // =====================================

  const dupCountRes = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM races
    WHERE race_signature = $1
  `,[currentRace.race_signature]);

  const lastSeenRes = await pool.query(`
    SELECT scraped_at
    FROM races
    WHERE race_signature = $1
      AND scraped_at < $2
    ORDER BY scraped_at DESC
    LIMIT 1
  `,[currentRace.race_signature, currentRace.scraped_at]);

  return {
    current_race: currentRace,
    runners: runnersRes.rows,
    last_results: lastResults,
    duplicate_count: dupCountRes.rows[0]?.count || 0,
    last_seen: lastSeenRes.rows[0]?.scraped_at || null
  };
}

module.exports = { getLatestRaceLive };
