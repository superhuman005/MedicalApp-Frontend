const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/telemed";

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
  mongoose.connection.on("error", (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });

  try {
    const conn = await mongoose.connect(uri, {
      // Fail fast instead of buffering/hanging if the cluster (e.g. Atlas) is unreachable -
      // useful for surfacing misconfigured env vars quickly on a fresh Render deploy.
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
