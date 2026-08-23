const express = require("express");
const reportController = require("../controllers/Client/reportController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

// Note: Accessible by user
router.post("/", restrictTo("user"), reportController.submitReport);

module.exports = router;
