const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true, sparse: true },
  primaryMobile: { type: String, required: true, index: true, unique: true, trim: true },
  userType: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType' },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  uniqueCode: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

