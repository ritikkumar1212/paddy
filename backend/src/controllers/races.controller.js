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
  try {
    const raceId = req.params.id;
    const rows = await racesService.getDuplicateRaces(raceId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "failed" });
  }
}

async function getUpcoming(req,res){
  try{
    const upcoming = await racesService.getUpcomingRaces();
    res.json({data:upcoming});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"failed"});
  }
}

async function getRaceDetails(req,res){
  try{
    const data = await racesService.getRaceDetails(req.params.id);
    res.json({data});
  }catch(e){
    res.status(500).json({error:"Failed"});
  }
}

module.exports = {
  insertRace,
  getDuplicates,
  getUpcoming,
  getRaceDetails
};
