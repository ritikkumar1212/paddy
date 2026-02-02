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
async function getUpcoming(req,res){
  try{
    const upcoming = await raceService.getUpcomingRaces();
    res.json({data:upcoming});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"failed"});
  }
}

async function getRaceDetails(req,res){
  try{
    const data = await raceService.getRaceDetails(req.params.id);
    res.json({data});
  }catch(e){
    res.status(500).json({error:"Failed"});
  }
}

module.exports = { insertRace, getDuplicates, getUpcoming, getRaceDetails };

