const resultsService = require("../services/results.service");

async function insertResults(req, res, next) {
  try {
    console.log("✅ /api/results HIT");
    console.log("BODY:", JSON.stringify(req.body, null, 2));  // <--- add this

    const inserted = await resultsService.insertResults(req.body);

    return res.status(201).json({ success: true, inserted });
  } catch (err) {
    console.error("❌ /api/results ERROR:", err.message);
    next(err);
  }
}

module.exports = { insertResults };
