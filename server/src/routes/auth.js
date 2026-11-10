import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { verifyRegistrationNumber } from '../services/urRegistry.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, asyncHandler, requireFields } from '../utils/errors.js';
import { Student } from '../models/Student.js';
import { requestOTP, verifyOTP } from '../services/otpService.js';

const router = express.Router();

const handshakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again in 15 minutes.' },
});

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Try again in 15 minutes.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again in 15 minutes.' },
});

router.post(
  '/verify',
  handshakeLimiter,
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['registrationNumber', 'password']);
    const student = await verifyRegistrationNumber(req.body.registrationNumber);

    const password = String(req.body.password);
    if (!student.verifyPassword || !student.verifyPassword(password)) {
      throw new ApiError(401, 'Invalid PIN or password.');
    }

    student.tokenVersion += 1;
    student.lastLoginAt = new Date();
    await student.save();

    const token = jwt.sign(
      {
        sub: String(student._id),
        reg: student.registrationNumber,
        v: student.tokenVersion,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    res.json({
      token,
      student: student.toProfile(),
      access: {
        mode: env.urRegistryApi ? 'institutional-api' : 'local-registry-mirror',
        singleSession: true,
        notice:
          'A registration number can only hold one active session. Signing in here locked any previous session.',
      },
    });
  })
);

router.post(
  '/staff/otp/request',
  otpRequestLimiter,
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['staffId']);
    const staffId = String(req.body.staffId).trim().toUpperCase();

    const staff = await Student.findOne({ registrationNumber: staffId, role: { $in: ['lecturer', 'admin'] } });
    if (!staff) {
      throw new ApiError(404, 'Staff member not found.');
    }
    if (!staff.email) {
      throw new ApiError(400, 'No email on file for this staff member. Contact IT to update your profile.');
    }
    if (staff.enrollmentStatus !== 'active') {
      throw new ApiError(403, 'Staff account is not active.');
    }

    await requestOTP(staffId, staff.email, staff.fullName, 'staff-login');

    res.json({ message: 'OTP sent to your registered email.', emailMasked: maskEmail(staff.email) });
  })
);

router.post(
  '/staff/otp/verify',
  otpVerifyLimiter,
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['staffId', 'code']);
    const staffId = String(req.body.staffId).trim().toUpperCase();
    const code = String(req.body.code).trim();

    const result = await verifyOTP(staffId, code, 'staff-login');
    if (!result.valid) {
      const messages = {
        expired: 'OTP has expired. Request a new one.',
        max_attempts: 'Too many failed attempts. Request a new OTP.',
        invalid: `Invalid code. ${result.attemptsRemaining ?? 0} attempts remaining.`,
      };
      throw new ApiError(401, messages[result.reason] || 'Verification failed.');
    }

    const staff = await Student.findOne({ registrationNumber: staffId, role: { $in: ['lecturer', 'admin'] } });
    if (!staff) {
      throw new ApiError(404, 'Staff member not found.');
    }

    staff.tokenVersion += 1;
    staff.lastLoginAt = new Date();
    await staff.save();

    const token = jwt.sign(
      {
        sub: String(staff._id),
        reg: staff.registrationNumber,
        v: staff.tokenVersion,
        role: staff.role,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    res.json({
      token,
      student: staff.toProfile(),
      access: {
        mode: 'staff',
        singleSession: true,
        notice: 'Staff session created. Previous sessions for this staff ID are now locked.',
      },
    });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ student: req.student.toProfile() });
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    req.student.tokenVersion += 1;
    await req.student.save();
    res.json({ message: 'Signed out. All active sessions for this registration number are now locked.' });
  })
);

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export default router;