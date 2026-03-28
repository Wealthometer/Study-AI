const express = require("express");
const {
  register, login,
  getProfile, updateProfile, changePassword,
  clerkExchange
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Email / Password ───────────────────────────────────────────────────────────
router.post("/register",        register);
router.post("/login",           login);
router.get("/me",       protect, getProfile);
router.put("/profile",  protect, updateProfile);
router.put("/password", protect, changePassword);

// ── Clerk token → app JWT exchange (Google OAuth handled by Clerk) ─────────────
router.post("/clerk/exchange", clerkExchange);

module.exports = router;
