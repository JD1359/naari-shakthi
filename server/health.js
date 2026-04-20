/**
 * routes/health.js — Health Analytics Routes
 * Proxies requests to the Python ML service for predictions.
 *
 * POST /api/health/analyze    — Submit symptoms, get ML recommendation
 * GET  /api/health/history    — Get patient's past health submissions
 */

const express = require("express");
const axios   = require("axios");
const { body, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole    = require("../middleware/roleMiddleware");

const router   = express.Router();
const ML_URL   = process.env.ML_SERVICE_URL || "http://localhost:5001";

// In-memory log (replace with HealthLog MongoDB model in production)
const healthLogs = [];

// ── POST /api/health/analyze ──────────────────────────────────────────────────
router.post(
  "/analyze",
  authMiddleware,
  [
    body("age").isInt({ min: 1, max: 120 }),
    body("symptoms").isArray({ min: 1 }).withMessage("Provide at least one symptom"),
    body("bloodPressure").optional().isString(),
    body("heartRate").optional().isInt({ min: 30, max: 220 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const payload = { ...req.body, userId: req.user.id };

      // Forward to Python ML service
      const mlResponse = await axios.post(`${ML_URL}/predict`, payload, {
        timeout: 10000,
      });

      const result = mlResponse.data;

      // Log the submission
      healthLogs.push({
        userId:          req.user.id,
        input:           req.body,
        recommendation:  result,
        timestamp:       new Date(),
      });

      res.json({
        success: true,
        recommendation: result.recommendation,
        riskScore:      result.risk_score,
        medicines:      result.suggested_medicines,
        advice:         result.advice,
      });
    } catch (err) {
      if (err.code === "ECONNREFUSED") {
        return res.status(503).json({ error: "ML service unavailable. Try again shortly." });
      }
      res.status(500).json({ error: "Health analysis failed", detail: err.message });
    }
  }
);

// ── GET /api/health/history ───────────────────────────────────────────────────
router.get("/history", authMiddleware, (req, res) => {
  const userLogs = healthLogs
    .filter(log => log.userId === req.user.id)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20); // Last 20 entries

  res.json({ count: userLogs.length, history: userLogs });
});

// ── GET /api/health/all — Admin: see all submissions ─────────────────────────
router.get(
  "/all",
  authMiddleware,
  requireRole("admin"),
  (req, res) => {
    res.json({ count: healthLogs.length, logs: healthLogs });
  }
);

module.exports = router;
