import express from 'express';
import { Course } from '../models/Course.js';
import { Assessment } from '../models/Assessment.js';
import { Question } from '../models/Question.js';
import { ExamSession } from '../models/ExamSession.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { getCourseHistory } from '../services/analyticsService.js';
import { round1 } from '../utils/math.js';

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {
      program: req.student.program,
      yearOfStudy: req.student.yearOfStudy,
    };

    const courses = await Course.find(filter).sort({ code: 1 }).lean();
    if (!courses.length) {
      return res.json({ courses: [], message: 'No registered modules found for this academic year.' });
    }

    const courseIds = courses.map((course) => course._id);
    const [questionCounts, assessments, sessionStats] = await Promise.all([
      Question.aggregate([
        { $match: { course: { $in: courseIds }, active: true } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]),
      Assessment.find({ course: { $in: courseIds }, published: true })
        .sort({ order: 1 })
        .lean(),
      ExamSession.aggregate([
        {
          $match: {
            student: req.student._id,
            course: { $in: courseIds },
            status: { $in: ['submitted', 'expired'] },
          },
        },
        {
          $group: {
            _id: '$course',
            attempts: { $sum: 1 },
            average: { $avg: '$percentage' },
            best: { $max: '$percentage' },
          },
        },
      ]),
    ]);

    const questionMap = new Map(
      questionCounts.map((row) => [String(row._id), row.count])
    );
    const assessmentMap = new Map();
    for (const assessment of assessments) {
      const key = String(assessment.course);
      if (!assessmentMap.has(key)) assessmentMap.set(key, []);
      assessmentMap.get(key).push({
        id: assessment._id,
        title: assessment.title,
        mode: assessment.mode,
        durationMinutes: assessment.durationMinutes,
        questionCount: assessment.questionCount,
        hintsAllowed: assessment.hintsAllowed,
      });
    }
    const sessionMap = new Map(sessionStats.map((row) => [String(row._id), row]));

    const payload = courses.map((course) => {
      const key = String(course._id);
      const stats = sessionMap.get(key);
      return {
        id: course._id,
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        accent: course.accent,
        topics: course.topics,
        questionCount: questionMap.get(key) || 0,
        assessments: assessmentMap.get(key) || [],
        attempts: stats?.attempts || 0,
        average: stats?.average ? round1(stats.average) : 0,
        best: stats?.best ? round1(stats.best) : 0,
      };
    });

    res.json({
      student: req.student.toProfile(),
      courses: payload,
    });
  })
);

router.get(
  '/:courseId',
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.courseId).lean();
    if (!course) throw new ApiError(404, 'Course not found.');

    if (
      course.program !== req.student.program ||
      course.yearOfStudy !== req.student.yearOfStudy
    ) {
      throw new ApiError(403, 'This module is not part of your registered academic year.');
    }

    const [assessments, topicCounts, history] = await Promise.all([
      Assessment.find({ course: course._id, published: true }).sort({ order: 1 }).lean(),
      Question.aggregate([
        { $match: { course: course._id, active: true } },
        { $group: { _id: '$topic', count: { $sum: 1 } } },
      ]),
      getCourseHistory(req.student._id, course._id),
    ]);

    const completed = history.filter((entry) => entry.status !== 'in_progress');
    const attempts = completed.length;
    const average = attempts
      ? round1(completed.reduce((sum, entry) => sum + (entry.percentage || 0), 0) / attempts)
      : 0;
    const best = attempts ? Math.max(...completed.map((entry) => entry.percentage || 0)) : 0;
    const topicMap = new Map(topicCounts.map((row) => [row._id, row.count]));

    res.json({
      course: {
        id: course._id,
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        accent: course.accent,
        program: course.program,
        yearOfStudy: course.yearOfStudy,
        topics: course.topics.map((topic) => ({
          ...topic,
          questionCount: topicMap.get(topic.key) || 0,
        })),
      },
      assessments,
      history,
      stats: { attempts, average, best, passMark: assessments[0]?.passMark || 50 },
    });
  })
);

export default router;
