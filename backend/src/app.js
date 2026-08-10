const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const authRoutes = require("./Routes/authRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const bookingRoutes = require("./Routes/bookingRoutes");
const packageRoutes = require("./Routes/packageRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const aiRoutes = require("./Routes/aiRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/packages", packageRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler.Error);

module.exports = app;