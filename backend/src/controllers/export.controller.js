const pool = require("../config/db");
const ExcelJS = require("exceljs");

async function exportExcel(req, res) {
  try {
    const client = await pool.connect();

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const sheet = workbook.addWorksheet("Races");

    const maxRunners = 16;

    const columns = [
      { header: "Date", key: "scraped_date", width: 12 },
      { header: "Time", key: "scraped_time", width: 10 },
      { header: "UK Time", key: "race_time_uk", width: 10 },
      { header: "IST Time", key: "race_time_ist", width: 10 }
    ];

    for (let i = 1; i <= maxRunners; i += 1) {
      columns.push(
        { header: `Name_${i}`, key: `name_${i}`, width: 25 },
        { header: `Jockey_${i}`, key: `jockey_${i}`, width: 25 },
        { header: `Odds_${i}`, key: `odds_${i}`, width: 12 }
      );
    }

    columns.push(
      { header: "Duplicate Count", key: "duplicate_count", width: 16 },
      { header: "Last Seen", key: "last_seen", width: 22 }
    );

    sheet.columns = columns;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=paddy_races.xlsx"
    );

    const query = `
      SELECT
        r.id AS race_id,
        r.scraped_date,
        r.scraped_at,
        r.race_time_uk,
        r.race_time_ist,
        r.race_signature,
        (
          SELECT COUNT(*)::int
          FROM races r2
          WHERE r2.race_signature = r.race_signature
        ) AS duplicate_count,
        (
          SELECT r3.scraped_at
          FROM races r3
          WHERE r3.race_signature = r.race_signature
            AND r3.scraped_at < r.scraped_at
          ORDER BY r3.scraped_at DESC
          LIMIT 1
        ) AS last_seen
      FROM races r
      ORDER BY r.id DESC
    `;

    const cursor = client.query(new (require("pg-cursor"))(query));

    const read = async () => {
      return new Promise((resolve, reject) => {
        cursor.read(200, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    while (true) {
      const rows = await read();
      if (!rows.length) break;

      const raceIds = rows.map(r => r.race_id);
      const runnersRes = await pool.query(
        `
        SELECT race_id, runner_number, horse_name, jockey_name, odds
        FROM race_runners
        WHERE race_id = ANY($1)
        ORDER BY race_id, runner_number
        `,
        [raceIds]
      );

      const resultsRes = await pool.query(
        `
        SELECT race_id, horse_number, position
        FROM race_results
        WHERE race_id = ANY($1)
        `,
        [raceIds]
      );

      const runnersByRace = {};
      for (const rr of runnersRes.rows) {
        if (!runnersByRace[rr.race_id]) runnersByRace[rr.race_id] = {};
        runnersByRace[rr.race_id][rr.runner_number] = rr;
      }

      const resultsByRace = {};
      for (const resRow of resultsRes.rows) {
        if (!resultsByRace[resRow.race_id]) {
          resultsByRace[resRow.race_id] = {};
        }
        resultsByRace[resRow.race_id][resRow.horse_number] = resRow.position;
      }

      const fillForPosition = (position) => {
        if (position === 1) return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD700" } }; // gold
        if (position === 2) return { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0C0C0" } }; // silver
        if (position === 3) return { type: "pattern", pattern: "solid", fgColor: { argb: "FFCD7F32" } }; // bronze
        return null;
      };

      rows.forEach(r => {
        const row = {
          scraped_date: r.scraped_date,
          scraped_time: r.scraped_at ? String(r.scraped_at).slice(11, 19) : null,
          race_time_uk: r.race_time_uk,
          race_time_ist: r.race_time_ist,
          duplicate_count: r.duplicate_count,
          last_seen: r.last_seen
        };

        const raceRunners = runnersByRace[r.race_id] || {};
        const raceResults = resultsByRace[r.race_id] || {};
        for (let i = 1; i <= maxRunners; i += 1) {
          const rr = raceRunners[i];
          row[`name_${i}`] = rr?.horse_name || null;
          row[`jockey_${i}`] = rr?.jockey_name || null;
          row[`odds_${i}`] = rr?.odds || null;
        }

        const added = sheet.addRow(row);

        const baseCol = 4; // Date, Time, UK Time, IST Time
        for (let i = 1; i <= maxRunners; i += 1) {
          const pos = raceResults[i];
          const fill = fillForPosition(pos);
          if (!fill) continue;

          const nameCol = baseCol + (i - 1) * 3 + 1;
          const jockeyCol = nameCol + 1;
          const oddsCol = nameCol + 2;

          added.getCell(nameCol).fill = fill;
          added.getCell(jockeyCol).fill = fill;
          added.getCell(oddsCol).fill = fill;
        }

        added.commit();
      });
    }

    await workbook.commit();
    cursor.close(() => client.release());

  } catch (err) {
    console.error("Excel export failed:", err);
    res.status(500).json({ error: "Excel export failed" });
  }
}

module.exports = { exportExcel };
