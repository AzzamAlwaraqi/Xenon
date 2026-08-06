const express = require("express");
const { getbooking, getAllbooking, updatebooking, deletebooking } = require("../controllers/Client/bookingController");
const { getAllRequests } = require("../controllers/Vendor/vendorBookingController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

// router.post("/create-booking", createBooking);
router.get("/all-bookings", getAllbooking);
// router.get("/my-bookings", getMyBookings);
// router.get("/my-history", getUserHistory);
router.get("/booking/:id", getbooking);
router.put("/delete-booking/:id", deletebooking);
router.get('/vendor/booking-requests', protect, getAllRequests);
router.get('/vendor/booking-requests/:package_id', protect, getAllRequests);
//7  "/any thing, validater(authValidation),authValidatopm")
module.exports = router;