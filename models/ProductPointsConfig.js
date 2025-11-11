const { Schema, model } = require('mongoose');

const ProductPointsConfigSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    pointsPerUnit: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('ProductPointsConfig', ProductPointsConfigSchema);

