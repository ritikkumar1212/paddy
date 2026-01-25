const router = require("express").Router();
const racesController = require("../controllers/races.controller");

router.post("/", racesController.insertRace);

module.exports = router;
