const racesService = require("../services/races.service");

async function insertRace(req, res, next) {
  try {
    const race = await racesService.insertRace(req.body);
    return res.status(201).json({ success: true, race });
  } catch (err) {
    next(err);
  }
}

module.exports = { insertRace };
