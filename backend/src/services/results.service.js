const pool = require("../config/db");

async function insertResults(payload) {
  const { race_id, race_time_capture, video_race_time_uk, results, scraped_at } = payload;

  if (!race_id || !Array.isArray(results)) {
    throw new Error("Invalid payload for results insert");
  }

  const scrapedAt = scraped_at ? new Date(scraped_at) : new Date();

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
        race_id,
        race_time_capture,
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
