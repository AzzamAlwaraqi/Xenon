const app = require("./app");
const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/dbConfig");
const path = require("path");
dotenv.config({ path: path.join(__dirname, 'config.env') });

connectDB();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
