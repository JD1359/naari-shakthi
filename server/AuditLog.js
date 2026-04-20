/**
 * models/AuditLog.js — System Event Audit Log Schema
 *
 * Records significant actions across the platform for
 * accountability and compliance review by administrators.
 *
 * Examples of logged events:
 *   - User login / logout
 *   - Inventory stock updated
 *   - Medicine added / removed
 *   - Alert sent
 *   - User enabled / disabled
 */

const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    // The action that was performed (e.g. "USER_LOGIN", "STOCK_UPDATED")
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Who performed the action (User ObjectId or "system")
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Which collection was affected
    targetModel: {
      type: String,
      enum: ["User", "Inventory", "Notification", "System", "HealthLog"],
      default: "System",
    },

    // The ObjectId of the affected document (if applicable)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Freeform key-value details (e.g. { oldQty: 10, newQty: 5 })
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // IP address of the requester (for security auditing)
    ipAddress: {
      type: String,
      default: null,
    },

    // HTTP method + path for API actions
    method: { type: String },
    path:   { type: String },

    // Outcome of the action
    status: {
      type: String,
      enum: ["success", "failure", "warning"],
      default: "success",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index for fast admin queries: latest events first, filterable by action/model
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetModel: 1, targetId: 1 });
AuditLogSchema.index({ performedBy: 1 });

/**
 * Static helper: log an event without needing to instantiate the model.
 *
 * Usage:
 *   await AuditLog.record({
 *     action:      "STOCK_UPDATED",
 *     performedBy: req.user.id,
 *     targetModel: "Inventory",
 *     targetId:    medicine._id,
 *     details:     { oldQty: 10, newQty: 50 },
 *     ipAddress:   req.ip,
 *   });
 */
AuditLogSchema.statics.record = async function (data) {
  try {
    await this.create(data);
  } catch (err) {
    // Audit failures should never crash the main request
    console.error("⚠️  AuditLog.record failed:", err.message);
  }
};

module.exports = mongoose.model("AuditLog", AuditLogSchema);
