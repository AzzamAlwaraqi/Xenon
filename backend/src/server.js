const app = require("./app");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("connected",()=>{
    console.log("Connected to MongoDB")
})

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
});


