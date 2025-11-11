const { Schema, model } = require('mongoose');

const StateSchema = new Schema(
  {
    stateName: { type: String, required: true, trim: true },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('State', StateSchema);

