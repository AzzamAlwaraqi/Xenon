const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const clientRoutes = require("./Routes/clientRoutes");
const dockerRoutes = require("./Routes/dockerRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/docker", dockerRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

module.exports = app;