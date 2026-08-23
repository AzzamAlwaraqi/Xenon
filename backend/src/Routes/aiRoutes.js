const express = require("express");
const aiAdvisorController = require("../controllers/Client/aiAdvisorController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware.protect);
// Note: Accessible by user
router.post("/chat", aiAdvisorController.getAiAdvice);

module.exports = router;
