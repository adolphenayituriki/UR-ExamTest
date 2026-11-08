import express from 'express';
import { Assessment } from '../models/Assessment.js';
import { Course } from '../models/Course.js';
import { ExamSession } from '../models/ExamSession.js';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, asyncHandler, requireFields } from '../utils/errors.js';
import {
  buildQuestionInstances,
  finalizeSession,
  remainingSeconds,
  sanitizeSession,
} from '../services/sessionService.js';

const router = express.Router();
router.use(authenticate);

const SESSION_POPULATE = [
  { path: 'course', select: 'code title accent program yearOfStudy' },
  { path: 'assessment', select: 'title mode durationMinutes passMark hintsAllowed' },
];

async function populateSession(session) {
  await session.populate(SESSION_POPULATE);
  return session;
}

async function findOwnedSession(sessionId, studentId) {
  if (!/^[a-fA-F0-9]{24}$/.test(String(sessionId))) {
    throw new ApiError(404, 'Exam session not found.');
  }
  const session = await ExamSession.findOne({ _id: sessionId, student: studentId });
  if (!session) throw new ApiError(404, 'Exam session not found.');
  return session;
}

async function loadAssessmentForStudent(assessmentId, student) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || !assessment.published) {
    throw new ApiError(404, 'Assessment not found.');
  }
  const course = await Course.findById(assessment.course);
  if (!course) throw new ApiError(404, 'Assessment course not found.');
  if (course.program !== student.program || course.yearOfStudy !== student.yearOfStudy) {
    throw new ApiError(403, 'This assessment is not part of your registered academic year.');
  }
  return { assessment, course };
}

async function prepareExistingSession(session) {
  if (session.status === 'in_progress' && remainingSeconds(session) <= 0) {
    await finalizeSession(session, {
      expired: true,
      autoSubmitted: true,
      reason: 'server_time_expiry',
    });
  }
  return populateSession(session);
}

router.post(
  '/start',
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['assessmentId']);
    const { assessment, course } = await loadAssessmentForStudent(
      req.body.assessmentId,
      req.student
    );

    const existing = await ExamSession.findOne({
      student: req.student._id,
      status: 'in_progress',
    });

    if (existing) {
      const prepared = await prepareExistingSession(existing);
      if (prepared.status === 'in_progress') {
        if (String(prepared.assessment?._id || prepared.assessment) !== String(assessment._id)) {
          throw new ApiError(
            409,
            'You already have an active examination session. Finish or submit it before starting another.',
            { code: 'ACTIVE_SESSION', activeSessionId: prepared._id }
          );
        }
        return res.json({
          resumed: true,
          message: 'Resumed your active server-timed session.',
          session: sanitizeSession(prepared),
        });
      }
    }

    const { questions, maxScore } = await buildQuestionInstances(
      course._id,
      assessment.questionCount
    );
    if (!questions.length) {
      throw new ApiError(422, 'This assessment has no published questions yet.');
    }

    const startedAt = new Date();
    const durationSeconds = assessment.durationMinutes * 60;
    const endsAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    let session;
    try {
      session = await ExamSession.create({
        student: req.student._id,
        course: course._id,
        assessment: assessment._id,
        mode: assessment.mode,
        status: 'in_progress',
        startedAt,
        endsAt,
        durationSeconds,
        questions,
        maxScore,
        currentIndex: 0,
      });
    } catch (error) {
      if (error?.code === 11000) {
        const active = await ExamSession.findOne({
          student: req.student._id,
          status: 'in_progress',
        });
        if (active) {
          const prepared = await prepareExistingSession(active);
          return res.json({
            resumed: true,
            message: 'Resumed your active server-timed session.',
            session: sanitizeSession(prepared),
          });
        }
      }
      throw error;
    }

    await populateSession(session);
    res.status(201).json({
      resumed: false,
      message: 'Secure server-timed session started.',
      session: sanitizeSession(session),
    });
  })
);

router.get(
  '/active',
  asyncHandler(async (req, res) => {
    const session = await ExamSession.findOne({
      student: req.student._id,
      status: 'in_progress',
    });
    if (!session) return res.json({ session: null });

    const prepared = await prepareExistingSession(session);
    res.json({
      session: sanitizeSession(prepared),
      expired: prepared.status !== 'in_progress',
    });
  })
);

router.get(
  '/:sessionId/clock',
  asyncHandler(async (req, res) => {
    const session = await findOwnedSession(req.params.sessionId, req.student._id);

    if (session.status === 'in_progress' && remainingSeconds(session) <= 0) {
      await finalizeSession(session, {
        expired: true,
        autoSubmitted: true,
        reason: 'server_time_expiry',
      });
    }

    res.json({
      serverNow: new Date().toISOString(),
      endsAt: session.endsAt,
      remainingSeconds: remainingSeconds(session),
      status: session.status,
    });
  })
);

