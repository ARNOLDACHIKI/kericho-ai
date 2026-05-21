const mongoose = require("mongoose");

const healthContentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    keywords: [String],
    content: {
      type: String,
      required: true,
    },
    contentSwahili: String,
    disclaimer: String,
    sources: [String],
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthContent", healthContentSchema);
