require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
connectDB();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/medical", require("./routes/medicalRoutes"));
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
//# sourceMappingURL=server.js.map