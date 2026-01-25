const router = require("express").Router();
const resultsController = require("../controllers/results.controller");

router.post("/", resultsController.insertResults);

module.exports = router;
