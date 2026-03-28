const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { generateToken } = require("../config/jwt");
const { verifyClerkSessionToken, clerkClient } = require("../config/clerk");

async function register(req, res) {
  try {
    const { name, email, password, university, year_of_study, daily_study_hours, study_preference } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password, university, year_of_study, daily_study_hours, study_preference)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), hashed,
       university || null, year_of_study || null,
       daily_study_hours || 4, study_preference || "morning"]
    );

    const token = generateToken(result.insertId);
    const [rows] = await db.execute(
      `SELECT id, name, email, university, year_of_study, daily_study_hours,
              study_preference, avatar_url, xp_points, level, created_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: "Account created successfully!", token, user: rows[0] });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(401).json({
        message: "This account was created via social login. Please use the Google/Clerk button to log in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user.id);
    const { password: _pw, google_id: _gid, clerk_id: _cid, ...safeUser } = user;
    res.json({ message: "Login successful!", token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
}

async function clerkExchange(req, res) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Clerk session token." });
    }
    const sessionToken = header.split(" ")[1];

    const sessionClaims = await verifyClerkSessionToken(sessionToken);
    const clerkUserId   = sessionClaims.sub;

    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email     = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase();
    const nameParts = [clerkUser.firstName, clerkUser.lastName].filter(Boolean);
    const name      = nameParts.join(" ").trim() || clerkUser.username || "Clerk User";
    const avatar    = clerkUser.imageUrl || null;

    const [existing] = await db.execute(
      "SELECT * FROM users WHERE clerk_id = ? OR email = ?",
      [clerkUserId, email]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      await db.execute(
        "UPDATE users SET clerk_id = ?, avatar_url = COALESCE(?, avatar_url), name = COALESCE(?, name) WHERE id = ?",
        [clerkUserId, avatar, name, userId]
      );
    } else {
      const [result] = await db.execute(
        `INSERT INTO users (name, email, password, clerk_id, avatar_url)
         VALUES (?, ?, '', ?, ?)`,
        [name, email, clerkUserId, avatar]
      );
      userId = result.insertId;
    }

    const [safeRows] = await db.execute(
      `SELECT id, name, email, university, year_of_study, daily_study_hours,
              study_preference, avatar_url, xp_points, level, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const token = generateToken(userId);
    res.json({ message: "Login successful!", token, user: safeRows[0] });
  } catch (err) {
    console.error("Clerk exchange error:", err);
    res.status(401).json({ message: err.message || "Unable to verify Clerk session." });
  }
}

async function getProfile(req, res) {
  try {
    const [users] = await db.execute(
      `SELECT id, name, email, university, year_of_study, daily_study_hours,
              study_preference, avatar_url, xp_points, level,
              difficulty_level, composite_score, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: "User not found." });
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, university, year_of_study, daily_study_hours, study_preference } = req.body;
    await db.execute(
      `UPDATE users SET
         name              = COALESCE(?, name),
         university        = COALESCE(?, university),
         year_of_study     = COALESCE(?, year_of_study),
         daily_study_hours = COALESCE(?, daily_study_hours),
         study_preference  = COALESCE(?, study_preference)
       WHERE id = ?`,
      [name, university, year_of_study, daily_study_hours, study_preference, req.user.id]
    );
    const [updated] = await db.execute(
      "SELECT id, name, email, university, year_of_study, daily_study_hours, study_preference FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json({ message: "Profile updated.", user: updated[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Both passwords are required." });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const [users] = await db.execute("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (!users[0].password) {
      return res.status(400).json({ message: "Social login accounts don't have a password to change." });
    }

    const match = await bcrypt.compare(current_password, users[0].password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(new_password, 12);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { register, login, clerkExchange, getProfile, updateProfile, changePassword };

