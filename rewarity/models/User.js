const mongoose = require('mongoose');

let bcrypt;
try {
  // Optional dependency: if unavailable, skip hashing
  bcrypt = require('bcryptjs');
} catch (_) {
  bcrypt = null;
}

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  userType: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType' },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  uniqueCode: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving (if bcrypt is present)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!bcrypt) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
