const express = require("express");
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const packageValidation = require("../validations/packageValidation");
const {  getAllPackages, getPackage, createPackage, updatePackage, deletePackage } = require("../controllers/Vendor/packageController");
const { cacheMiddleware } = require("../middlewares/cacheMiddleware");

const router = express.Router();

// Configure multer memory storage for handling file upload buffers
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // limit file size to 5MB
    }
});

// Note: Public
router.get("/", cacheMiddleware(300), getAllPackages);
// Note: Public
router.get("/package/:id", cacheMiddleware(300), packageValidation.packageIdParamValidation, getPackage);
// Note: Accessible by vendor, admin
router.post("/create-package", protect, upload.single("package_image"), packageValidation.validateCreatePackage, createPackage);
// Note: Accessible by vendor, admin
router.put("/package/:id", protect, upload.single("package_image"), packageValidation.packageIdParamValidation, packageValidation.validateUpdatePackage, updatePackage);
// Note: Accessible by vendor, admin
router.put("/delete-package/:id", protect, packageValidation.packageIdParamValidation, deletePackage);

// TODO: Remove this temporary route after fixing ownership
router.get("/fix-ownership", async (req, res) => {
    const Package = require("../Models/PackageModel");
    try {
        await Package.updateMany(
            {},
            { $set: { vendor_id: '01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5' } }
        );
        res.json({ message: "Ownership fixed! All old packages belong to your vendor account now." });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;