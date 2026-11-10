import express from 'express';
import { LiteracyLesson } from '../models/LiteracyLesson.js';
import { LiteracyProgress } from '../models/LiteracyProgress.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const lessons = await LiteracyLesson.find({ published: true })
      .sort({ track: 1, order: 1 })
      .lean();
    res.json({ lessons });
  })
);

router.get(
  '/progress',
  asyncHandler(async (req, res) => {
    const entries = await LiteracyProgress.find({ student: req.student._id }).lean();
    const progress = Object.fromEntries(
      entries.map((entry) => [String(entry.lesson), entry])
    );
    res.json({ progress });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const lesson = await LiteracyLesson.findOne({ slug: req.params.slug }).lean();
    if (!lesson) throw new ApiError(404, 'Literacy lesson not found.');
    res.json({ lesson });
  })
);

router.post(
  '/:slug/progress',
  asyncHandler(async (req, res) => {
    const lesson = await LiteracyLesson.findOne({ slug: req.params.slug });
    if (!lesson) throw new ApiError(404, 'Literacy lesson not found.');

    const { completed, quizScore } = req.body || {};
    const progress = await LiteracyProgress.findOneAndUpdate(
      { student: req.student._id, lesson: lesson._id },
      {
        $set: {
          completed: completed === true,
          quizScore: quizScore != null ? Number(quizScore) : 0,
          quizTotal: (lesson.quiz || []).length,
          lastViewedAt: new Date(),
          ...(completed === true ? { completedAt: new Date() } : {}),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ progress });
  })
);

export default router;
