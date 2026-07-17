const mongoose = require("mongoose");

const connectDB = async () => {
    // If DATABASE contains a <PASSWORD> placeholder (Atlas URI), replace it.
    // Otherwise use the URI as-is (e.g. docker local: mongodb://mongo:27017/Xenon)
    const DB = process.env.DATABASE.includes('<PASSWORD>')
        ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
        : process.env.DATABASE;

    mongoose
        .connect(DB)
        .then(() => console.log(`DB connection successful! → ${DB.split('@').pop() || DB}`))
        .catch((err) => console.error('DB connection error:', err));
}

module.exports = connectDB;