router.get(
  '/:sessionId',
  asyncHandler(async (req, res) => {
    const session = await findOwnedSession(req.params.sessionId, req.student._id);
    const prepared = await prepareExistingSession(session);
    res.json({ session: sanitizeSession(prepared) });
  })
);

router.patch(
  '/:sessionId/answer',
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['instanceId']);
    const session = await findOwnedSession(req.params.sessionId, req.student._id);

    if (session.status !== 'in_progress') {
      await populateSession(session);
      return res.status(409).json({
        message: 'This session is already submitted.',
        session: sanitizeSession(session),
      });
    }

    if (remainingSeconds(session) <= 0) {
      await finalizeSession(session, {
        expired: true,
        autoSubmitted: true,
        reason: 'server_time_expiry',
      });
      await populateSession(session);
      return res.json({
        expired: true,
        remainingSeconds: 0,
        session: sanitizeSession(session),
      });
    }

    const question = session.questions.find(
      (entry) => entry.instanceId === req.body.instanceId
    );
    if (!question) throw new ApiError(404, 'Question does not belong to this session.');

    const value = String(req.body.value ?? '').slice(0, 6000);
    const answer = session.answers.find((entry) => entry.instanceId === req.body.instanceId);
    if (answer) {
      answer.value = value;
      answer.updatedAt = new Date();
    } else {
      session.answers.push({
        instanceId: req.body.instanceId,
        value,
        updatedAt: new Date(),
      });
    }

    if (req.body.currentIndex !== undefined) {
      const index = Number(req.body.currentIndex);
      if (Number.isInteger(index) && index >= 0 && index < session.questions.length) {
        session.currentIndex = index;
      }
    }

    await session.save();

    res.json({
      savedAt: new Date().toISOString(),
      serverNow: new Date().toISOString(),
      remainingSeconds: remainingSeconds(session),
      answeredCount: session.answers.filter((entry) => String(entry.value).trim()).length,
      totalQuestions: session.questions.length,
    });
  })
);

router.post(
  '/:sessionId/submit',
  asyncHandler(async (req, res) => {
    const session = await findOwnedSession(req.params.sessionId, req.student._id);

    if (session.status === 'in_progress') {
      if (Array.isArray(req.body?.answers)) {
        const validIds = new Set(session.questions.map((question) => question.instanceId));
        for (const entry of req.body.answers.slice(0, 200)) {
          if (!entry?.instanceId || !validIds.has(entry.instanceId)) continue;
          const value = String(entry.value ?? '').slice(0, 6000);
          const existing = session.answers.find(
            (answer) => answer.instanceId === entry.instanceId
          );
          if (existing) {
            existing.value = value;
            existing.updatedAt = new Date();
          } else {
            session.answers.push({
              instanceId: entry.instanceId,
              value,
              updatedAt: new Date(),
            });
          }
        }
        await session.save();
      }

      await finalizeSession(session, {
        expired: remainingSeconds(session) <= 0,
        autoSubmitted: false,
        reason: 'student_submit',
      });
    }

    await populateSession(session);
    res.json({ session: sanitizeSession(session) });
  })
);

router.post(
  '/:sessionId/integrity',
  asyncHandler(async (req, res) => {
    const type = String(req.body?.type || 'tab_hidden').slice(0, 40);
    const session = await findOwnedSession(req.params.sessionId, req.student._id);

    if (session.status !== 'in_progress') {
      await populateSession(session);
      return res.json({ action: 'already_submitted', session: sanitizeSession(session) });
    }

    session.integrityEvents.push({
      type,
      at: new Date(),
      meta: { message: req.body.message || '' },
    });

    if (type === 'tab_hidden') {
      session.tabSwitchCount += 1;
    }

    if (session.tabSwitchCount >= env.maxTabSwitches) {
      await finalizeSession(session, {
        autoSubmitted: true,
        reason: 'integrity_auto_submit',
      });
      await populateSession(session);
      return res.json({
        action: 'auto_submitted',
        message: 'The examination was auto-submitted after repeated tab switches.',
        tabSwitchCount: session.tabSwitchCount,
        session: sanitizeSession(session),
      });
    }

    await session.save();
    res.json({
      action: type === 'tab_hidden' ? 'flagged' : 'logged',
      tabSwitchCount: session.tabSwitchCount,
      remainingStrikes: Math.max(0, env.maxTabSwitches - session.tabSwitchCount),
      maxTabSwitches: env.maxTabSwitches,
    });
  })
);

export default router;
