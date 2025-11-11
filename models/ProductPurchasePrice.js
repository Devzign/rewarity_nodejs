const { Schema, model } = require('mongoose');

const ProductPurchasePriceSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model('ProductPurchasePrice', ProductPurchasePriceSchema);

