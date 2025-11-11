const { Schema, model } = require('mongoose');

const CountrySchema = new Schema(
  {
    countryName: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Country', CountrySchema);

