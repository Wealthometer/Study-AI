const express = require("express");
const cors    = require("cors");
const path    = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes     = require("./routes/authRoutes");
const academicRoutes = require("./routes/academicRoutes");
const materialRoutes = require("./routes/materialRoutes");
const aiRoutes       = require("./routes/aiRoutes");
const groupRoutes    = require("./routes/groupRoutes");

const app = express();

app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads"))
);

app.get("/", (req, res) =>
  res.json({ message: "StudyAI API v2.0 🚀", status: "running" })
);

app.use("/api/auth",      authRoutes);
app.use("/api",           academicRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/groups",    groupRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large. Max 50MB." });
  }
  res.status(500).json({ message: err.message || "Internal server error" });
});

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

module.exports = app;

