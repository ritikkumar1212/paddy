const pool = require("../config/db");
const ExcelJS = require("exceljs");

async function exportExcel(req, res) {
  const races = await pool.query(`
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
    LEFT JOIN race_results res ON res.race_id = r.id
      AND res.horse_number = rr.runner_number
    ORDER BY r.id DESC, rr.runner_number
  `);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Races");

  ws.columns = [
    { header: "Race ID", key: "race_id" },
    { header: "UK Time", key: "race_time_uk" },
    { header: "IST Time", key: "race_time_ist" },
    { header: "Runner #", key: "runner_number" },
    { header: "Horse", key: "horse_name" },
    { header: "Jockey", key: "jockey_name" },
    { header: "Odds", key: "odds" },
    { header: "Position", key: "position" }
  ];

  races.rows.forEach(r => ws.addRow(r));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=races.xlsx");

  await wb.xlsx.write(res);
  res.end();
}

module.exports = { exportExcel };
