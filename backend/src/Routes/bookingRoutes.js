const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/create-booking", protect, bookingController.createbooking);

router.get("/all-bookings", protect, bookingController.getAllbookingMe);
router.get("/my-bookings", protect, bookingController.getMyBookings);
router.get("/my-history", protect, bookingController.getUserHistory);
router.get("/get-booking/:id", protect, bookingController.getbooking);

router.put("/update-booking/:id", protect, bookingController.updatebooking);
router.patch("/update-status/:id", protect, bookingController.updateBookingStatus);
router.put("/delete-booking/:id", protect, bookingController.deletebooking);

router.get('/vendor/booking-requests', protect, bookingController.getAllRequests);

router.get('/user/pending-requests', protect, bookingController.getUserPendingRequests);
router.get('/vendor/pending-requests-count', protect, bookingController.getPendingRequestsCount);

module.exports = router;