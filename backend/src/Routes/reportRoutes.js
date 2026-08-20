const express = require("express");
const reportController = require("../controllers/Client/reportController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.post("/", reportController.submitReport);

module.exports = router;
