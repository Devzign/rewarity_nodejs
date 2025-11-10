const { Schema, model } = require('mongoose');

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Category', CategorySchema);

