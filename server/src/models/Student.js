import crypto from 'node:crypto';
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    studentId: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    program: { type: String, required: true },
    department: { type: String },
    college: { type: String, default: 'College of Science and Technology' },
    campus: { type: String, default: 'Kigali' },
    yearOfStudy: { type: Number, required: true, min: 1, max: 6 },
    academicYear: { type: String, required: true },
    enrollmentStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'graduated'],
      default: 'active',
    },
    role: {
      type: String,
      enum: ['student', 'lecturer', 'admin'],
      default: 'student',
      index: true,
    },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

function hashPassword(candidate) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(candidate, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyHash(candidate, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hash] = stored.split(':');
  const computed = crypto.scryptSync(candidate, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

studentSchema.pre('save', function (next) {
  if (!this.isModified('passwordHash')) return next();
  const candidate = String(this.passwordHash || '').trim();
  if (candidate.startsWith('scrypt:') || candidate.startsWith('$2b$') || candidate.startsWith('$2a$')) return next();
  this.passwordHash = hashPassword(candidate);
  next();
});

studentSchema.methods.verifyPassword = function verifyPassword(candidate) {
  const stored = this.passwordHash;
  if (stored && (stored.startsWith('$2b$') || stored.startsWith('$2a$'))) {
    return false;
  }
  return verifyHash(candidate, stored);
};

studentSchema.methods.toProfile = function toProfile() {
  return {
    registrationNumber: this.registrationNumber,
    studentId: this.studentId,
    fullName: this.fullName,
    email: this.email,
    program: this.program,
    department: this.department,
    college: this.college,
    campus: this.campus,
    yearOfStudy: this.yearOfStudy,
    academicYear: this.academicYear,
    enrollmentStatus: this.enrollmentStatus,
    role: this.role,
  };
};

export const Student = mongoose.model('Student', studentSchema);