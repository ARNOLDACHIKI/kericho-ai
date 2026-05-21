const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: String,
    language: {
      type: String,
      enum: ["en", "sw"],
      default: "en",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: Date,
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
