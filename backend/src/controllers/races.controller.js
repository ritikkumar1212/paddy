const racesService = require("../services/races.service");

async function insertRace(req, res, next) {
  try {
    const race = await racesService.insertRace(req.body);
    return res.status(201).json({ success: true, race });
  } catch (err) {
    next(err);
  }
}

async function getDuplicates(req, res) {
  const raceId = req.params.id;

  const rows = await getDuplicateRaces(raceId);

  res.json({ success: true, data: rows });
}

module.exports = { insertRace, getDuplicates };

