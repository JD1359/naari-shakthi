/**
 * models/Inventory.js — Medicine Inventory Schema
 */

const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["tablet", "capsule", "syrup", "injection", "cream", "drops", "other"],
      default: "tablet",
    },
    quantity:    { type: Number, required: true, min: 0 },
    unit:        { type: String, default: "units" },          // units, ml, mg
    threshold:   { type: Number, required: true, default: 20 }, // Alert when below this
    expiryDate:  { type: Date },
    batchNumber: { type: String },
    supplier:    { type: String },
    pricePerUnit: { type: Number },
    location:    { type: String },  // Shelf/bin location in dispensary
    isActive:    { type: Boolean, default: true },

    // Track last restock
    lastRestockedAt: { type: Date },
    lastRestockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual: is stock critically low?
InventorySchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.threshold;
});

InventorySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Inventory", InventorySchema);
