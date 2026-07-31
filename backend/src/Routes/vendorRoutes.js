const express = require("express");
const router = express.Router();
const vendorAccountController = require("../controllers/Vendor/vendorAccountController");
const vendorAuthController = require("../controllers/Vendor/vendorAuthController");
const packageController = require("../controllers/Vendor/packageController");

const { protect } = require("../middlewares/authMiddleware");

// Vendor Account routes
router.post("/create-vendor", vendorAccountController.createAccount);
router.post("/login", vendorAccountController.loginVendor);
router.post("/logout", protect, vendorAccountController.logoutVendor);

// Vendor Profile / Auth routes
router.get("/profile", protect, vendorAuthController.getVendor);
router.post("/reset-password", vendorAuthController.resetPasswordVendor);
router.put("/update-profile", protect, vendorAuthController.updateProfileVendor);
router.put("/change-password", protect, vendorAuthController.changePasswordVendor);
router.put("/delete-profile", protect, vendorAuthController.deleteProfileVendor);

// Packages routes (as defined originally)
//router.get("/get-packages", packageController.getAllPackages);

module.exports = router;