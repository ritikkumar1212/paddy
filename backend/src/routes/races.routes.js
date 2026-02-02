const router = require("express").Router();
const racesController = require("../controllers/races.controller");

router.post("/", racesController.insertRace);
router.get("/duplicates/:id", racesController.getDuplicates);
router.get("/upcoming", racesController.getUpcoming);
router.get("/:id", racesController.getRaceDetails);

module.exports = router;
