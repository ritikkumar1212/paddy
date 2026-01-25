const liveService = require("../services/live.service");

async function getLatest(req, res, next) {
  try {
    const data = await liveService.getLatestRaceLive();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLatest };
