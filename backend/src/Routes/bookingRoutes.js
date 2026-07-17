const express = require("express");
const bookingController = require("../controllers/Client/bookingController");
const router = express.Router();

router.post("/create-booking", createBooking);
router.get("/all-bookings", getAllBookings);
router.get("/my-bookings", getMyBookings);
router.get("/my-history", getUserHistory);
router.get("/booking/:id", getBooking);
router.put("/update-booking/:id", updateBooking);
router.put("/delete-booking/:id", deleteBooking);
//7
module.exports = router;