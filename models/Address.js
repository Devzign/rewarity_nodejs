const { Schema, model, Types } = require('mongoose');

const AddressSchema = new Schema(
  {
    address1: { type: String, trim: true },
    address2: { type: String, trim: true },
    city: { type: Types.ObjectId, ref: 'City' },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('Address', AddressSchema);

