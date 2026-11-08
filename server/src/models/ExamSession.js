import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  { key: { type: String, required: true }, text: { type: String, required: true } },
  { _id: false }
);

const instanceSchema = new mongoose.Schema(
  {
    instanceId: { type: String, required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    type: { type: String, required: true },
    prompt: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    marks: { type: Number, required: true },
    topic: { type: String, required: true },
    topicTitle: { type: String, default: '' },
    difficulty: { type: String, default: 'medium' },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    rubric: { type: mongoose.Schema.Types.Mixed, default: {} },
    mutated: { type: Boolean, default: false },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    instanceId: { type: String, required: true },
    value: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    instanceId: { type: String, required: true },
    topic: { type: String },
    correct: { type: Boolean, default: false },
    awarded: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    correctAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    aiScore: { type: Number },
    aiFeedback: { type: String, default: '' },
  },
  { _id: false }
);

const integrityEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    at: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const examSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    mode: { type: String, enum: ['practice', 'mock', 'exam'], required: true },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'expired'],
      default: 'in_progress',
      index: true,
    },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    questions: { type: [instanceSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
    currentIndex: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 },
    integrityEvents: { type: [integrityEventSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    submittedAt: { type: Date },
    gradedAt: { type: Date },
    autoSubmitted: { type: Boolean, default: false },
    feedback: { type: [feedbackSchema], default: [] },
  },
  { timestamps: true }
);

examSessionSchema.index(
  { student: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
    name: 'one_active_session_per_student',
  }
);

examSessionSchema.index({ student: 1, createdAt: -1 });

export const ExamSession = mongoose.model('ExamSession', examSessionSchema);
