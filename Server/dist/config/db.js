// src/config/db.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error("MongoDB URI not defined in environment variables");
}
const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB connected successfully");
    }
    catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        console.error("Check your cluster hostname, credentials, and network.");
        process.exit(1);
    }
};
module.exports = connectDB;
//# sourceMappingURL=db.js.map