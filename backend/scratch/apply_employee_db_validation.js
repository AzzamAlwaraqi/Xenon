require('dotenv').config({ path: './src/config.env' });
const connectDB = require('../src/config/dbConfig');
const mongoose = require('mongoose');

async function applyDBValidation() {
    await connectDB();
    const db = mongoose.connection.db;

    try {
        await db.command({
            collMod: "employees",
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    additionalProperties: false,
                    properties: {
                        _id: {},
                        user_id: { bsonType: "binData" }, // UUID is stored as binary
                        vendor_id: { bsonType: "binData" },
                        salary: { bsonType: ["number", "null"] },
                        workSystem: { enum: ["contract", "full-time", "freelance", "part-time"] },
                        hourOfWork: { bsonType: ["number", "null"] },
                        allowances: { bsonType: ["number", "null"] },
                        position: { bsonType: "string" },
                        job_active: { bsonType: "bool" },
                        createdAt: { bsonType: "date" },
                        updatedAt: { bsonType: "date" }
                    }
                }
            },
            validationLevel: "strict",
            validationAction: "error"
        });
        console.log("✅ Database-level JSON Schema Validation (Data Layer) successfully applied to 'employees' collection!");
    } catch (err) {
        console.error("❌ Error applying DB validation:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from DB");
    }
}

applyDBValidation();
