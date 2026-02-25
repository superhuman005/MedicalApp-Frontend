// src/server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:8080", "https://medicalapp-frontend.vercel.app"],
  credentials: true
}));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/appointments", require("./src/routes/appointmentRoutes"));
app.use("/api/medical", require("./src/routes/medicalRoutes"));

// Port
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});