import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ['practice', 'mock', 'exam'],
      required: true,
      index: true,
    },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, min: 1 },
    questionCount: { type: Number, required: true, min: 1 },
    passMark: { type: Number, default: 50, min: 0, max: 100 },
    hintsAllowed: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

assessmentSchema.index({ course: 1, mode: 1, order: 1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
