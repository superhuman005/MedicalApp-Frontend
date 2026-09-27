const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const familyMemberRoutes = require("./routes/familyMemberRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const consultationRequestRoutes = require("./routes/consultationRequestRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const earningsRoutes = require("./routes/earningsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiChatRoutes = require("./routes/aiChatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const doctorReportRoutes = require("./routes/doctorReportRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Render (and most PaaS providers) sit behind a reverse proxy. Trusting it lets
// express-rate-limit and req.ip/req.secure resolve the real client IP/protocol
// instead of the proxy's, and lets secure cookies work correctly over HTTPS.
app.set("trust proxy", 1);

// ---- Core middleware ----
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, health checks) which send no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
    // Stashes the raw body buffer alongside the parsed one so webhook handlers
    // (e.g. Paystack) can verify HMAC signatures, which requires the exact
    // original bytes rather than a re-serialized JSON.stringify(req.body).
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Basic rate limiting on the whole API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Static files (avatars, lab result uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---- Health checks ----
// Render's default health check (and most uptime monitors) hit "/" unless configured
// otherwise, so respond there too in addition to the more specific /api/health.
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "TeleMed API is running" });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TeleMed API is running",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", familyMemberRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/consultation-requests", consultationRequestRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/doctor-reports", doctorReportRoutes);
app.use("/api/admin", adminRoutes);

// ---- 404 + error handling ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
