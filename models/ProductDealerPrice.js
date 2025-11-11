const { Schema, model } = require('mongoose');

const ProductDealerPriceSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    dealer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
ProductDealerPriceSchema.index({ product: 1, dealer: 1, effectiveFrom: -1 });

module.exports = model('ProductDealerPrice', ProductDealerPriceSchema);

