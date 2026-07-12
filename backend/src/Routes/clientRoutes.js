const express = require("express");
const router = express.Router();

router.post("/create-client", createClient);
router.get("/profile", getprofile);
router.put("/profile", updateprofile);
router.put("/change-password", changePassword);
router.put("/delete-profile", deleteprofile);
router.get("/my-reviews", getMyReviews);
//6




module.exports = router;