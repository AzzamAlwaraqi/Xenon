const express = require("express");
const morgan = require("morgan");
const clientRoutes = require("./Routes/clientRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/v1/clients", clientRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

module.exports = app;