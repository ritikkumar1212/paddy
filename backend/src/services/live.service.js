const pool = require("../config/db");

async function getLatestRaceLive() {

  // ===============================
  // 1️⃣ CURRENT RACE BY IST CLOCK
  // ===============================

  const currentRaceRes = await pool.query(`
    SELECT *,
        (scraped_date + race_time_ist::time) AS race_ts
  FROM races
  WHERE scraped_date = CURRENT_DATE
    AND (scraped_date + race_time_ist::time + INTERVAL '15 seconds')
        <= (NOW() AT TIME ZONE 'Asia/Kolkata')
  ORDER BY race_ts DESC
  LIMIT 1;

  `);

  if (!currentRaceRes.rows.length) {
    return {
      current_race: null,
      runners: [],
      last_results: [],
      duplicate_count: 0,
      last_seen: null
    };
  }

  const currentRace = currentRaceRes.rows[0];

  // ===============================
  // 2️⃣ RUNNERS
  // ===============================

  const runnersRes = await pool.query(`
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
  `, [currentRace.id]);

  // ===============================
  // 3️⃣ RESULTS ONLY FOR CURRENT RACE
  // ===============================

  const resultsRes = await pool.query(`
    SELECT position, horse_number, raw_text
    FROM race_results
    WHERE video_race_time_uk = $1
    ORDER BY position
  `, [currentRace.race_time_uk]);

  // ===============================
  // 4️⃣ DUPLICATE INFO
  // ===============================

  const dupCountRes = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM races
    WHERE race_signature = $1
  `, [currentRace.race_signature]);

  const lastSeenRes = await pool.query(`
    SELECT scraped_at
    FROM races
    WHERE race_signature = $1
      AND scraped_at < $2
    ORDER BY scraped_at DESC
    LIMIT 1
  `, [currentRace.race_signature, currentRace.scraped_at]);

  return {
    current_race: currentRace,
    runners: runnersRes.rows,
    last_results: resultsRes.rows,   // EMPTY until race finishes
    duplicate_count: dupCountRes.rows[0]?.count || 0,
    last_seen: lastSeenRes.rows[0]?.scraped_at || null
  };
}

module.exports = { getLatestRaceLive };
