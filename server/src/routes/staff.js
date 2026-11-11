import express from 'express';
import { Student } from '../models/Student.js';
import { Course } from '../models/Course.js';
import { ExamSession } from '../models/ExamSession.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { round1 } from '../utils/math.js';

const router = express.Router();

// Staff-only area: lecturers and admins, enforced by role-based
// authorization on top of authentication.
router.use(authenticate, requireRole('lecturer', 'admin'));

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    // Lecturers see their own department/programme cohort; admins see all.
    const isAdmin = req.student.role === 'admin';
    const cohortFilter = isAdmin
      ? {}
      : {
          $or: [
            { department: req.student.department },
            { program: req.student.program },
          ],
        };
    const courseIds = isAdmin
      ? null
      : await Course.find({ program: req.student.program }).distinct('_id');

    const [studentCount, activeStudents, sessions, courseCount] = await Promise.all([
      Student.countDocuments({ role: 'student', ...cohortFilter }),
      Student.countDocuments({ role: 'student', enrollmentStatus: 'active', ...cohortFilter }),
      ExamSession.aggregate([
        {
          $match: {
            status: { $in: ['submitted', 'expired'] },
            ...(courseIds ? { course: { $in: courseIds } } : {}),
          },
        },
        {
          $group: {
            _id: null,
            attempts: { $sum: 1 },
            average: { $avg: '$percentage' },
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
          },
        },
      ]),
      Course.countDocuments(isAdmin ? {} : { program: req.student.program }),
    ]);

    const sessionStats = sessions[0] || { attempts: 0, average: 0, passed: 0 };

    res.json({
      staff: req.student.toProfile(),
      cohort: {
        scope: isAdmin ? 'institution-wide' : req.student.program,
        students: studentCount,
        activeStudents,
        courses: courseCount,
        gradedAttempts: sessionStats.attempts,
        averageScore: sessionStats.average ? round1(sessionStats.average) : 0,
        passRate: sessionStats.attempts
          ? round1((sessionStats.passed / sessionStats.attempts) * 100)
          : 0,
      },
    });
  })
);

router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const filter = { role: 'student' };
    if (req.student.role !== 'admin') {
      filter.$or = [
        { department: req.student.department },
        { program: req.student.program },
      ];
    }

    const students = await Student.find(filter)
      .sort({ program: 1, yearOfStudy: 1, fullName: 1 })
      .select('registrationNumber fullName email program department yearOfStudy enrollmentStatus academicYear')
      .lean();

    res.json({ students });
  })
);

export default router;
