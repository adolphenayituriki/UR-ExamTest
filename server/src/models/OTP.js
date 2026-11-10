import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, index: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['staff-login', 'password-reset'], default: 'staff-login' },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ identifier: 1, type: 1 });

export const OTP = mongoose.model('OTP', otpSchema);