const { Schema, model } = require('mongoose');

const RewardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pointsRequired: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Reward', RewardSchema);

