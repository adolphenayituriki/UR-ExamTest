import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { getCourseHistory, getDiagnostics, getOverview } from '../services/analyticsService.js';

const router = express.Router();
router.use(authenticate);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const data = await getOverview(req.student._id);
    res.json(data);
  })
);

router.get(
  '/diagnostics',
  asyncHandler(async (req, res) => {
    const data = await getDiagnostics(req.student._id);
    res.json(data);
  })
);

router.get(
  '/courses/:courseId/history',
  asyncHandler(async (req, res) => {
    const history = await getCourseHistory(req.student._id, req.params.courseId);
    res.json({ history });
  })
);

export default router;
