const app = require("./app");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConfig");
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
connectDB();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});


