const pool = require("../config/db");

async function getLatestRaceLive() {
  const raceRes = await pool.query(`
    SELECT *
    FROM races
    ORDER BY scraped_at DESC
    LIMIT 1
  `);

  if (!raceRes.rows.length) {
    return { race:null, runners:[], results:[], duplicate_count:0, last_seen:null };
  }

  const race = raceRes.rows[0];

  const runnersRes = await pool.query(`
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
  `,[race.id]);

  const resultsRes = await pool.query(`
    SELECT position, horse_number, raw_text
    FROM race_results
    WHERE race_id = $1
    ORDER BY position
  `,[race.id]);

  const dupCountRes = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM races
    WHERE race_signature = $1
  `,[race.race_signature]);

  const lastSeenRes = await pool.query(`
    SELECT scraped_at
    FROM races
    WHERE race_signature = $1
      AND scraped_at < $2
    ORDER BY scraped_at DESC
    LIMIT 1
  `,[race.race_signature, race.scraped_at]);

  return {
    race,
    runners: runnersRes.rows,
    results: resultsRes.rows,
    duplicate_count: dupCountRes.rows[0]?.count || 0,
    last_seen: lastSeenRes.rows[0]?.scraped_at || null
  };
}


module.exports = { getLatestRaceLive };
