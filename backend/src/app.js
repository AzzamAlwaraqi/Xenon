const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const authRoutes = require("./Routes/authRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const bookingRoutes = require("./Routes/bookingRoutes");
const packageRoutes = require("./Routes/packageRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const aiRoutes = require("./Routes/aiRoutes");
const complaintRoutes = require("./Routes/complaintRouter");
const reviewRoutes = require("./Routes/reviewRouter");
const notificationRoutes = require("./Routes/notificationRoutes");
const reportRoutes = require("./Routes/reportRoutes");
const analysisRoutes = require("./Routes/analysisRouter");
const paymentRoutes = require("./Routes/PaymentRouter");
const adminAuth = require("./adminAuth");
const { registerAdminValidator } = require("./adminValidation");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(morgan("dev"));

// Unified Response Pattern (res.AppError)
app.use((req, res, next) => {
    res.AppError = (message, statusCode = 500) => {
        return res.status(statusCode).json({
            status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
            message: message
        });
    };
    next();
});



// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/staff", require("./Routes/staffRoutes"))
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/packages", packageRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/analytics", analysisRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.post("/api/v1/admin/auth/register", registerAdminValidator, adminAuth.registerAdmin);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler.Error);

module.exports = app;