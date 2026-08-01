const express = require("express");
const { createClient } = require("../controllers/Client/clientAuthController");
const clientProfileController = require("../controllers/Client/clientProfileController");
const router = express.Router();

router.post("/create-client", createClient);
router.get("/profile", clientProfileController.getprofile);
router.put("/update-profile", clientProfileController.updateprofile);
router.put("/change-password", clientProfileController.changePassword);
router.put("/delete-profile", clientProfileController.deleteprofile);
router.get("/my-reviews", clientProfileController.getMyReviews);
//6




module.exports = router;