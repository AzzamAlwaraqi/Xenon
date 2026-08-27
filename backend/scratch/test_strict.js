require('dotenv').config({ path: './src/config.env' });
const connectDB = require('../src/config/dbConfig');
const mongoose = require('mongoose');
const Employee = require('../src/Models/EmployeeModels');
const { v7: uuidv7 } = require("uuid");

async function runTest() {
    await connectDB();

    console.log("-----------------------------------------");
    console.log("Testing strict: 'throw' on EmployeeModel");
    console.log("Attempting to insert a fake field...");

    try {
        const emp = new Employee({
            user_id: uuidv7(),
            workSystem: "full-time",
            salary: 5000,
            position: "Developer",
            job_active: true,
            // THIS FIELD DOES NOT EXIST IN SCHEMA
            hacked_field_that_does_not_exist: "Trying to bypass schema!"
        });

        await emp.save();
        console.log("❌ FAILED: The document was saved successfully (this should not happen).");
    } catch (err) {
        if (err.name === 'StrictModeError') {
            console.log(`✅ SUCCESS: Mongoose blocked the insertion!`);
            console.log(`Error Message: ${err.message}`);
        } else {
            console.log("❌ FAILED: Unexpected error occurred.");
            console.error(err);
        }
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from DB");
    }
}

runTest();
