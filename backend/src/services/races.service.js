const pool = require("../config/db");
const { createRaceSignature } = require("../utils/signature");

/**
 * Insert / update race + runners
 */
async function insertRace(payload) {
  const { race_time, race_time_uk, runner_count, scraped_at, runners } = payload;

  // ----------------------------
  // Validation
  // ----------------------------
  if (!race_time || typeof race_time !== "string") {
    throw new Error("race_time is required");
  }

  if (!race_time_uk || typeof race_time_uk !== "string") {
    throw new Error("race_time_uk is required");
  }

  if (!runner_count || isNaN(Number(runner_count))) {
    throw new Error("runner_count must be numeric");
  }

  if (!Array.isArray(runners) || runners.length === 0) {
    throw new Error("runners array missing");
  }

  // ----------------------------
  // Time handling
  // ----------------------------
  const scrapedAt = scraped_at ? new Date(scraped_at) : new Date();

  if (isNaN(scrapedAt.getTime())) {
    throw new Error("Invalid scraped_at");
  }

  const scrapedDate = scrapedAt.toISOString().slice(0, 10);

  // ----------------------------
  // Signature (duplicate detection)
  // ----------------------------
  const raceSignature = createRaceSignature(runners);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ----------------------------
    // Insert / update race
    // ----------------------------
    const raceInsert = await client.query(
      `
      INSERT INTO races (
        race_time_ist,
        race_time_uk,
        runner_count,
        scraped_at,
        scraped_date,
        race_signature
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (race_time_uk, scraped_date)
      DO UPDATE SET
        runner_count = EXCLUDED.runner_count,
        race_signature = EXCLUDED.race_signature,
        scraped_at = EXCLUDED.scraped_at
      RETURNING *
      `,
      [
        race_time,
        race_time_uk,
        Number(runner_count),
        scrapedAt.toISOString(),
        scrapedDate,
        raceSignature
      ]
    );

    const raceRow = raceInsert.rows[0];
    const raceId = raceRow.id;

    // ----------------------------
    // Clear previous runners
    // ----------------------------
    await client.query(
      `DELETE FROM race_runners WHERE race_id = $1`,
      [raceId]
    );

    // ----------------------------
    // Insert runners
    // ----------------------------
    for (const r of runners) {
      const runnerNumber = Number(r.number);
      if (!runnerNumber || isNaN(runnerNumber)) continue;

      const horseName = r.name ? String(r.name).trim() : "";
      if (!horseName) continue;

      const jockeyName = r.jockey ? String(r.jockey).trim() : null;
      const odds = r.odds ? String(r.odds).trim() : null;

      await client.query(
        `
        INSERT INTO race_runners (
          race_id,
          runner_number,
          horse_name,
          jockey_name,
          odds
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [raceId, runnerNumber, horseName, jockeyName, odds]
      );
    }

    await client.query("COMMIT");
    return raceRow;

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getDuplicateRaces(raceId) {
  const sigRes = await pool.query(
    `SELECT race_signature FROM races WHERE id=$1`,
    [raceId]
  );

  if (!sigRes.rows.length) return [];

  const signature = sigRes.rows[0].race_signature;

  const dupes = await pool.query(
    `
    SELECT id, race_time_uk, scraped_at, runner_count
    FROM races
    WHERE race_signature = $1
    ORDER BY scraped_at DESC
    `,
    [signature]
  );

  return dupes.rows;
}

async function getUpcomingRaces(currentRaceTime) {

  const res = await pool.query(`
    SELECT id, race_time_ist, race_time_uk, runner_count
    FROM races
    WHERE scraped_date = CURRENT_DATE
      AND race_time_ist > $1
    ORDER BY race_time_ist
    LIMIT 10
  `,[currentRaceTime]);

  return res.rows;
}
async function getRaceDetails(id) {

  const race = await pool.query(`SELECT * FROM races WHERE id=$1`,[id]);
  const runners = await pool.query(`SELECT * FROM race_runners WHERE race_id=$1`,[id]);

  const signature = race.rows[0].race_signature;

  const history = await pool.query(`
    SELECT r.id, r.scraped_at,
      (SELECT horse_name
       FROM race_runners rr
       JOIN race_results res
         ON res.horse_number = rr.runner_number
        AND rr.race_id = r.id
       WHERE res.position = 1
       LIMIT 1) AS winner
    FROM races r
    WHERE race_signature = $1
      AND r.id <> $2
    ORDER BY scraped_at DESC
  `,[signature,id]);

  return {
    race: race.rows[0],
    runners: runners.rows,
    history: history.rows
  };
}

module.exports = { insertRace, getDuplicateRaces, getUpcomingRaces, getRaceDetails };
