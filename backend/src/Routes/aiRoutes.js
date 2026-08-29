const express = require("express");
const aiAdvisorController = require("../controllers/Client/aiAdvisorController");
const authMiddleware = require("../middlewares/authMiddleware");
const { aiRateLimiter, aiRequestId, requireAiUser, aiErrorHandler } = require("../middlewares/aiMiddleware");
const { validateAiAdvice } = require("../validations/aiValidation");

// The AI advisor is a standalone service reached only through this router. Everything it needs is
// attached here, so no AI-specific middleware or limits run for the rest of the API.
const router = express.Router();

router.use(authMiddleware.protect);
router.use(requireAiUser);

// Note: Accessible by user
router.post("/chat", aiRateLimiter, aiRequestId, validateAiAdvice, aiAdvisorController.getAiAdvice);

router.use(aiErrorHandler);

module.exports = router;
