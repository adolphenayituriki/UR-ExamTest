import mongoose from 'mongoose';

const literacyProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'LiteracyLesson', required: true },
    completed: { type: Boolean, default: false },
    quizScore: { type: Number, default: 0 },
    quizTotal: { type: Number, default: 0 },
    quizAttempts: { type: Number, default: 0 },
    completedAt: { type: Date },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

literacyProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

export const LiteracyProgress = mongoose.model('LiteracyProgress', literacyProgressSchema);
