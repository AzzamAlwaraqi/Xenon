require('dotenv').config({ path: './src/config.env' });
const connectDB = require('../src/config/dbConfig');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function applyDBValidationToAll() {
    await connectDB();
    const db = mongoose.connection.db;

    const modelsDir = path.join(__dirname, '../src/Models');
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        try {
            const Model = require(path.join(modelsDir, file));
            const collectionName = Model.collection.name;
            const schemaPaths = Model.schema.paths;
            
            let properties = {};
            
            // Dynamically build properties based on Mongoose schema paths
            for (const [key, pathObj] of Object.entries(schemaPaths)) {
                // Determine bsonType based on Mongoose type
                let bsonType;
                const typeName = pathObj.instance;
                
                if (typeName === 'String') bsonType = ["string", "null"];
                else if (typeName === 'Number') bsonType = ["number", "double", "int", "long", "null"];
                else if (typeName === 'Boolean') bsonType = ["bool", "null"];
                else if (typeName === 'Date') bsonType = ["date", "null"];
                else if (typeName === 'UUID' || typeName === 'Buffer') bsonType = ["binData", "null"];
                else if (typeName === 'ObjectID' || typeName === 'ObjectId') bsonType = ["objectId", "null"];
                else if (typeName === 'Array') bsonType = ["array", "null"];
                else if (typeName === 'Embedded') bsonType = ["object", "null"];
                else if (typeName === 'Mixed') bsonType = ["object", "array", "string", "number", "bool", "null"];
                else bsonType = ["object", "string", "number", "binData", "array", "bool", "date", "null"]; // Fallback
                
                properties[key] = { bsonType };
            }

            // Always allow standard fields just in case
            properties['_id'] = {};
            properties['__v'] = {};
            properties['createdAt'] = { bsonType: ["date", "null"] };
            properties['updatedAt'] = { bsonType: ["date", "null"] };
            
            const validator = {
                $jsonSchema: {
                    bsonType: "object",
                    // additionalProperties: false will block any field NOT listed in properties above
                    additionalProperties: false, 
                    properties: properties
                }
            };

            await db.command({
                collMod: collectionName,
                validator: validator,
                validationLevel: "strict",
                validationAction: "error"
            });
            console.log(`✅ Applied Data Layer Validation to collection: ${collectionName} (from ${file})`);
        } catch (err) {
            if (err.codeName === 'NamespaceNotFound') {
                console.log(`⚠️ Collection not found in DB (might be empty/not created yet): ${file}`);
            } else {
                console.error(`❌ Failed to apply DB validation to ${file}:`, err.message);
            }
        }
    }

    await mongoose.disconnect();
    console.log("Disconnected from DB");
}

applyDBValidationToAll();
