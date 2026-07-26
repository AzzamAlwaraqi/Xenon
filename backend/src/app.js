const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const clientRoutes = require("./Routes/clientRoutes");
const vendorRoutes = require("./Routes/vendorRoutes");
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

// Routes
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/packages", packageRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

module.exports = app;