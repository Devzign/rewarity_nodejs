const { Schema, model } = require('mongoose');

const CitySchema = new Schema(
  {
    cityName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('City', CitySchema);
