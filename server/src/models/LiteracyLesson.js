import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    body: { type: String, required: true },
    tips: { type: [String], default: [] },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: {
      type: [
        {
          key: { type: String, required: true },
          text: { type: String, required: true },
        },
      ],
      default: [],
    },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const literacyLessonSchema = new mongoose.Schema(
  {
    track: {
      type: String,
      enum: ['files', 'documents', 'presentations', 'spreadsheets', 'cloud', 'email', 'security'],
      required: true,
      index: true,
    },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    durationMinutes: { type: Number, default: 15 },
    objectives: { type: [String], default: [] },
    sections: { type: [sectionSchema], default: [] },
    practiceTask: { type: String, default: '' },
    quiz: { type: [quizQuestionSchema], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

literacyLessonSchema.index({ track: 1, order: 1 });

export const LiteracyLesson = mongoose.model('LiteracyLesson', literacyLessonSchema);
