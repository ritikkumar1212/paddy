const pool = require("../config/db");

async function insertResults(payload) {
  const { race_time_capture, video_race_time_uk, results, scraped_at } = payload;

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Invalid results payload");
  }

  const scrapedAt = scraped_at ? new Date(scraped_at) : new Date();

  // -----------------------------------
  // Find latest matching race by UK time
  // -----------------------------------
  const raceLookup = await pool.query(
    `
    SELECT id
    FROM races
    WHERE race_time_uk = $1
    ORDER BY scraped_at DESC
    LIMIT 1
    `,
    [video_race_time_uk]
  );

  if (!raceLookup.rows.length) {
    console.warn("⚠️ No race found for results:", video_race_time_uk);
    return 0;
  }

  const raceId = raceLookup.rows[0].id;

  let inserted = 0;

  for (const r of results) {
    await pool.query(
      `
      INSERT INTO race_results (
        race_id,
        race_time_capture,
        video_race_time_uk,
        position,
        horse_number,
        raw_text,
        full_line,
        scraped_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        raceId,
        race_time_capture ?? null,
        video_race_time_uk ?? null,
        Number(r.position),
        r.horse_number ? Number(r.horse_number) : null,
        r.raw_text ?? null,
        r.full_line ?? null,
        scrapedAt.toISOString()
      ]
    );

    inserted++;
  }

  return inserted;
}

module.exports = { insertResults };
