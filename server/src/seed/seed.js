import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Student } from '../models/Student.js';
import { Course } from '../models/Course.js';
import { Assessment } from '../models/Assessment.js';
import { Question } from '../models/Question.js';
import { ExamSession } from '../models/ExamSession.js';
import { PastPaper } from '../models/PastPaper.js';
import { LiteracyLesson } from '../models/LiteracyLesson.js';
import { courses, assessmentBlueprints } from '../data/courses.js';
import { questions } from '../data/questions.js';
import { students } from '../data/students.js';
import { pastPapers } from '../data/pastPapers.js';
import { literacyLessons } from '../data/literacy.js';
import { buildQuestionInstances, gradeSession } from '../services/sessionService.js';

function pickWrongAnswer(question) {
  if (question.type === 'mcq') {
    return (question.options || []).find((option) => option.key !== question.correctAnswer)?.key || 'A';
  }
  if (question.type === 'truefalse') {
    return question.correctAnswer === 'true' ? 'false' : 'true';
  }
  if (question.type === 'numeric') {
    const value = Number(question.correctAnswer);
    return Number.isFinite(value) ? String(Math.round((value + 3) * 100) / 100) : '0';
  }
  return '';
}

function partialAnswer(question) {
  const keywords = (question.rubric?.keywords || []).slice(0, 3);
  return `This concept is important in ${question.topicTitle || question.topic}. It relates to ${
    keywords.join(', ') || 'the module content'
  }.`;
}

function buildAnswers(questionsForAttempt, ratio, offset) {
  return questionsForAttempt.map((question, index) => {
    const correct = ((index * 7 + offset) % 10) < Math.round(ratio * 10);
    let value;
    if (correct) {
      value =
        question.type === 'short' || question.type === 'essay'
          ? question.rubric?.modelAnswer || question.correctAnswer
          : question.correctAnswer;
    } else if (question.type === 'short' || question.type === 'essay') {
      value = partialAnswer(question);
    } else {
      value = pickWrongAnswer(question);
    }
    return {
      instanceId: question.instanceId,
      value,
      updatedAt: new Date(),
    };
  });
}

async function seedAttempt({
  student,
  course,
  assessment,
  daysAgo,
  ratio,
  offset,
}) {
  const { questions: generated } = await buildQuestionInstances(
    course._id,
    assessment.questionCount
  );
  const durationMs = assessment.durationMinutes * 60 * 1000;
  const startedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const endsAt = new Date(startedAt.getTime() + durationMs);

  const session = new ExamSession({
    student: student._id,
    course: course._id,
    assessment: assessment._id,
    mode: assessment.mode,
    status: 'in_progress',
    startedAt,
    endsAt,
    durationSeconds: assessment.durationMinutes * 60,
    questions: generated,
    answers: buildAnswers(generated, ratio, offset),
    currentIndex: generated.length - 1,
    tabSwitchCount: 0,
  });

  await gradeSession(session, assessment);
  session.status = 'submitted';
  session.submittedAt = new Date(endsAt.getTime() + 60 * 1000);
  session.gradedAt = new Date(endsAt.getTime() + 60 * 1000);
  session.autoSubmitted = false;
  await session.save();
  return session;
}

