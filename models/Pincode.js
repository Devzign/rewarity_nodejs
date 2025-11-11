const { Schema, model } = require('mongoose');

const PincodeSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, index: true },
    city: { type: Schema.Types.ObjectId, ref: 'City' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Pincode', PincodeSchema);

