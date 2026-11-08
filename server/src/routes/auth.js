import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { verifyRegistrationNumber } from '../services/urRegistry.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, requireFields } from '../utils/errors.js';

const router = express.Router();

const handshakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again in 15 minutes.' },
});

router.post(
  '/verify',
  handshakeLimiter,
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['registrationNumber']);
    const student = await verifyRegistrationNumber(req.body.registrationNumber);

    if (req.body.password !== undefined && req.body.password !== null && String(req.body.password).trim() !== '') {
      const ok = student.verifyPassword ? student.verifyPassword(req.body.password) : false;
      if (!ok) {
        throw new ApiError(401, 'Invalid PIN or password.');
      }
    } else if (!student.verifyPassword) {
      // keep compatibility
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

export default router;