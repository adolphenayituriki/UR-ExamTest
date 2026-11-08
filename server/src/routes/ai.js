import express from 'express';
import { ExamSession } from '../models/ExamSession.js';
import { Assessment } from '../models/Assessment.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { generateHint, llmEnabled } from '../services/aiService.js';
import { env } from '../config/env.js';

const router = express.Router();
router.use(authenticate);

const MAX_HINTS_PER_SESSION = 12;

router.get('/status', (_req, res) => {
  res.json({
    engine: llmEnabled ? 'llm' : 'local-heuristics',
    model: llmEnabled ? env.aiModel : 'Socratic rule engine',
    features: [
      'Socratic hints',
      'Weakness diagnostics',
      'Dynamic question mutation',
      'Automated essay evaluation',
    ],
  });
});

router.post(
  '/hint',
  asyncHandler(async (req, res) => {
    const { sessionId, instanceId } = req.body || {};
    if (!sessionId || !instanceId) {
      throw new ApiError(400, 'sessionId and instanceId are required.');
    }

    const session = await ExamSession.findOne({
      _id: sessionId,
      student: req.student._id,
    });
    if (!session) throw new ApiError(404, 'Exam session not found.');
    if (session.status !== 'in_progress') {
      throw new ApiError(409, 'Hints are unavailable after the session is submitted.');
    }

    const assessment = await Assessment.findById(session.assessment).lean();
    const hintsAllowed = session.mode === 'practice' || assessment?.hintsAllowed;
    if (!hintsAllowed) {
      throw new ApiError(403, 'Hints are disabled during mock examinations and final simulations.');
    }
    if (session.hintsUsed >= MAX_HINTS_PER_SESSION) {
      throw new ApiError(429, 'Hint limit reached for this session. Keep working through the method.');
    }

    const question = session.questions.find((entry) => entry.instanceId === instanceId);
    if (!question) throw new ApiError(404, 'Question does not belong to this session.');

    const answer = session.answers.find((entry) => entry.instanceId === instanceId)?.value || '';
    const hintLevel = Math.min(2, Math.max(0, Number(req.body.hintLevel) || 0));

    const { hint, source } = await generateHint({
      question: {
        type: question.type,
        prompt: question.prompt,
        topic: question.topic,
        topicTitle: question.topicTitle,
      },
      studentValue: answer,
      hintLevel,
    });

    session.hintsUsed += 1;
    await session.save();

    res.json({
      hint,
      source,
      hintLevel,
      hintsUsed: session.hintsUsed,
      hintsRemaining: Math.max(0, MAX_HINTS_PER_SESSION - session.hintsUsed),
    });
  })
);

export default router;
