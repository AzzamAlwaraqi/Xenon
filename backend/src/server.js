const dotenv = require("dotenv");
const path = require("path");
// ⚠️ dotenv MUST be configured before any other module is required,
//    so that process.env is fully populated when services initialize.
dotenv.config({ path: path.join(__dirname, 'config.env') });

const app = require("./app");
const connectDB = require("./config/dbConfig");
const { verifyConnection: verifySmtp } = require("./services/Integration/emailService");

const PORT = process.env.PORT || 3000;

async function startServer() {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Verify SMTP on startup — non-fatal, but logs a clear diagnostic
    await verifySmtp();

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    // 4. Graceful shutdown
    const shutdown = (signal) => {
        console.log(`\n${signal} received — shutting down gracefully…`);
        server.close(() => {
            console.log('✅ HTTP server closed.');
            process.exit(0);
        });
        // Force-exit if server hasn't closed within 10s
        setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
}

startServer();
