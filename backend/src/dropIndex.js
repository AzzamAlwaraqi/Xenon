const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, 'config.env') });
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(async () => {
    console.log("DB connected");
    try {
        await mongoose.connection.collection('sessions').dropIndex('session_id_1');
        console.log("Dropped session_id_1 index");
    } catch (err) {
        console.log("Error dropping index:", err.message);
    }
    mongoose.disconnect();
});