async function seed() {
  console.log('[seed] connecting to database...');
  await connectDatabase();

  console.log('[seed] clearing existing platform collections...');
  await Promise.all([
    ExamSession.deleteMany({}),
    Assessment.deleteMany({}),
    Question.deleteMany({}),
    PastPaper.deleteMany({}),
    LiteracyLesson.deleteMany({}),
    Course.deleteMany({}),
    Student.deleteMany({}),
  ]);

  const createdStudents = [];
for (const studentData of students) {
  createdStudents.push(await Student.create({ ...studentData, passwordHash: studentData.password }));
}
console.log(`[seed] ${createdStudents.length} students inserted`);

  const createdCourses = await Course.insertMany(courses);
  const courseByCode = new Map(createdCourses.map((course) => [course.code, course]));
  console.log(`[seed] ${createdCourses.length} courses inserted`);

  const createdPastPapers = await PastPaper.insertMany(pastPapers);
  console.log(`[seed] ${createdPastPapers.length} past papers inserted`);

  const createdLiteracyLessons = await LiteracyLesson.insertMany(literacyLessons);
  console.log(`[seed] ${createdLiteracyLessons.length} literacy lessons inserted`);

  const questionsToInsert = questions.map((question) => {
    const course = courseByCode.get(question.course);
    if (!course) throw new Error(`Unknown course code in question bank: ${question.course}`);
    return { ...question, course: course._id };
  });
  const createdQuestions = await Question.insertMany(questionsToInsert);
  console.log(`[seed] ${createdQuestions.length} questions inserted`);

  const assessmentDocs = [];
  for (const course of createdCourses) {
    const bankSize = questionsToInsert.filter(
      (question) => String(question.course) === String(course._id)
    ).length;

    for (const blueprint of assessmentBlueprints) {
      assessmentDocs.push({
        course: course._id,
        title: blueprint.title,
        mode: blueprint.mode,
        description: blueprint.description,
        durationMinutes: blueprint.durationMinutes,
        questionCount: Math.min(blueprint.maxQuestions, bankSize),
        passMark: blueprint.passMark,
        hintsAllowed: blueprint.hintsAllowed,
        published: true,
        order: blueprint.order,
      });
    }
  }
  const createdAssessments = await Assessment.insertMany(assessmentDocs);
  console.log(`[seed] ${createdAssessments.length} assessments inserted`);

  const assessmentByCourseAndMode = new Map(
    createdAssessments.map((assessment) => [
      `${assessment.course}:${assessment.mode}`,
      assessment,
    ])
  );
  const studentByReg = new Map(createdStudents.map((student) => [student.registrationNumber, student]));

  const attemptPlan = [
    { reg: '223452022', course: 'SE4101', mode: 'practice', daysAgo: 14, ratio: 0.5, offset: 0 },
    { reg: '223452022', course: 'SE4103', mode: 'mock', daysAgo: 10, ratio: 0.36, offset: 3 },
    { reg: '223452022', course: 'SE4101', mode: 'exam', daysAgo: 6, ratio: 0.72, offset: 5 },
    { reg: '223452022', course: 'SE4103', mode: 'practice', daysAgo: 3, ratio: 0.8, offset: 1 },
    { reg: '233462023', course: 'SE3101', mode: 'practice', daysAgo: 8, ratio: 0.68, offset: 2 },
    { reg: '233462023', course: 'SE3102', mode: 'mock', daysAgo: 4, ratio: 0.5, offset: 6 },
    { reg: '243472024', course: 'SE2102', mode: 'practice', daysAgo: 7, ratio: 0.6, offset: 4 },
    { reg: '243472024', course: 'SE2103', mode: 'mock', daysAgo: 3, ratio: 0.46, offset: 7 },
    { reg: '243472024', course: 'SE2101', mode: 'practice', daysAgo: 1, ratio: 0.82, offset: 9 },
  ];

  for (const plan of attemptPlan) {
    const student = studentByReg.get(plan.reg);
    const course = courseByCode.get(plan.course);
    const assessment = assessmentByCourseAndMode.get(`${course._id}:${plan.mode}`);
    if (!student || !course || !assessment) continue;
    await seedAttempt({
      student,
      course,
      assessment,
      daysAgo: plan.daysAgo,
      ratio: plan.ratio,
      offset: plan.offset,
    });
  }
  console.log(`[seed] ${attemptPlan.length} historical attempts generated`);

  console.log('\n[seed] complete. Demo registration numbers:');
  for (const student of createdStudents) {
    console.log(
      `  - ${student.registrationNumber}  ${student.fullName}  [${student.program}, Year ${student.yearOfStudy}, ${student.enrollmentStatus}]`
    );
  }
  console.log('\n[seed] Use 22345/2022 as the primary demo account (Year 4 Software Engineering).');
  console.log('[seed] Use 99001/2020 to demonstrate the blocked inactive-enrollment path.');

  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error('[seed] failed:', error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
