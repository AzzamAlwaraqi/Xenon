const express = require("express");
const { getbooking, getAllbookingMe, updatebooking, deletebooking, createbooking, getAllRequests, getMyBookings, getUserHistory } = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");
const bookingvalidator = require("../middlewares/validators/bookingValidator");
const router = express.Router();


router.post("/create-booking", protect, bookingvalidator.createbooking, createbooking);
router.get("/all-bookings", protect, bookingvalidator.getAllbooking, getAllbookingMe);
router.get("/my-bookings", protect, bookingvalidator.getAllbooking, getMyBookings); // Not yet implemented
router.get("/my-history", protect, bookingvalidator.getAllbooking, getUserHistory); // Not yet implemented
router.get("/get-booking/:id", protect, bookingvalidator.getbooking, getbooking);
router.put("/delete-booking/:id", protect, bookingvalidator.deletebooking, deletebooking);
router.get('/vendor/booking-requests', protect, bookingvalidator.getAllbooking, getAllRequests);

module.exports = router;