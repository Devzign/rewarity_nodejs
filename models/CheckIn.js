const { Schema, model } = require('mongoose');

const ProofSchema = new Schema(
  {
    data: { type: Buffer },
    mimeType: { type: String },
    size: { type: Number },
    capturedAt: { type: Date },
  },
  { _id: false }
);

const CheckInSchema = new Schema(
  {
    salesperson: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dealer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    remarks: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    proof: { type: ProofSchema },
  },
  { timestamps: true }
);

module.exports = model('CheckIn', CheckInSchema);

