const express = require("express");
const { getbooking, getAllbooking, updatebooking, deletebooking } = require("../controllers/Client/bookingController");
const router = express.Router();

// router.post("/create-booking", createBooking);
router.get("/all-bookings", getAllbooking);
// router.get("/my-bookings", getMyBookings);
// router.get("/my-history", getUserHistory);
router.get("/booking/:id", getbooking);
router.put("/update-booking/:id", updatebooking);
router.put("/delete-booking/:id", deletebooking);
//7  "/any thing, validater(authValidation),authValidatopm")
module.exports = router;