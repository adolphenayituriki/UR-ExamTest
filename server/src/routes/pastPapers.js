import express from 'express';
import { PastPaper } from '../models/PastPaper.js';
import { Course } from '../models/Course.js';
import { Assessment } from '../models/Assessment.js';
import { ExamSession } from '../models/ExamSession.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { env } from '../config/env.js';
import crypto from 'node:crypto';

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { program, yearOfStudy } = req.student;
    const filter = {
      program,
      yearOfStudy: Number(yearOfStudy),
      verified: true,
    };

    const papers = await PastPaper.find(filter)
      .sort({ academicYear: -1, moduleCode: 1 })
      .lean();

    const payload = papers.map((paper) => ({
      id: paper._id,
      slug: paper.slug,
      college: paper.college,
      department: paper.department,
      program: paper.program,
      yearOfStudy: paper.yearOfStudy,
      moduleCode: paper.moduleCode,
      moduleTitle: paper.moduleTitle,
      academicYear: paper.academicYear,
      examSession: paper.examSession,
      semester: paper.semester,
      durationMinutes: paper.durationMinutes,
      totalMarks: paper.totalMarks,
      description: paper.description,
      topics: paper.topics,
      verified: paper.verified,
      downloads: paper.downloads,
      questionCount: (paper.sections || []).reduce(
        (sum, section) => sum + (section.questions?.length || 0),
        0
      ),
    }));

    res.json({ pastPapers: payload, student: req.student.toProfile() });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const paper = await PastPaper.findOne({ slug: req.params.slug }).lean();
    if (!paper) throw new ApiError(404, 'Past paper not found.');

    const accessible =
      paper.program === req.student.program &&
      paper.yearOfStudy === req.student.yearOfStudy;
    if (!accessible) {
      throw new ApiError(403, 'This past paper is not part of your registered academic year.');
    }

    const questionCount = (paper.sections || []).reduce(
      (sum, section) => sum + (section.questions?.length || 0),
      0
    );

    res.json({
      pastPaper: {
        id: paper._id,
        slug: paper.slug,
        college: paper.college,
        department: paper.department,
        program: paper.program,
        yearOfStudy: paper.yearOfStudy,
        moduleCode: paper.moduleCode,
        moduleTitle: paper.moduleTitle,
        academicYear: paper.academicYear,
        examSession: paper.examSession,
        semester: paper.semester,
        durationMinutes: paper.durationMinutes,
        totalMarks: paper.totalMarks,
        description: paper.description,
        topics: paper.topics,
        verified: paper.verified,
        sections: paper.sections.map((section) => ({
          key: section.key,
          title: section.title,
          instructions: section.instructions,
          marks: section.marks,
          // Answers and explanations are intentionally withheld until the
          // paper is attempted as a graded practice session.
          questions: section.questions.map((q) => ({
            number: q.number,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            marks: q.marks,
            topic: q.topic,
          })),
          questionCount: section.questions?.length || 0,
        })),
        questionCount,
      },
    });
  })
);

