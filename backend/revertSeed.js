require("dotenv").config({ path: "./src/config.env" });
const mongoose = require("mongoose");
const User = require("./src/Models/UserModel");
const Vendor = require("./src/Models/VendorModel");
const Package = require("./src/Models/PackageModel");

// Database Connection
const DB = process.env.DATABASE.includes('<PASSWORD>')
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
    : process.env.DATABASE;

const revertDB = async () => {
    try {
        await mongoose.connect(DB);
        console.log("✅ DB Connected Successfully for revert!");

        // Delete the exact items created by the seed script based on string patterns
        
        const packagesResult = await Package.deleteMany({
            package_name: { $regex: /Amazing Package/i }
        });
        console.log(`✅ Deleted ${packagesResult.deletedCount} Seeded Packages`);

        const vendorsResult = await Vendor.deleteMany({
            vendor_company: { $regex: /Tourism Company/i }
        });
        console.log(`✅ Deleted ${vendorsResult.deletedCount} Seeded Vendors`);

        const usersResult = await User.deleteMany({
            name: { $regex: /Vendor User/i }
        });
        console.log(`✅ Deleted ${usersResult.deletedCount} Seeded Vendor Users`);

        console.log("🎉 Revert completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Revert Error:", error);
        process.exit(1);
    }
};

revertDB();
