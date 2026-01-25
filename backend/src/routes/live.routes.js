const router = require("express").Router();
const liveController = require("../controllers/live.controller");

router.get("/latest", liveController.getLatest);

module.exports = router;
