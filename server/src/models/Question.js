import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const rubricSchema = new mongoose.Schema(
  {
    modelAnswer: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    guidance: { type: String, default: '' },
    minWords: { type: Number, default: 40 },
  },
  { _id: false }
);

const variableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    step: { type: Number, default: 1 },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    type: {
      type: String,
      enum: ['mcq', 'truefalse', 'numeric', 'short', 'essay'],
      required: true,
    },
    prompt: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    correctAnswer: { type: String, default: '' },
    answerFormula: { type: String, default: '' },
    variables: { type: [variableSchema], default: [] },
    scenarios: { type: [String], default: [] },
    marks: { type: Number, required: true, min: 0 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic: { type: String, required: true, index: true },
    explanation: { type: String, default: '' },
    rubric: { type: rubricSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionSchema.index({ course: 1, topic: 1, type: 1 });

export const Question = mongoose.model('Question', questionSchema);
