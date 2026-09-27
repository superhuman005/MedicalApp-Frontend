const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, PDF."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
