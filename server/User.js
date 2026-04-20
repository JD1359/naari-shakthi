/**
 * models/User.js — MongoDB User Schema
 * Supports three roles: patient, pharmacist, admin
 */

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "pharmacist", "admin"],
      default: "patient",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    // Patient-specific fields
    dateOfBirth:   { type: Date },
    bloodGroup:    { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    allergies:     [{ type: String }],
    chronicConditions: [{ type: String }],

    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,  // createdAt, updatedAt
  }
);

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
