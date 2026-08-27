const express = require("express");
const profileController = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");
const validation = require("../validations/authValidation");
const router = express.Router();

const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB per file
});

// Note: Accessible by user, vendor, admin
router.get("/me", protect, profileController.getProfile);
// Note: Accessible by user, vendor, admin
router.put("/update", protect,validation.updateProfileValidation, profileController.updateProfile);
// Note: Accessible by user, vendor, admin
router.put("/change-password", protect, validation.changePasswordValidation, profileController.changePassword);
// Note: Accessible by user, vendor, admin
router.put("/delete", protect, validation.deleteAccountValidation, profileController.deleteProfile);
// Note: Accessible by user, vendor, admin
router.put("/fcm-token", protect, profileController.updateFCMToken);

// User requesting to become a vendor
router.post(
    "/vendor-request", 
    protect, 
    upload.fields([
        { name: 'commercial_register_image', maxCount: 1 },
        { name: 'vocational_license_image', maxCount: 1 },
        { name: 'tourism_license_image', maxCount: 1 },
        { name: 'owner_id_image', maxCount: 1 },
        { name: 'iban_letter_image', maxCount: 1 }
    ]),
    profileController.requestVendorOnboarding
);

module.exports = router;
