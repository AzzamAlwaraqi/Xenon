const cron = require('node-cron');
const mongoose = require('mongoose');
const BookingModel = require('../Models/BookingModel');
const PackageModel = require('../Models/PackageModel');

// مهمة مجدولة تعمل كل 15 دقيقة
cron.schedule('*/15 * * * *', async () => {
    try {
        console.log('[CRON] Checking for expired pending_payment bookings...');
        const expiredBookings = await BookingModel.find({
            status: 'pending_payment',
            payment_deadline: { $lt: new Date() },
            isDeleted: false
        });

        if (expiredBookings.length === 0) {
            console.log('[CRON] No expired bookings found.');
            return;
        }

        console.log(`[CRON] Found ${expiredBookings.length} expired bookings. Cancelling them...`);

        for (const booking of expiredBookings) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // إضافة الحالة الجديدة للسجل
                booking.status = 'cancelled';
                booking.status_history.push({
                    status: 'cancelled',
                    changed_by: null, // تم الإلغاء بواسطة النظام (System)
                    changed_at: Date.now(),
                    note: 'Auto-cancelled due to payment deadline expiration'
                });
                
                await booking.save({ session });

                // إرجاع المقاعد للباقة
                await PackageModel.findByIdAndUpdate(
                    booking.package_id,
                    { $inc: { available_seats: booking.number_of_people } },
                    { session }
                );

                await session.commitTransaction();
                console.log(`[CRON] Successfully auto-cancelled booking ${booking._id}`);
            } catch (err) {
                await session.abortTransaction();
                console.error(`[CRON] Failed to auto-cancel booking ${booking._id}:`, err);
            } finally {
                session.endSession();
            }
        }
    } catch (error) {
        console.error('[CRON] Error checking expired bookings:', error);
    }
});
