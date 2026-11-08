import crypto from 'node:crypto';
import { ExamSession } from '../models/ExamSession.js';
import { Credential } from '../models/Credential.js';
import { env } from '../config/env.js';
import { round1 } from '../utils/math.js';

export const CREDENTIAL_CRITERIA = {
  gradedAttempts: 5,
  averagePercentage: 70,
  passRate: 80,
  bestPercentage: 80,
  studyMinutes: 45,
};

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function signPayload(payload) {
  return crypto.createHmac('sha256', env.jwtSecret).update(canonicalize(payload)).digest('hex');
}

export async function computeEligibility(student, academicYear) {
  const [sessions, existing] = await Promise.all([
    ExamSession.find({
      student: student._id,
      status: { $in: ['submitted', 'expired'] },
    })
      .select('score maxScore percentage passed durationSeconds mode')
      .lean(),
    Credential.findOne({
      student: student._id,
      academicYear,
      status: 'issued',
    }).lean(),
  ]);

  const attempts = sessions.length;
  const percentages = sessions.map((session) => session.percentage || 0);
  const averagePercentage = percentages.length
    ? round1(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
    : 0;
  const bestPercentage = percentages.length ? round1(Math.max(...percentages)) : 0;
  const passed = sessions.filter((session) => session.passed).length;
  const passRate = attempts ? round1((passed / attempts) * 100) : 0;
  const studyMinutes = Math.round(
    sessions.reduce((sum, session) => sum + (session.durationSeconds || 0) / 60, 0)
  );
  const hasSimulation = sessions.some((session) => ['mock', 'exam'].includes(session.mode));

  const checks = [
    {
      key: 'gradedAttempts',
      label: 'Graded attempts',
      value: attempts,
      target: CREDENTIAL_CRITERIA.gradedAttempts,
      met: attempts >= CREDENTIAL_CRITERIA.gradedAttempts,
    },
    {
      key: 'averagePercentage',
      label: 'Average score',
      value: averagePercentage,
      target: CREDENTIAL_CRITERIA.averagePercentage,
      met: averagePercentage >= CREDENTIAL_CRITERIA.averagePercentage,
    },
    {
      key: 'passRate',
      label: 'Pass rate',
      value: passRate,
      target: CREDENTIAL_CRITERIA.passRate,
      met: passRate >= CREDENTIAL_CRITERIA.passRate,
    },
    {
      key: 'bestPercentage',
      label: 'Best result',
      value: bestPercentage,
      target: CREDENTIAL_CRITERIA.bestPercentage,
      met: bestPercentage >= CREDENTIAL_CRITERIA.bestPercentage,
    },
    {
      key: 'studyMinutes',
      label: 'Time under exam conditions',
      value: studyMinutes,
      target: CREDENTIAL_CRITERIA.studyMinutes,
      met: studyMinutes >= CREDENTIAL_CRITERIA.studyMinutes,
    },
    {
      key: 'simulation',
      label: 'At least one mock or final simulation',
      value: hasSimulation ? 'Yes' : 'No',
      target: 'Required',
      met: hasSimulation,
    },
  ];

  return {
    academicYear,
    eligible: checks.every((check) => check.met),
    alreadyIssued: Boolean(existing),
    credential: existing ? summarizeCredential(existing) : null,
    checks,
    metrics: {
      gradedAttempts: attempts,
      averagePercentage,
      bestPercentage,
      passRate,
      studyMinutes,
    },
  };
}

function summarizeCredential(credential) {
  return {
    id: credential._id,
    code: credential.code,
    title: credential.title,
    description: credential.description,
    criteria: credential.criteria,
    level: credential.level,
    academicYear: credential.academicYear,
    status: credential.status,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt,
    issuer: credential.issuer,
    evidence: credential.evidence,
    signature: credential.signature,
  };
}

export function buildBadge({ student, code, title, description, criteria, academicYear, evidence }) {
  const issuedAt = new Date().toISOString();
  const subjectId = `urn:ur-examlab:student:${student.registrationNumber}`;
  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `urn:ur-examlab:credential:${code}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: title,
    description,
    issuer: {
      id: 'https://examlab.ur.ac.rw',
      type: 'Profile',
      name: 'University of Rwanda ExamLab',
      url: 'https://examlab.ur.ac.rw',
    },
    validFrom: issuedAt,
    credentialSubject: {
      id: subjectId,
      type: 'AchievementSubject',
      name: student.fullName,
      achievement: {
        id: 'https://examlab.ur.ac.rw/achievements/annual-exam-readiness',
        type: 'Achievement',
        name: title,
        description,
        criteria: { narrative: criteria },
      },
      evidence: [
        {
          id: `urn:ur-examlab:evidence:${code}`,
          type: 'Evidence',
          name: `${academicYear} performance record`,
          narrative: `Verified platform record: ${evidence.gradedAttempts} graded attempts, ${evidence.averagePercentage}% average, ${evidence.passRate}% pass rate.`,
        },
      ],
    },
    proof: {
      type: 'HmacSha256',
      created: issuedAt,
      verificationMethod: 'urn:ur-examlab:key:annual-credential',
    },
  };
}

export async function issueCredential(student, academicYear) {
  const eligibility = await computeEligibility(student, academicYear);
  if (eligibility.alreadyIssued) {
    throw Object.assign(new Error('A credential has already been issued for this academic year.'), {
      status: 409,
    });
  }
  if (!eligibility.eligible) {
    throw Object.assign(
      new Error('The student has not yet met every annual credential criterion.'),
      { status: 422, details: { checks: eligibility.checks } }
    );
  }

  const code = `UR-EXAM-${academicYear.replace('/', '-')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const title = `UR ExamLab Annual Exam-Readiness Credential ${academicYear}`;
  const description =
    'Awarded to a University of Rwanda student who sustained strong, verified performance across timed computer-based practice and simulation sessions.';
  const criteria =
    'At least 5 graded sessions, an average of 70% or more, a pass rate of at least 80%, a best result of at least 80%, at least 45 minutes under exam conditions, and at least one mock or final simulation.';
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);

  const badge = buildBadge({
    student,
    code,
    title,
    description,
    criteria,
    academicYear,
    evidence: eligibility.metrics,
  });
  const signature = signPayload({
    code,
    subject: student.registrationNumber,
    issuedAt: issuedAt.toISOString(),
    evidence: eligibility.metrics,
    achievement: badge.credentialSubject.achievement.id,
  });

  const credential = await Credential.create({
    student: student._id,
    code,
    title,
    description,
    criteria,
    level: 'Annual recognition',
    academicYear,
    status: 'issued',
    issuedAt,
    expiresAt,
    issuer: {
      name: 'University of Rwanda ExamLab',
      url: 'https://examlab.ur.ac.rw',
    },
    evidence: eligibility.metrics,
    badge: { ...badge, proof: { ...badge.proof, proofValue: signature } },
    signature,
  });

  return summarizeCredential(credential);
}

export async function verifyCredential(code) {
  const credential = await Credential.findOne({ code: String(code || '').trim().toUpperCase() })
    .populate('student', 'fullName registrationNumber program yearOfStudy college')
    .lean();
  if (!credential) {
    return { valid: false, reason: 'Credential not found.' };
  }

  const expected = signPayload({
    code: credential.code,
    subject: credential.student?.registrationNumber,
    issuedAt: new Date(credential.issuedAt).toISOString(),
    evidence: credential.evidence,
    achievement: `https://examlab.ur.ac.rw/achievements/annual-exam-readiness`,
  });

  const signatureValid = expected === credential.signature;
  const notRevoked = credential.status === 'issued';
  const notExpired = !credential.expiresAt || new Date(credential.expiresAt) > new Date();

  return {
    valid: signatureValid && notRevoked && notExpired,
    signatureValid,
    notRevoked,
    notExpired,
    reason: !signatureValid
      ? 'Signature does not match the issued record.'
      : !notRevoked
        ? 'Credential has been revoked.'
        : !notExpired
          ? 'Credential has expired.'
          : 'Credential is authentic and current.',
    credential: {
      code: credential.code,
      title: credential.title,
      description: credential.description,
      criteria: credential.criteria,
      level: credential.level,
      academicYear: credential.academicYear,
      status: credential.status,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      issuer: credential.issuer,
      evidence: credential.evidence,
      student: credential.student
        ? {
            fullName: credential.student.fullName,
            registrationNumber: credential.student.registrationNumber,
            program: credential.student.program,
            yearOfStudy: credential.student.yearOfStudy,
            college: credential.student.college,
          }
        : null,
      badge: credential.badge,
    },
  };
}
