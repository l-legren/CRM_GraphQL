const mongoose = require("mongoose");

require("dotenv").config({ path: "variables.env" });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log("DB connected");
    } catch (e) {
        console.log("Error connecting to DB", e);
        process.exit(1); // Stop APP
    }
};

module.exports = connectDB;
