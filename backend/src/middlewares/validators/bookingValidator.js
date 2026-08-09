const { validate } = require("../validate");
const bookingValidation = require("../../validations/bookingValidation");

exports.createbooking = validate(bookingValidation.createBookingValidation);
exports.deletebooking = validate(bookingValidation.deleteBookingValidation);

// Dummy validators for routes that don't need body validation
exports.getAllbooking = (req, res, next) => next();
exports.getbooking = (req, res, next) => next();
