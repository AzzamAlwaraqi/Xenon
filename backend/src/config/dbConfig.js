const mongoose = require("mongoose");

const connectDB = async () => {
    // If DATABASE contains a <PASSWORD> placeholder (Atlas URI), replace it.
    // Otherwise use the URI as-is (e.g. local: mongodb://localhost:27017/Xenon)
    const DB = process.env.DATABASE.includes('<PASSWORD>')
        ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
        : process.env.DATABASE;

    await mongoose.connect(DB);
    console.log(`✅ DB connected → ${DB.split('@').pop() || DB}`);
};

module.exports = connectDB;