/**
 * routes/auth.js — Authentication Routes
 * POST /api/auth/register  — Create new user
 * POST /api/auth/login     — Login and receive JWT
 * POST /api/auth/refresh   — Refresh access token
 */

const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const User            = require("../models/User");
const authMiddleware  = require("../middleware/authMiddleware");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role").isIn(["patient", "pharmacist", "admin"]).withMessage("Invalid role"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash, role });

      res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token hash on user document
      user.refreshToken = await bcrypt.hash(refreshToken, 8);
      await user.save();

      res.json({
        accessToken,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// ── Refresh Token ─────────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: "User not found" });

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: "Token expired or invalid" });
  }
});

// ── Get Current User ──────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash -refreshToken");
  res.json(user);
});

module.exports = router;
