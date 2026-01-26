const pool = require("../config/db");

async function getLatestRaceLive() {

  // 1️⃣ Current race (X)
  const currentRaceRes = await pool.query(`
    SELECT *
    FROM races
    ORDER BY scraped_at DESC
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

  // 2️⃣ Runners for current race X
  const runnersRes = await pool.query(`
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
  `,[currentRace.id]);

  // 3️⃣ Previous race X-1
  const prevRaceRes = await pool.query(`
    SELECT *
    FROM races
    ORDER BY scraped_at DESC
    OFFSET 1
    LIMIT 1
  `);

  let lastResults = [];

  if (prevRaceRes.rows.length) {
    const prevRace = prevRaceRes.rows[0];

    // 4️⃣ Results for X-1 ONLY
    const resultsRes = await pool.query(`
      SELECT position, horse_number, raw_text
      FROM race_results
      WHERE race_id = $1
      ORDER BY position
    `,[prevRace.id]);

    lastResults = resultsRes.rows;
  }

  // 5️⃣ Duplicate detection for current race
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
