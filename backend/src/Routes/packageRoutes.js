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

module.exports = router;