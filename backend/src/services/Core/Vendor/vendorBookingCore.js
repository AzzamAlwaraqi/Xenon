const AppError = require("../../../utils/AppError");
const Booking = require("../../../Models/BookingModel");
exports.updateBookingCore = async function (vendor) {
    try {

    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.getBookingCore = async function (vendor) {
    try {
        // البحث عن كل الحجوزات المرتبطة بهذا البائع فقط
        // (يتم ربط الحجز بالبائع إما عبر الباقة package_id أو بمعرف البائع مباشرة حسب تصميم الـ Schema لديك)
        const bookings = await BookingModel.find({ vendor_id: vendorId })
            .populate('package_id', 'title price location') // جلب تفاصيل الباقة المرتبطة
            .populate('user_id', 'name email phone');      // جلب تفاصيل السائح (اختياري)

        return {
            status: "success",
            count: bookings.length,
            data: bookings
        };

    } 
    catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
}
exports.createBookingCore = async function (vendor) {
    try {
        const {booking_id,package_id,user_id,number_of_people,booking_date}=vendor;
        const booking=await Booking.findById(booking_id);
        if(!booking){
            throw AppError("Booking not found", 404);
        }
        const vendor = await Vendor.findById(booking.vendor_id);
        if(!vendor){
            throw AppError("Vendor not found", 404);
        }
        if(booking.vendor_id!=vendor.id){
            throw AppError("You are not authorized to update this booking", 403);
        }
        booking.number_of_people=number_of_people;
        await booking.save();
        return booking;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.deleteBookingCore = async function (vendor) {
    try {

    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.getAllRequestsCore = async function (vendor) {
    try {

    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
