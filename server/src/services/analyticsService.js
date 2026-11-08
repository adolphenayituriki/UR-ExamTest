import { ExamSession } from '../models/ExamSession.js';
import { Course } from '../models/Course.js';
import { Assessment } from '../models/Assessment.js';
import { round1 } from '../utils/math.js';
import { generateDiagnosticNarrative } from './aiService.js';

async function loadSessions(studentId, extraFilter = {}, limit = 0) {
  let query = ExamSession.find({
    student: studentId,
    status: { $in: ['submitted', 'expired'] },
    ...extraFilter,
  })
    .populate('course', 'code title accent topics program yearOfStudy')
    .populate('assessment', 'title mode passMark durationMinutes')
    .sort({ submittedAt: -1 });

  if (limit) query = query.limit(limit);
  return query.lean();
}

function buildTopicRows(sessions, courseByCode) {
  const rows = new Map();

  for (const session of sessions) {
    const courseCode = session.course?.code || 'GENERAL';
    const course = courseByCode.get(courseCode);

    for (const entry of session.feedback || []) {
      const key = `${courseCode}::${entry.topic}`;
      if (!rows.has(key)) {
        const topicTitle =
          course?.topics?.find((topic) => topic.key === entry.topic)?.title || entry.topic;
        rows.set(key, {
          key,
          courseCode,
          courseTitle: course?.title || session.course?.title || courseCode,
          topicKey: entry.topic,
          title: topicTitle,
          awarded: 0,
          max: 0,
          questions: 0,
          correct: 0,
        });
      }
      const row = rows.get(key);
      row.awarded += entry.awarded;
      row.max += entry.max;
      row.questions += 1;
      if (entry.correct) row.correct += 1;
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      accuracy: row.max ? round1(row.awarded / row.max) : 0,
      percentage: row.max ? round1((row.awarded / row.max) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export async function getOverview(studentId) {
  const [sessions, courses] = await Promise.all([
    loadSessions(studentId),
    Course.find({}).lean(),
  ]);
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  const topicRows = buildTopicRows(sessions, courseByCode);

  const attempts = sessions.length;
  const totalScore = sessions.reduce((sum, session) => sum + (session.score || 0), 0);
  const totalMax = sessions.reduce((sum, session) => sum + (session.maxScore || 0), 0);
  const passed = sessions.filter((session) => session.passed).length;
  const studyMinutes = sessions.reduce(
    (sum, session) => sum + (session.durationSeconds || 0) / 60,
    0
  );

  const byCourseMap = new Map();
  for (const session of sessions) {
    const code = session.course?.code || 'GENERAL';
    if (!byCourseMap.has(code)) {
      byCourseMap.set(code, {
        code,
        title: session.course?.title || code,
        accent: session.course?.accent || '#2563eb',
        attempts: 0,
        totalPercentage: 0,
        best: 0,
      });
    }
    const row = byCourseMap.get(code);
    row.attempts += 1;
    row.totalPercentage += session.percentage || 0;
    row.best = Math.max(row.best, session.percentage || 0);
  }

  const trend = [...sessions]
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .slice(-10)
    .map((session) => ({
      id: session._id,
      label: session.course?.code || 'Exam',
      percentage: session.percentage,
      submittedAt: session.submittedAt,
      mode: session.mode,
    }));

  const recentAttempts = sessions.slice(0, 6).map((session) => ({
    id: session._id,
    courseCode: session.course?.code,
    courseTitle: session.course?.title,
    accent: session.course?.accent,
    assessmentTitle: session.assessment?.title,
    mode: session.mode,
    percentage: session.percentage,
    score: session.score,
    maxScore: session.maxScore,
    passed: session.passed,
    status: session.status,
    autoSubmitted: session.autoSubmitted,
    submittedAt: session.submittedAt,
  }));

  return {
    stats: {
      attempts,
      averagePercentage: totalMax ? round1((totalScore / totalMax) * 100) : 0,
      bestPercentage: sessions.reduce(
        (best, session) => Math.max(best, session.percentage || 0),
        0
      ),
      passRate: attempts ? round1((passed / attempts) * 100) : 0,
      studyMinutes: Math.round(studyMinutes),
      questionsAnswered: sessions.reduce((sum, session) => sum + (session.feedback?.length || 0), 0),
    },
    coursePerformance: [...byCourseMap.values()].map((row) => ({
      ...row,
      average: row.attempts ? round1(row.totalPercentage / row.attempts) : 0,
    })),
    topics: topicRows,
    weakTopics: topicRows.filter((topic) => topic.questions >= 2 && topic.accuracy < 0.55).slice(0, 4),
    trend,
    recentAttempts,
  };
}

export async function getDiagnostics(studentId) {
  const [sessions, courses, assessments] = await Promise.all([
    loadSessions(studentId, {}, 25),
    Course.find({}).lean(),
    Assessment.find({ published: true }).lean(),
  ]);
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  const topicRows = buildTopicRows(sessions, courseByCode);

  const weakTopics = topicRows
    .filter((topic) => topic.questions >= 2 && topic.accuracy < 0.6)
    .slice(0, 6);
  const strongTopics = [...topicRows]
    .filter((topic) => topic.accuracy >= 0.75)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 6);

  const courseIdByCode = new Map(courses.map((course) => [course.code, course._id]));
  const recommendations = weakTopics.map((topic) => {
    const courseId = courseIdByCode.get(topic.courseCode);
    const practice =
      assessments.find(
        (assessment) =>
          String(assessment.course) === String(courseId) && assessment.mode === 'practice'
      ) || assessments.find((assessment) => String(assessment.course) === String(courseId));

    return {
      topic: topic.title,
      topicKey: topic.topicKey,
      courseCode: topic.courseCode,
      courseTitle: topic.courseTitle,
      accuracy: topic.percentage,
      action: `Review "${topic.title}" then run a guided practice track.`,
      assessmentId: practice?._id || null,
      assessmentTitle: practice?.title || null,
      courseId: courseId || null,
    };
  });

  const { narrative, source } = await generateDiagnosticNarrative(weakTopics, strongTopics);

  return {
    topics: topicRows,
    weakTopics,
    strongTopics,
    recommendations,
    narrative,
    narrativeSource: source,
    attemptsAnalyzed: sessions.length,
  };
}

export async function getCourseHistory(studentId, courseId) {
  const sessions = await ExamSession.find({
    student: studentId,
    course: courseId,
    status: { $in: ['submitted', 'expired', 'in_progress'] },
  })
    .populate('assessment', 'title mode passMark durationMinutes')
    .sort({ createdAt: -1 })
    .lean();

  return sessions.map((session) => ({
    id: session._id,
    assessmentTitle: session.assessment?.title || 'Assessment',
    mode: session.mode,
    status: session.status,
    score: session.score,
    maxScore: session.maxScore,
    percentage: session.percentage,
    passed: session.passed,
    autoSubmitted: session.autoSubmitted,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
  }));
}
