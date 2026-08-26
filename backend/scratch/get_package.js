const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, '../src/config.env') });

const mongoose = require("mongoose");
const connectDB = require("../src/config/dbConfig");
const PackageModel = require("../src/Models/PackageModel");

async function run() {
    await connectDB();
    const pkg = await PackageModel.findOne({ isDeleted: false, package_status: 'active' });
    if (pkg) {
        console.log("Found Package Name:", pkg.package_name);
        console.log("Found Vendor ID:", pkg.vendor_id);
    } else {
        console.log("No active packages found");
    }
    process.exit(0);
}
run();
