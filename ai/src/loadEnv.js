const path = require("node:path");
const fs = require("node:fs");

// Mirrors the backend's `dotenv.config({ path: src/config.env })` convention, but uses Node's
// built-in loader so this service keeps its single runtime dependency (mongodb).
//
// Must be required before anything reads process.env. Values already present in the real
// environment win, which is what lets a container or CI job override the file.
function loadEnv(file = path.join(__dirname, "config.env")) {
    if (!fs.existsSync(file)) return false;
    process.loadEnvFile(file);
    return true;
}

module.exports = { loadEnv };
