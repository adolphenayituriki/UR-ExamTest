import { Student } from '../models/Student.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';

export function normalizeRegistrationNumber(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

async function verifyWithInstitutionalApi(registrationNumber) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(env.urRegistryApi, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(env.urRegistryKey ? { 'x-api-key': env.urRegistryKey } : {}),
      },
      body: JSON.stringify({ registrationNumber }),
    });

    if (response.status === 404) throw new ApiError(404, 'Registration number was not found in the UR registry.');
    if (response.status === 403) throw new ApiError(403, 'This student is not actively enrolled at the University of Rwanda.');
    if (!response.ok) throw new ApiError(502, 'The UR registry service is temporarily unavailable.');
    const payload = await response.json();
    const record = payload?.student || payload?.data || payload;
    if (!record || record.enrollmentStatus !== 'active') throw new ApiError(403, 'This student is not actively enrolled at the University of Rwanda.');
    const profile = {
      registrationNumber,
      studentId: String(record.studentId || registrationNumber),
      fullName: String(record.fullName || record.name || 'UR Student'),
      email: record.email || '',
      program: String(record.program || ''),
      department: record.department || '',
      college: record.college || 'College of Science and Technology',
      campus: record.campus || 'Kigali',
      yearOfStudy: Number(record.yearOfStudy || 1),
      academicYear: String(record.academicYear || '2025/2026'),
      enrollmentStatus: 'active',
    };
    if (!profile.program) throw new ApiError(502, 'The UR registry returned an incomplete student profile.');
    return Student.findOneAndUpdate(
      { registrationNumber },
      {
        $set: profile,
        // First-time accounts sourced from the institutional API receive the
        // registration number as their initial PIN. The registry owner should
        // rotate it after provisioning.
        $setOnInsert: { passwordHash: hashPassword(registrationNumber) },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyRegistrationNumber(rawRegistrationNumber) {
  const registrationNumber = normalizeRegistrationNumber(rawRegistrationNumber);
  if (!registrationNumber) throw new ApiError(400, 'Registration number is required.');
  if (!/^\d{9}$/.test(registrationNumber)) throw new ApiError(400, 'Registration number must be exactly 9 digits.');
  const student = env.urRegistryApi ? await verifyWithInstitutionalApi(registrationNumber) : await Student.findOne({ registrationNumber });
  if (!student) throw new ApiError(404, 'Registration number is not recognised in the UR student registry. Account creation is not permitted.');
  if (student.enrollmentStatus !== 'active') throw new ApiError(403, 'Your enrollment is not active. Access to the examination platform has been blocked.');
  return student;
}