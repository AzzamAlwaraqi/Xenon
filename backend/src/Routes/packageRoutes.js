const express = require("express");
const multer = require("multer");
const { 
    getAllPackages, 
    getPackage, 
    createPackage, 
    updatePackage, 
    deletePackage 
} = require("../controllers/Vendor/packageController");

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
router.get("/package/:id", getPackage);
router.post("/create-package", upload.single("package_image"), createPackage);
router.put("/package/:id", upload.single("package_image"), updatePackage);
router.put("/delete-package/:id", deletePackage);

module.exports = router;