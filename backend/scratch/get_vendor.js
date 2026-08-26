const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, '../src/config.env') });

const mongoose = require("mongoose");
const connectDB = require("../src/config/dbConfig");
const Vendor = require("../src/Models/VendorModel");

async function run() {
    await connectDB();
    const vendor = await Vendor.findOne();
    console.log("Found Vendor ID:", vendor ? vendor._id : "No vendors found");
    process.exit(0);
}
run();
