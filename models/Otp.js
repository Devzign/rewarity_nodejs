const { Schema, model, Types } = require('mongoose');

const OtpSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User' },
    mobile: { type: String, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['register', 'login'], required: true },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('Otp', OtpSchema);

