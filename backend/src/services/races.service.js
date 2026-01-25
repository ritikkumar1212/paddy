const pool = require("../config/db");
const { createRaceSignature } = require("../utils/signature");

/**
 * Insert a race + all its runners.
 *
 * Expected payload from scraper.py:
 * {
 *   race_time: "01:32",
 *   race_time_uk: "20:02",
 *   runner_count: 15,
 *   scraped_at: "2026-01-21 17:30:22"  (optional)
 *   runners: [
 *     { number: 1, name: "...", jockey: "...", odds: "..." },
 *     ...
 *   ]
 * }
 */
async function insertRace(payload) {
  const { race_time, race_time_uk, runner_count, scraped_at, runners } = payload;

  // ----------------------------
  // Basic validations
  // ----------------------------
  if (!race_time || typeof race_time !== "string") {
    throw new Error("race_time is required");
  }
  if (!race_time_uk || typeof race_time_uk !== "string") {
    throw new Error("race_time_uk is required");
  }
  if (!runner_count || isNaN(Number(runner_count))) {
    throw new Error("runner_count must be a number");
  }
  if (!Array.isArray(runners) || runners.length === 0) {
    throw new Error("runners array is required");
  }

  // ----------------------------
  // Date/time handling
  // ----------------------------
  // scraped_at might come as:
  // "2026-01-21 17:30:22" (from python) OR ISO string
  // safest: always convert to JS Date
  const scrapedAt = scraped_at ? new Date(scraped_at) : new Date();
  if (isNaN(scrapedAt.getTime())) {
    throw new Error("scraped_at is invalid date format");
  }

  // for unique key grouping per-day
  const scrapedDate = scrapedAt.toISOString().slice(0, 10); // YYYY-MM-DD

  // ----------------------------
  // Create race signature for duplicate detection
  // ----------------------------
  const raceSignature = createRaceSignature(runners);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ----------------------------
    // Insert race
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
    // Insert runners
    // ----------------------------
    for (const r of runners) {
      // validate runner number
      const runnerNumber = Number(r.number);
      if (!runnerNumber || isNaN(runnerNumber)) continue;

      const horseName = r.name ? String(r.name).trim() : "";
      const jockeyName = r.jockey ? String(r.jockey).trim() : null;
      const odds = r.odds ? String(r.odds).trim() : null;

      if (!horseName) continue;

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
        ON CONFLICT (race_id, runner_number)
        DO UPDATE SET
          horse_name = EXCLUDED.horse_name,
          jockey_name = EXCLUDED.jockey_name,
          odds = EXCLUDED.odds
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

module.exports = { insertRace };
