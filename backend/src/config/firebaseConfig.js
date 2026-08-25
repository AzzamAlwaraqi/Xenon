const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json"); 

try {
    admin.initializeApp({
        credential: admin.cert(serviceAccount)
    });
    console.log("[Firebase] Successfully initialized in config.");
} catch (error) {
    console.error("[Firebase] Initialization error:", error);
}

module.exports = admin;