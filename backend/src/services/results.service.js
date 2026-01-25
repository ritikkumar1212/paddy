const pool = require("../config/db");

async function insertResults(payload) {
  const { race_time_capture, results, scraped_at } = payload;

  if (!race_time_capture || !Array.isArray(results)) {
    throw new Error("Invalid payload");
  }

  const scrapedAt = scraped_at ? new Date(scraped_at) : new Date();

  // 🔑 Find the race that just finished
  const raceRes = await pool.query(
    `
    SELECT id
    FROM races
    WHERE scraped_at <= $1
    ORDER BY scraped_at DESC
    LIMIT 1
    `,
    [scrapedAt]
  );

  if (!raceRes.rows.length) return 0;

  const raceId = raceRes.rows[0].id;

  let inserted = 0;

  for (const r of results) {
    const q = await pool.query(
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
      ON CONFLICT DO NOTHING
      `,
      [
        raceId,
        race_time_capture,
        r.video_race_time_uk ?? null,
        r.position,
        r.horse_number,
        r.raw_text,
        r.full_line,
        scrapedAt.toISOString()
      ]
    );

    inserted += q.rowCount;
  }

  return inserted;
}

module.exports = { insertResults };
