import crypto from 'node:crypto';
import { ExamSession } from '../models/ExamSession.js';
import { Question } from '../models/Question.js';
import { Assessment } from '../models/Assessment.js';
import { Course } from '../models/Course.js';
import { env } from '../config/env.js';
import { renderQuestion } from '../utils/mutation.js';
import { clamp, round1 } from '../utils/math.js';
import { gradeNumeric, gradeObjective, gradeShort } from './grading.js';
import { gradeEssay } from './aiService.js';

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function buildQuestionInstances(courseId, count) {
  const [course, bank] = await Promise.all([
    Course.findById(courseId).lean(),
    Question.find({ course: courseId, active: true }).lean(),
  ]);

  if (!course || !bank.length) {
    return { questions: [], maxScore: 0 };
  }

  const topicTitles = new Map((course.topics || []).map((topic) => [topic.key, topic.title]));
  const selected = shuffle(bank).slice(0, Math.min(count, bank.length));

  const questions = selected.map((question) => {
    const rendered = renderQuestion(question);
    return {
      instanceId: crypto.randomUUID(),
      questionId: question._id,
      type: question.type,
      prompt: rendered.prompt,
      options: question.options || [],
      marks: question.marks,
      topic: question.topic,
      topicTitle: topicTitles.get(question.topic) || question.topic,
      difficulty: question.difficulty,
      correctAnswer: rendered.correctAnswer,
      explanation: question.explanation || '',
      rubric: question.rubric || {},
      mutated: rendered.mutated,
    };
  });

  return {
    questions,
    maxScore: questions.reduce((sum, question) => sum + question.marks, 0),
  };
}

export function remainingSeconds(session, now = Date.now()) {
  if (session.status !== 'in_progress') return 0;
  const end = new Date(session.endsAt).getTime();
  return Math.max(0, Math.ceil((end - now) / 1000));
}

export function sanitizeSession(session) {
  const review = session.status !== 'in_progress';
  const answers = new Map(
    (session.answers || []).map((answer) => [answer.instanceId, answer])
  );
  const feedback = new Map(
    (session.feedback || []).map((entry) => [entry.instanceId, entry])
  );

  const questions = (session.questions || []).map((question) => {
    const answer = answers.get(question.instanceId);
    const entry = feedback.get(question.instanceId);
    const base = {
      instanceId: question.instanceId,
      type: question.type,
      prompt: question.prompt,
      options: question.options || [],
      marks: question.marks,
      topic: question.topic,
      topicTitle: question.topicTitle,
      difficulty: question.difficulty,
      mutated: question.mutated,
      answer: answer?.value || '',
      answered: Boolean(answer?.value && String(answer.value).trim()),
    };

    if (review) {
      base.correctAnswer = question.correctAnswer;
      base.explanation = question.explanation;
      base.rubric = question.rubric;
      base.feedback = entry
        ? {
            correct: entry.correct,
            awarded: entry.awarded,
            max: entry.max,
            aiFeedback: entry.aiFeedback,
            aiScore: entry.aiScore,
          }
        : null;
    }

    return base;
  });

  const topicBreakdown = {};
  if (review) {
    for (const entry of session.feedback || []) {
      const key = entry.topic || 'general';
      if (!topicBreakdown[key]) {
        topicBreakdown[key] = {
          topic: entry.topic,
          title: entry.topicTitle || entry.topic,
          awarded: 0,
          max: 0,
          questions: 0,
        };
      }
      topicBreakdown[key].awarded += entry.awarded;
      topicBreakdown[key].max += entry.max;
      topicBreakdown[key].questions += 1;
    }
    for (const value of Object.values(topicBreakdown)) {
      value.percentage = value.max ? round1((value.awarded / value.max) * 100) : 0;
    }
  }

  const course =
    session.course && typeof session.course === 'object' && session.course.code
      ? {
          id: session.course._id,
          code: session.course.code,
          title: session.course.title,
          accent: session.course.accent,
          program: session.course.program,
          yearOfStudy: session.course.yearOfStudy,
        }
      : { id: session.course };

  const assessment =
    session.assessment && typeof session.assessment === 'object' && session.assessment.title
      ? {
          id: session.assessment._id,
          title: session.assessment.title,
          mode: session.assessment.mode,
          durationMinutes: session.assessment.durationMinutes,
          passMark: session.assessment.passMark,
          hintsAllowed: session.assessment.hintsAllowed,
        }
      : { id: session.assessment };

  return {
    id: session._id,
    status: session.status,
    mode: session.mode,
    startedAt: session.startedAt,
    endsAt: session.endsAt,
    serverNow: new Date().toISOString(),
    durationSeconds: session.durationSeconds,
    remainingSeconds: remainingSeconds(session),
    currentIndex: session.currentIndex,
    hintsUsed: session.hintsUsed,
    tabSwitchCount: session.tabSwitchCount,
    maxTabSwitches: env.maxTabSwitches,
    answeredCount: questions.filter((question) => question.answered).length,
    totalQuestions: questions.length,
    questions,
    answers: (session.answers || []).map((answer) => ({
      instanceId: answer.instanceId,
      value: answer.value,
      updatedAt: answer.updatedAt,
    })),
    theme: {
      course,
      assessment,
    },
    review,
    result: review
      ? {
          score: session.score,
          maxScore: session.maxScore,
          percentage: session.percentage,
          passed: session.passed,
          submittedAt: session.submittedAt,
          autoSubmitted: session.autoSubmitted,
          topicBreakdown,
        }
      : null,
  };
}

