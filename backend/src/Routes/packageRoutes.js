const express = require("express");
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const packageValidation = require("../validations/packageValidation");
const {  getAllPackages, getPackage, createPackage, updatePackage, deletePackage } = require("../controllers/Vendor/packageController");

const router = express.Router();

// Configure multer memory storage for handling file upload buffers
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // limit file size to 5MB
    }
});

router.get("/", getAllPackages);
router.get("/package/:id", packageValidation.packageIdParamValidation, getPackage);
router.post("/create-package", protect, upload.single("package_image"), packageValidation.validateCreatePackage, createPackage);
router.put("/package/:id", protect, upload.single("package_image"), packageValidation.packageIdParamValidation, packageValidation.validateUpdatePackage, updatePackage);
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