require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const initSockets = require("./sockets");
const bootstrapAdmins = require("./utils/bootstrapAdmins");

// Render (and other PaaS providers) injects PORT at runtime - always defer to it.
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initSockets(io);

// Make io accessible inside Express controllers via req.app.get("io")
app.set("io", io);

const start = async () => {
  await connectDB();
  try {
    await bootstrapAdmins();
  } catch (err) {
    // Don't stop the API from starting if the bootstrap fails - just make it loud
    console.error("[bootstrap] Failed to set up admin accounts:", err.message);
  }
  // Binding without an explicit host listens on all interfaces (0.0.0.0), which is
  // required for Render (and most containerized platforms) to route traffic in.
  server.listen(PORT, () => {
    console.log(`TeleMed API listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
};

start();

// ---- Graceful shutdown ----
// Render sends SIGTERM before stopping/replacing an instance on every deploy or
// scale event. Handling it lets in-flight requests finish and closes the DB
// connection cleanly instead of the process being hard-killed.
const shutdown = (signal) => {
  console.log(`${signal} received: closing server gracefully...`);
  server.close(async () => {
    console.log("HTTP server closed");
    try {
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err.message);
    } finally {
      process.exit(0);
    }
  });

  // Force-exit if something hangs and refuses to close in time
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