export async function gradeSession(session, assessment) {
  const answers = new Map(
    (session.answers || []).map((answer) => [answer.instanceId, answer.value])
  );
  const feedback = [];
  let score = 0;
  let maxScore = 0;

  for (const question of session.questions) {
    const value = String(answers.get(question.instanceId) ?? '').trim();
    maxScore += question.marks;
    let result;

    if (!value) {
      result = { correct: false, awarded: 0, feedback: 'No answer submitted.' };
    } else if (question.type === 'numeric') {
      result = gradeNumeric(question, value);
    } else if (question.type === 'short') {
      result = gradeShort(question, value);
    } else if (question.type === 'essay') {
      const graded = await gradeEssay({
        prompt: question.prompt,
        rubric: question.rubric || {},
        text: value,
        marks: question.marks,
      });
      const awarded = round1(graded.score * question.marks);
      result = {
        correct: graded.score >= 0.5,
        awarded,
        feedback: graded.feedback,
        aiScore: round1(graded.score * 100),
      };
    } else {
      result = gradeObjective(question, value);
    }

    score += result.awarded;
    feedback.push({
      instanceId: question.instanceId,
      topic: question.topic,
      topicTitle: question.topicTitle || question.topic,
      correct: result.correct,
      awarded: result.awarded,
      max: question.marks,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      aiScore: result.aiScore,
      aiFeedback: result.feedback,
    });
  }

  const percentage = maxScore ? round1(clamp(score / maxScore, 0, 1) * 100) : 0;
  const passMark = assessment?.passMark ?? 50;

  session.score = round1(score);
  session.maxScore = maxScore;
  session.percentage = percentage;
  session.passed = percentage >= passMark;
  session.feedback = feedback;
  return session;
}

export async function finalizeSession(session, options = {}) {
  if (session.status !== 'in_progress') return session;

  const assessmentId = session.assessment?._id || session.assessment;
  const assessment = await Assessment.findById(assessmentId).lean();

  try {
    await gradeSession(session, assessment);
  } catch (e) {
    // Fallback: basic grading if AI/grading fails
    if (!session.score && !session.percentage) {
      await gradeSession(session, assessment).catch(() => {});
    }
  }

  session.status = options.expired ? 'expired' : 'submitted';
  session.submittedAt = session.submittedAt || new Date();
  session.gradedAt = new Date();
  session.autoSubmitted = Boolean(options.autoSubmitted);

  if (options.reason) {
    session.integrityEvents.push({
      type: options.reason,
      at: new Date(),
    });
  }

  await session.save();
  return session;
}

export async function sweepExpiredSessions() {
  const now = new Date();
  const due = await ExamSession.find({
    status: 'in_progress',
    endsAt: { $lt: now },
  }).limit(25);

  for (const session of due) {
    try {
      await finalizeSession(session, {
        expired: true,
        autoSubmitted: true,
        reason: 'server_time_expiry',
      });
      console.log(`[exam] auto-submitted expired session ${session._id}`);
    } catch (error) {
      console.error(`[exam] expiry sweep failed for ${session._id}:`, error.message);
    }
  }
  return due.length;
}