router.post(
  '/:slug/start',
  asyncHandler(async (req, res) => {
    const paper = await PastPaper.findOne({ slug: req.params.slug }).lean();
    if (!paper) throw new ApiError(404, 'Past paper not found.');

    if (
      paper.program !== req.student.program ||
      paper.yearOfStudy !== req.student.yearOfStudy
    ) {
      throw new ApiError(403, 'This past paper is not part of your registered academic year.');
    }

    const existing = await ExamSession.findOne({
      student: req.student._id,
      status: 'in_progress',
    });
    if (existing) {
      throw new ApiError(
        409,
        'You already have an active examination session. Finish or submit it before starting another.',
        { code: 'ACTIVE_SESSION', activeSessionId: existing._id }
      );
    }

    let course = await Course.findOne({
      code: paper.moduleCode,
      program: paper.program,
    }).lean();
    if (!course) {
      course = await Course.create({
        code: paper.moduleCode,
        title: paper.moduleTitle,
        program: paper.program,
        college: paper.college,
        yearOfStudy: paper.yearOfStudy,
        semester: paper.semester || 'I',
        topics: (paper.topics || []).map((title, index) => ({ key: `topic-${index}`, title })),
        accent: paper.accent || '#2563eb',
      });
    }

    let assessment = await Assessment.findOne({
      course: course._id,
      mode: 'practice',
      title: new RegExp(`^Past paper: ${paper.moduleCode}`, 'i'),
    }).lean();

    if (!assessment) {
      const created = await Assessment.create({
        course: course._id,
        title: `Past paper: ${paper.moduleCode} ${paper.academicYear}`,
        description: paper.description || `End-of-semester past paper for ${paper.moduleTitle}.`,
        mode: 'practice',
        durationMinutes: paper.durationMinutes,
        questionCount: (paper.sections || []).reduce(
          (sum, section) => sum + (section.questions?.length || 0),
          0
        ),
        passMark: 50,
        hintsAllowed: true,
        published: true,
        order: 1,
      });
      assessment = created.toObject ? created.toObject() : created;
    }

    const flatQuestions = (paper.sections || []).flatMap((section) =>
      (section.questions || []).map((q) => ({
        ...q,
        course: course._id,
        type: q.type || 'mcq',
        marks: q.marks || 1,
        topic: q.topic || 'General',
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        options: q.options || [],
        prompt: q.prompt || '',
      }))
    );

    if (!flatQuestions.length) {
      throw new ApiError(422, 'This past paper has no practice questions yet.');
    }

    const questions = flatQuestions.map((question) => ({
      instanceId: crypto.randomUUID(),
      questionId: null,
      type: question.type,
      prompt: String(question.prompt || ''),
      options: question.options || [],
      marks: Number(question.marks) || 1,
      topic: String(question.topic || 'General'),
      topicTitle: String(question.topic || 'General'),
      difficulty: 'medium',
      correctAnswer: String(question.correctAnswer || ''),
      explanation: String(question.explanation || ''),
      rubric: question.rubric || {},
      mutated: false,
    }));

    const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);
    const startedAt = new Date();
    const durationSeconds = paper.durationMinutes * 60;
    const endsAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    const session = await ExamSession.create({
      student: req.student._id,
      course: course._id,
      assessment: assessment._id,
      mode: 'practice',
      status: 'in_progress',
      begun: false,
      startedAt,
      endsAt,
      durationSeconds,
      questions,
      maxScore,
      currentIndex: 0,
    });

    await session.populate([
      { path: 'course', select: 'code title accent program yearOfStudy' },
      { path: 'assessment', select: 'title mode durationMinutes passMark hintsAllowed' },
    ]);

    res.status(201).json({
      resumed: false,
      message: 'Past-paper practice session started.',
      session: {
        id: session._id,
        status: session.status,
        mode: session.mode,
        begun: false,
        begunAt: null,
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        serverNow: new Date().toISOString(),
        durationSeconds: session.durationSeconds,
        remainingSeconds: durationSeconds,
        currentIndex: session.currentIndex,
        hintsUsed: session.hintsUsed,
        tabSwitchCount: session.tabSwitchCount,
        maxTabSwitches: env.maxTabSwitches,
        answeredCount: 0,
        totalQuestions: questions.length,
        questions: questions.map((q) => ({
          instanceId: q.instanceId,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          marks: q.marks,
          topic: q.topic,
          topicTitle: q.topicTitle,
          difficulty: q.difficulty,
          mutated: q.mutated,
          answer: '',
          answered: false,
        })),
        answers: [],
        theme: {
          course: {
            id: course._id,
            code: course.code,
            title: course.title,
            accent: course.accent,
            program: course.program,
            yearOfStudy: course.yearOfStudy,
          },
          assessment: {
            id: assessment._id,
            title: assessment.title,
            mode: assessment.mode,
            durationMinutes: assessment.durationMinutes,
            passMark: assessment.passMark,
            hintsAllowed: assessment.hintsAllowed,
          },
        },
        review: false,
        result: null,
      },
    });
  })
);

export default router;
