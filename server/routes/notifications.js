/**
 * routes/notifications.js — SMS + Email Alert System
 * Sends alerts when inventory is low or maintenance is due.
 */

const express      = require("express");
const nodemailer   = require("nodemailer");
const twilio       = require("twilio");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole    = require("../middleware/roleMiddleware");

const router = express.Router();

// Twilio client (SMS)
const twilioClient = process.env.TWILIO_ACCOUNT_SID
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Nodemailer transporter (Email)
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send SMS ──────────────────────────────────────────────────────────────────
async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log("⚠️  Twilio not configured. SMS skipped.");
    return null;
  }
  return twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to,
  });
}

// ── Send Email ────────────────────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: `"Naari Shakthi System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ── Low Stock Alert (called from inventory routes) ────────────────────────────
async function triggerLowStockAlert(medicine) {
  const message = `⚠️ LOW STOCK ALERT: ${medicine.medicineName} has only ${medicine.quantity} ${medicine.unit} remaining (threshold: ${medicine.threshold}). Please restock.`;

  const alertEmail = process.env.ALERT_EMAIL || process.env.EMAIL_USER;
  const alertPhone = process.env.ALERT_PHONE;

  const tasks = [sendEmail(alertEmail, `Low Stock: ${medicine.medicineName}`, `<p>${message}</p>`)];
  if (alertPhone) tasks.push(sendSMS(alertPhone, message));

  try {
    await Promise.all(tasks);
    console.log(`📩 Low-stock alert sent for: ${medicine.medicineName}`);
  } catch (err) {
    console.error("❌ Alert send failed:", err.message);
  }
}

// ── Manual Alert Endpoint ──────────────────────────────────────────────────────
router.post(
  "/send",
  authMiddleware,
  requireRole("pharmacist", "admin"),
  async (req, res) => {
    const { type, message, phone, email } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required" });

    const tasks = [];
    if (email) tasks.push(sendEmail(email, `Naari Shakthi Alert: ${type}`, `<p>${message}</p>`));
    if (phone) tasks.push(sendSMS(phone, message));

    try {
      await Promise.all(tasks);
      res.json({ success: true, message: "Alert sent successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to send alert", detail: err.message });
    }
  }
);

module.exports = router;
module.exports.triggerLowStockAlert = triggerLowStockAlert;
