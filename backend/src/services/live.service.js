const pool = require("../config/db");

async function getLatestRaceLive() {
  // 1️⃣ Latest race (for race info + runners)
  const raceRes = await pool.query(`
    SELECT *
    FROM races
    ORDER BY scraped_at DESC
    LIMIT 1
  `);

  if (!raceRes.rows.length) {
    return {
      race: null,
      runners: [],
      results: [],
      duplicate_count: 0,
      last_seen: null
    };
  }

  const race = raceRes.rows[0];

  // 2️⃣ Runners for latest race
  const runnersRes = await pool.query(
    `
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
    `,
    [race.id]
  );

  // --------------------------------------------------
  // 3️⃣ MOST RECENT RESULTS SET (THIS IS THE KEY)
  // --------------------------------------------------

  // Find latest race_time_capture
  const latestResultKeyRes = await pool.query(`
    SELECT race_time_capture
    FROM race_results
    ORDER BY scraped_at DESC
    LIMIT 1
  `);

  let results = [];

  if (latestResultKeyRes.rows.length) {
    const raceTimeCapture = latestResultKeyRes.rows[0].race_time_capture;

    const resultsRes = await pool.query(
      `
      SELECT position, horse_number, raw_text
      FROM race_results
      WHERE race_time_capture = $1
      ORDER BY position ASC
      `,
      [raceTimeCapture]
    );

    results = resultsRes.rows;
  }

  // 4️⃣ Duplicate info (still based on latest race)
  const dupCountRes = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM races
    WHERE race_signature = $1
    `,
    [race.race_signature]
  );

  const lastSeenRes = await pool.query(
    `
    SELECT scraped_at
    FROM races
    WHERE race_signature = $1
      AND scraped_at < $2
    ORDER BY scraped_at DESC
    LIMIT 1
    `,
    [race.race_signature, race.scraped_at]
  );

  return {
    race,
    runners: runnersRes.rows,
    results, // ✅ persists until NEW results arrive
    duplicate_count: dupCountRes.rows[0]?.count || 0,
    last_seen: lastSeenRes.rows[0]?.scraped_at || null
  };
}

module.exports = { getLatestRaceLive };
