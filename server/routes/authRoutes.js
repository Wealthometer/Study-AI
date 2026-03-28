const express = require("express");
const {
  register, login,
  getProfile, updateProfile, changePassword,
  clerkExchange
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register",        register);
router.post("/login",           login);
router.get("/me",       protect, getProfile);
router.put("/profile",  protect, updateProfile);
router.put("/password", protect, changePassword);

router.post("/clerk/exchange", clerkExchange);

module.exports = router;

