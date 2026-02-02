const pool = require("../config/db");

async function getLatestRaceLive() {

  // ================= IST NOW =================
  const nowRes = await pool.query(`
    SELECT NOW() AT TIME ZONE 'Asia/Kolkata' AS ist_now
  `);

  const istNow = nowRes.rows[0].ist_now;

  // ================= CURRENT RACE =================
  // Extract HH:MM safely using regex

  const raceRes = await pool.query(`
    SELECT *,
      to_timestamp(
        scraped_date || ' ' ||
        substring(race_time_ist from '([0-9]{2}:[0-9]{2})'),
        'YYYY-MM-DD HH24:MI'
      ) AS race_ts
    FROM races
    WHERE scraped_at >= NOW() - INTERVAL '3 hours'
      AND substring(race_time_ist from '([0-9]{2}:[0-9]{2})') IS NOT NULL
      AND to_timestamp(
            scraped_date || ' ' ||
            substring(race_time_ist from '([0-9]{2}:[0-9]{2})'),
            'YYYY-MM-DD HH24:MI'
          ) <= $1
    ORDER BY race_ts DESC
    LIMIT 1
  `,[istNow]);

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
  /// ================= UPCOMING RACES (MINIMAL FIX) =================

const upcomingRes = await pool.query(`
  SELECT id, race_time_ist, race_time_uk, runner_count
  FROM races
  WHERE
    to_timestamp(
      scraped_date || ' ' ||
      substring(race_time_ist from '([0-9]{2}:[0-9]{2})'),
      'YYYY-MM-DD HH24:MI'
    ) AT TIME ZONE 'Asia/Kolkata'
    >
    to_timestamp(
      $1::date || ' ' ||
      substring($2 from '([0-9]{2}:[0-9]{2})'),
      'YYYY-MM-DD HH24:MI'
    ) AT TIME ZONE 'Asia/Kolkata'
  ORDER BY race_time_ist
  LIMIT 10
`, [
  currentRace.scraped_date,
  currentRace.race_time_ist
]);

const upcoming = upcomingRes.rows;

  // ================= RUNNERS =================

  const runnersRes = await pool.query(`
    SELECT runner_number, horse_name, jockey_name, odds
    FROM race_runners
    WHERE race_id = $1
    ORDER BY runner_number
  `,[currentRace.id]);

  // ================= RESULT GATE =================
  // Show result ONLY after 90 seconds

  let lastResults = [];
  const raceTs = new Date(currentRace.race_ts);
  if (istNow > new Date(raceTs.getTime() + 90000)) {

    const resultRes = await pool.query(`
      SELECT position, horse_number, raw_text
      FROM race_results
      WHERE video_race_time_uk = $1
      ORDER BY position
    `,[currentRace.race_time_uk]);

    lastResults = resultRes.rows;
  }

  // ================= DUPLICATES =================

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
    upcoming,
    duplicate_count: dupCountRes.rows[0]?.count || 0,
    last_seen: lastSeenRes.rows[0]?.scraped_at || null
  };
}

module.exports = { getLatestRaceLive };
