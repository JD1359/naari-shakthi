/**
 * routes/inventory.js — Medicine Inventory Routes
 *
 * GET    /api/inventory         — List all medicines (auth required)
 * POST   /api/inventory         — Add medicine (pharmacist/admin only)
 * PUT    /api/inventory/:id     — Update stock (pharmacist/admin only)
 * DELETE /api/inventory/:id     — Remove medicine (admin only)
 * GET    /api/inventory/low     — Get low-stock items
 */

const express  = require("express");
const { body, validationResult } = require("express-validator");

const Inventory      = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole    = require("../middleware/roleMiddleware");
const { triggerLowStockAlert } = require("./notifications");

const router = express.Router();

// All inventory routes require authentication
router.use(authMiddleware);

// ── GET all medicines ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (search) filter.medicineName = { $regex: search, $options: "i" };
    if (lowStock === "true") {
      // Use aggregation to compare quantity to threshold
      const items = await Inventory.find(filter).lean();
      return res.json(items.filter(i => i.quantity <= i.threshold));
    }

    const medicines = await Inventory.find(filter).sort({ medicineName: 1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// ── GET low-stock items ───────────────────────────────────────────────────────
router.get("/low", async (req, res) => {
  try {
    const all  = await Inventory.find({ isActive: true }).lean();
    const low  = all.filter(i => i.quantity <= i.threshold);
    res.json({ count: low.length, items: low });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch low-stock items" });
  }
});

// ── POST add medicine ─────────────────────────────────────────────────────────
router.post(
  "/",
  requireRole("pharmacist", "admin"),
  [
    body("medicineName").trim().notEmpty(),
    body("quantity").isInt({ min: 0 }),
    body("threshold").isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const medicine = await Inventory.create({
        ...req.body,
        lastRestockedAt: new Date(),
        lastRestockedBy: req.user.id,
      });
      res.status(201).json(medicine);
    } catch (err) {
      res.status(500).json({ error: "Failed to add medicine" });
    }
  }
);

// ── PUT update stock ──────────────────────────────────────────────────────────
router.put(
  "/:id",
  requireRole("pharmacist", "admin"),
  async (req, res) => {
    try {
      const { quantity, ...rest } = req.body;
      const update = { ...rest };

      if (quantity !== undefined) {
        update.quantity         = quantity;
        update.lastRestockedAt  = new Date();
        update.lastRestockedBy  = req.user.id;
      }

      const medicine = await Inventory.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true }
      );

      if (!medicine) return res.status(404).json({ error: "Medicine not found" });

      // Trigger low-stock alert if quantity dropped below threshold
      if (quantity !== undefined && medicine.quantity <= medicine.threshold) {
        await triggerLowStockAlert(medicine);
      }

      res.json(medicine);
    } catch (err) {
      res.status(500).json({ error: "Failed to update inventory" });
    }
  }
);

// ── DELETE (soft-delete) ──────────────────────────────────────────────────────
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const medicine = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ error: "Medicine not found" });
    res.json({ message: "Medicine removed from active inventory" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete medicine" });
  }
});

module.exports = router;
