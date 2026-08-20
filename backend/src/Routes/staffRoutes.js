const express = require("express");
const staffController = require("../controllers/staffController");
const staffValidation = require("../validations/staffValidation"); 
const { protect } = require("../middlewares/authMiddleware");

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: "error", message: "You do not have permission to perform this action" });
        }
        next();
    };
};

const router = express.Router();

router.post("/add", protect, restrictTo('vendor', 'admin'), staffValidation.createStaffValidation, staffController.addStaff);

router.get("/", protect, restrictTo('vendor', 'admin'), staffValidation.getAllStaffValidation, staffController.getAllStaff);

router.put("/update/:id", protect, restrictTo('vendor', 'admin'), staffValidation.updateStaffValidation, staffController.updateStaff);

router.put("/delete/:id", protect, restrictTo('vendor', 'admin'), staffValidation.staffIdParamValidation, staffController.deleteStaff);

router.get("/:id", protect, restrictTo('vendor', 'admin'), staffValidation.staffIdParamValidation, staffController.getStaff);

module.exports = router;