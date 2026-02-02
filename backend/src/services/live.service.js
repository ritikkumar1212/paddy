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
      AND (scraped_date + race_time_ist::time)
          <= (NOW() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '30 seconds'
    ORDER BY race_ts DESC
    LIMIT 1
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
  // 2️⃣ RUNNERS FOR CURRENT RACE
  // ===============================

  const runnersRes = await pool.query(`
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
  `, [currentRace.id]);

  // ===============================
  // 3️⃣ CHECK RESULTS FOR SAME RACE
  // ===============================

  let lastResults = [];

  const currentResults = await pool.query(`
    SELECT position, horse_number, raw_text
    FROM race_results
    WHERE race_id = $1
    ORDER BY position
  `, [currentRace.id]);

  if (currentResults.rows.length) {

    // ✅ Result already available for current race
    lastResults = currentResults.rows;

  } else {

    // ===============================
    // 4️⃣ FALLBACK TO PREVIOUS RACE
    // ===============================

    const prevRaceRes = await pool.query(`
      SELECT *,
      (scraped_date + race_time_ist::time) AS race_ts
      FROM races
      WHERE scraped_date = CURRENT_DATE
        AND (scraped_date + race_time_ist::time) < $1
      ORDER BY race_ts DESC
      LIMIT 1
    `, [currentRace.race_ts]);

    if (prevRaceRes.rows.length) {
      const prevRace = prevRaceRes.rows[0];

      const prevResults = await pool.query(`
        SELECT position, horse_number, raw_text
        FROM race_results
        WHERE race_id = $1
        ORDER BY position
      `, [prevRace.id]);

      lastResults = prevResults.rows;
    }
  }

  // ===============================
  // 5️⃣ DUPLICATE INFO
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
    last_results: lastResults,
    duplicate_count: dupCountRes.rows[0]?.count || 0,
    last_seen: lastSeenRes.rows[0]?.scraped_at || null
  };
}

module.exports = { getLatestRaceLive };
