const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");
const bookingValidation = require("../validations/bookingValidation");
const router = express.Router();

// Note: Accessible by user, vendor, admin
router.post("/create-booking", protect, bookingValidation.createBookingValidation, bookingController.createbooking);

// Note: Accessible by user, vendor, admin
router.get("/all-bookings", protect, bookingController.getAllbookingMe);
// Note: Accessible by user, vendor, admin
router.get("/my-bookings", protect, bookingController.getMyBookings);
// Note: Accessible by user, vendor, admin
router.get("/my-history", protect, bookingController.getUserHistory);
// Note: Accessible by user, vendor, admin
router.get("/get-booking/:id", protect, bookingValidation.bookingIdParamValidation, bookingController.getbooking);

// Note: Accessible by user, vendor, admin
router.put("/update-booking/:id", protect, bookingValidation.bookingIdParamValidation, bookingValidation.updateBookingValidation, bookingController.updatebooking);
// Note: Accessible by vendor, admin
router.patch("/update-status/:id", protect, bookingValidation.bookingIdParamValidation, bookingValidation.updateBookingStatusValidation, bookingController.updateBookingStatus);
// Note: Accessible by user, vendor, admin
router.put("/delete-booking/:id", protect, bookingValidation.bookingIdParamValidation, bookingController.deletebooking);

// Note: Accessible by vendor, admin
router.get('/vendor/booking-requests/:package_id', protect, bookingValidation.getAllRequestsQueryValidation, bookingController.getAllRequests);

// Note: Accessible by user only
router.get('/user/pending-requests', protect, bookingController.getUserPendingRequests);
// Note: Accessible by vendor, admin
router.get('/vendor/pending-requests-count', protect, bookingController.getPendingRequestsCount);

module.exports = router;