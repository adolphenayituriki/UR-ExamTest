import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  { key: { type: String, required: true }, text: { type: String, required: true } },
  { _id: false }
);

const paperQuestionSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    type: {
      type: String,
      enum: ['mcq', 'truefalse', 'numeric', 'short', 'essay'],
      default: 'mcq',
    },
    prompt: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    correctAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    marks: { type: Number, default: 1 },
    topic: { type: String, default: '' },
  },
  { _id: false }
);

const paperSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    instructions: { type: String, default: '' },
    marks: { type: Number, default: 0 },
    questions: { type: [paperQuestionSchema], default: [] },
  },
  { _id: false }
);

const pastPaperSchema = new mongoose.Schema(
  {
    college: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    program: { type: String, required: true, index: true },
    yearOfStudy: { type: Number, required: true, index: true },
    moduleCode: { type: String, required: true, index: true, uppercase: true, trim: true },
    moduleTitle: { type: String, required: true },
    academicYear: { type: String, required: true, index: true },
    examSession: { type: String, default: 'Final Examination' },
    semester: { type: String, enum: ['I', 'II', 'Annual'], default: 'I' },
    durationMinutes: { type: Number, default: 120 },
    totalMarks: { type: Number, default: 0 },
    description: { type: String, default: '' },
    topics: { type: [String], default: [] },
    sections: { type: [paperSectionSchema], default: [] },
    verified: { type: Boolean, default: true },
    source: { type: String, default: 'UR past-paper archive' },
    downloads: { type: Number, default: 0 },
    fileUrl: { type: String, default: '' },
    slug: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

pastPaperSchema.index({ program: 1, yearOfStudy: 1, moduleCode: 1 });
pastPaperSchema.index({ moduleTitle: 'text', moduleCode: 'text', description: 'text' });

pastPaperSchema.methods.toSummary = function toSummary() {
  const questionCount = (this.sections || []).reduce(
    (sum, section) => sum + (section.questions?.length || 0),
    0
  );
  return {
    id: this._id,
    slug: this.slug,
    college: this.college,
    department: this.department,
    program: this.program,
    yearOfStudy: this.yearOfStudy,
    moduleCode: this.moduleCode,
    moduleTitle: this.moduleTitle,
    academicYear: this.academicYear,
    examSession: this.examSession,
    semester: this.semester,
    durationMinutes: this.durationMinutes,
    totalMarks: this.totalMarks,
    description: this.description,
    topics: this.topics,
    verified: this.verified,
    downloads: this.downloads,
    questionCount,
    sections: (this.sections || []).map((section) => ({
      key: section.key,
      title: section.title,
      marks: section.marks,
      questionCount: section.questions?.length || 0,
    })),
  };
};

export const PastPaper = mongoose.model('PastPaper', pastPaperSchema);
