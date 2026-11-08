import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    program: { type: String, required: true, index: true },
    college: { type: String, default: 'College of Science and Technology' },
    yearOfStudy: { type: Number, required: true, index: true },
    credits: { type: Number, default: 10 },
    semester: { type: String, enum: ['I', 'II', 'Annual'], default: 'I' },
    topics: [
      {
        key: { type: String, required: true },
        title: { type: String, required: true },
      },
    ],
    accent: { type: String, default: '#2563eb' },
  },
  { timestamps: true }
);

courseSchema.index({ program: 1, yearOfStudy: 1 });

export const Course = mongoose.model('Course', courseSchema);
