const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");
const bookingValidation = require("../validations/bookingValidation");
const router = express.Router();

router.post("/create-booking", protect, bookingValidation.createBookingValidation, bookingController.createbooking);

router.get("/all-bookings", protect, bookingController.getAllbookingMe);
router.get("/my-bookings", protect, bookingController.getMyBookings);
router.get("/my-history", protect, bookingController.getUserHistory);
router.get("/get-booking/:id", protect, bookingValidation.bookingIdParamValidation, bookingController.getbooking);

router.put("/update-booking/:id", protect, bookingValidation.bookingIdParamValidation, bookingValidation.updateBookingValidation, bookingController.updatebooking);
router.patch("/update-status/:id", protect, bookingValidation.bookingIdParamValidation, bookingValidation.updateBookingStatusValidation, bookingController.updateBookingStatus);
router.put("/delete-booking/:id", protect, bookingValidation.bookingIdParamValidation, bookingController.deletebooking);

router.get('/vendor/booking-requests', protect, bookingValidation.getAllRequestsQueryValidation, bookingController.getAllRequests);

router.get('/user/pending-requests', protect, bookingController.getUserPendingRequests);
router.get('/vendor/pending-requests-count', protect, bookingController.getPendingRequestsCount);

module.exports = router;