const pool = require("../config/db");
const ExcelJS = require("exceljs");

async function exportExcel(req, res) {
  try {
    const client = await pool.connect();

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const sheet = workbook.addWorksheet("Races");

    sheet.columns = [
      { header: "Race ID", key: "race_id", width: 10 },
      { header: "UK Time", key: "race_time_uk", width: 10 },
      { header: "IST Time", key: "race_time_ist", width: 10 },
      { header: "Runner #", key: "runner_number", width: 10 },
      { header: "Horse", key: "horse_name", width: 25 },
      { header: "Jockey", key: "jockey_name", width: 25 },
      { header: "Odds", key: "odds", width: 10 },
      { header: "Position", key: "position", width: 10 }
    ];

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
        r.race_time_uk,
        r.race_time_ist,
        rr.runner_number,
        rr.horse_name,
        rr.jockey_name,
        rr.odds,
        res.position
      FROM races r
      LEFT JOIN race_runners rr ON rr.race_id = r.id
      LEFT JOIN race_results res 
        ON res.race_id = r.id
       AND res.horse_number = rr.runner_number
      ORDER BY r.id DESC, rr.runner_number
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

      rows.forEach(r => sheet.addRow(r).commit());
    }

    await workbook.commit();
    cursor.close(() => client.release());

  } catch (err) {
    console.error("Excel export failed:", err);
    res.status(500).json({ error: "Excel export failed" });
  }
}

module.exports = { exportExcel };
