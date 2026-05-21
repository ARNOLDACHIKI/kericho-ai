const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    userMessage: {
      type: String,
      required: true,
    },
    assistantResponse: {
      type: String,
      required: true,
    },
    category: String, // e.g., "malaria", "maternal_health", "nutrition"
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    aiModel: String, // e.g., "gpt-3.5-turbo", "gpt-4"
  },
  { timestamps: true }
);

chatSchema.index({ phoneNumber: 1, createdAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
