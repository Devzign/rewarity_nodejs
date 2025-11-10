const { Schema, model } = require('mongoose');

const ColorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, trim: true }, // e.g. #FFFFFF
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Color', ColorSchema);

