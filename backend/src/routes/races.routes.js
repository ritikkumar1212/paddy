const router = require("express").Router();
const racesController = require("../controllers/races.controller");

router.post("/", racesController.insertRace);
router.get("/duplicates/:id", racesController.getDuplicates);

module.exports = router;
