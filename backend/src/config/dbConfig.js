const mongoose = require("mongoose");


const connectDB = async () => {

    const DB = process.env.DATABASE.replace(
        '<PASSWORD>',
        process.env.DATABASE_PASSWORD
    );

    mongoose
        .connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        .then(() => console.log('DB connection successful!'));


}
module.exports= connectDB;
