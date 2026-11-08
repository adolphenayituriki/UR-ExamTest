import express from 'express';
import { Student } from '../models/Student.js';
import { Credential } from '../models/Credential.js';
import { computeEligibility, issueCredential, verifyCredential } from '../services/credentialService.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = express.Router();
router.use(authenticate);

router.get(
  '/eligibility',
  asyncHandler(async (req, res) => {
    const academicYear = req.query.academicYear || req.student.academicYear;
    const eligibility = await computeEligibility(req.student, academicYear);
    res.json(eligibility);
  })
);

router.post(
  '/issue',
  asyncHandler(async (req, res) => {
    const academicYear = req.body.academicYear || req.student.academicYear;
    const credential = await issueCredential(req.student, academicYear);
    res.status(201).json({ credential, message: 'Annual exam-readiness credential issued.' });
  })
);

router.get(
  '/verify/:code',
  asyncHandler(async (req, res) => {
    const result = await verifyCredential(req.params.code);
    res.json(result);
  })
);

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const credentials = await Credential.find({
      student: req.student._id,
      status: 'issued',
    })
      .sort({ issuedAt: -1 })
      .lean();
    res.json({
      credentials: credentials.map((credential) => ({
        id: credential._id,
        code: credential.code,
        title: credential.title,
        description: credential.description,
        criteria: credential.criteria,
        level: credential.level,
        academicYear: credential.academicYear,
        status: credential.status,
        issuedAt: credential.issuedAt,
        expiresAt: credential.expiresAt,
        issuer: credential.issuer,
        evidence: credential.evidence,
      })),
    });
  })
);

export default router;
