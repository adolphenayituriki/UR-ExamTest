import { OTP } from '../models/OTP.js';
import { sendOTPEmail } from './emailService.js';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 3;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOTP(identifier, email, name, type = 'staff-login') {
  await OTP.deleteMany({ identifier, type, consumed: false });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OTP.create({
    identifier,
    code,
    type,
    expiresAt,
  });

  await sendOTPEmail(email, code, name);

  return { success: true, expiresIn: OTP_TTL_MINUTES * 60 };
}

export async function verifyOTP(identifier, code, type = 'staff-login') {
  const otpDoc = await OTP.findOne({ identifier, type, consumed: false, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 });

  if (!otpDoc) {
    return { valid: false, reason: 'expired' };
  }

  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: 'max_attempts' };
  }

  otpDoc.attempts += 1;
  await otpDoc.save();

  if (otpDoc.code !== code) {
    return { valid: false, reason: 'invalid', attemptsRemaining: MAX_ATTEMPTS - otpDoc.attempts };
  }

  otpDoc.consumed = true;
  await otpDoc.save();

  return { valid: true };
}