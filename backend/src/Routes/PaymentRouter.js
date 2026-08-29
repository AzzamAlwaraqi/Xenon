const express = require("express");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const paymentController = require("../controllers/paymentController");
const {
    addBookingPaymentValidation,
    updateBookingPaymentValidation,
    addSubscriptionValidation,
    updateSubscriptionValidation,
    paramIdValidation,
    phoneValidation
} = require("../validations/paymentValidation");
const AppError = require("../utils/AppError");

const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new AppError('Not an image or PDF! Please upload only images or PDFs.', 400), false);
        }
    }
});
// ==========================================
// 💸 Booking Payments
// ==========================================

// Note: Accessible by vendor
// Request Body:
// {
//     "booking_id": "UUID (required)",
//     "amount": number (required),
//     "payment_method": "CliQ" | "Cash" | "ManualBankTransfer" | "OnlineGateway" (required),
//     "customer_phone": "10-digit phone number (required)",
//     "payment_description": "Description (required)",
//     "receipt_image_url": "URI (optional)",
//     "transaction_id": "string (optional)",
//     "payment_metadata": {} (optional)
// }
router.post("/booking", protect, restrictTo("vendor"), upload.single("receipt"), addBookingPaymentValidation, paymentController.addBookingPayment);

// Note: Accessible by user, vendor, admin
// Query Parameters (optional):
// ?booking_id=UUID&payment_status=Verified&payment_method=CliQ
router.get("/booking", protect, restrictTo("user", "vendor", "admin"), paymentController.getBookingPayments);

// Note: Accessible by vendor
// Route Parameters: id (UUID)
// Request Body (at least one field required):
// {
//     "amount": number (optional),
//     "payment_method": "CliQ" | "Cash" | "ManualBankTransfer" | "OnlineGateway" (optional),
//     "payment_description": "string (optional)",
//     "receipt_image_url": "URI (optional)",
//     "transaction_id": "string (optional)",
//     "payment_metadata": {} (optional)
// }
router.put("/booking/:id", protect, restrictTo("vendor"), paramIdValidation, upload.single("receipt"), updateBookingPaymentValidation, paymentController.updateBookingPayment);

// Note: Accessible by vendor
// Route Parameters: id (UUID)
router.patch("/booking/:id/delete", protect, restrictTo("vendor"), paramIdValidation, paymentController.cancelBookingPayment);

// ==========================================
// 🎫 Vendor Subscriptions
// ==========================================

// Note: Accessible by admin
// Request Body:
// {
//     "vendor_id": "UUID (required)",
//     "amount": number (required),
//     "payment_method": "CliQ" | "ManualBankTransfer" | "OnlineGateway" (required),
//     "payment_description": "Description (required)",
//     "receipt_image_url": "URI (optional)",
//     "transaction_id": "string (optional)"
// }
router.post("/subscription", protect, restrictTo("admin"), upload.single("receipt"), addSubscriptionValidation, paymentController.addVendorSubscriptionPayment);

// Note: Accessible by admin, vendor
// Query Parameters (optional):
// ?vendor_id=UUID&payment_status=Verified&subscription_status=Active
router.get("/subscription", protect, restrictTo("admin", "vendor"), paymentController.getVendorSubscriptionPayments);

// Note: Accessible by admin
// Route Parameters: id (UUID)
// Request Body (at least one field required):
// {
//     "amount": number (optional),
//     "payment_method": "CliQ" | "ManualBankTransfer" | "OnlineGateway" (optional),
//     "payment_description": "string (optional)",
//     "receipt_image_url": "URI (optional)",
//     "transaction_id": "string (optional)"
// }
router.put("/subscription/:id", protect, restrictTo("admin"), paramIdValidation, upload.single("receipt"), updateSubscriptionValidation, paymentController.updateVendorSubscriptionPayment);

// Note: Accessible by admin
// Route Parameters: id (UUID)
router.patch("/subscription/:id/delete", protect, restrictTo("admin"), paramIdValidation, paymentController.cancelVendorSubscriptionPayment);

// ==========================================
// 📊 Financial Statements
// ==========================================

// Note: Accessible by vendor
// Route Parameters: phone (10-digit customer phone number)
router.get("/statement/customer/:phone", protect, restrictTo("vendor"), phoneValidation, paymentController.getCustomerFinancialStatement);

// Note: Accessible by admin, vendor
// Query Parameters (optional for admin, forced/automatic for vendor):
// ?vendor_id=UUID (forced if admin to specify vendor)
router.get("/statement/vendor", protect, restrictTo("admin", "vendor"), paymentController.getVendorFinancialStatement);

module.exports = router;