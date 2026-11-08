import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    criteria: { type: String, default: '' },
    level: { type: String, default: 'Annual recognition' },
    academicYear: { type: String, required: true, index: true },
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued' },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    issuer: {
      name: { type: String, default: 'University of Rwanda ExamLab' },
      url: { type: String, default: 'https://examlab.ur.ac.rw' },
    },
    evidence: {
      gradedAttempts: { type: Number, default: 0 },
      averagePercentage: { type: Number, default: 0 },
      bestPercentage: { type: Number, default: 0 },
      passRate: { type: Number, default: 0 },
      studyMinutes: { type: Number, default: 0 },
    },
    badge: { type: mongoose.Schema.Types.Mixed, default: {} },
    signature: { type: String, default: '' },
  },
  { timestamps: true }
);

credentialSchema.index({ student: 1, academicYear: 1 }, { unique: true });

export const Credential = mongoose.model('Credential', credentialSchema);
