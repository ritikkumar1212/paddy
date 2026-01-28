const router = require("express").Router();
const { exportExcel } = require("../controllers/export.controller");

router.get("/excel", exportExcel);

module.exports = router;
