import jwt from 'jsonwebtoken';
import { Student } from '../models/Student.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required. Please sign in with your registration number.');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
    }

    const student = await Student.findById(payload.sub);
    if (!student) {
      throw new ApiError(401, 'Student record no longer exists.');
    }

    if (payload.v !== student.tokenVersion) {
      throw new ApiError(
        401,
        'This registration number was used to sign in on another device. Your previous session was locked.',
        { code: 'SESSION_LOCKED' }
      );
    }

    if (student.enrollmentStatus !== 'active') {
      throw new ApiError(403, 'Your enrollment is not active.');
    }

    req.student = student;
    req.auth = payload;
    next();
  } catch (error) {
    next(error);
  }
}

// Role-based authorization. Must run after `authenticate`; checks the role
// from the database record (not the JWT payload) so revoked or altered
// roles take effect immediately.
export function requireRole(...roles) {
  if (!roles.length) throw new Error('requireRole requires at least one role.');
  return (req, _res, next) => {
    const role = req.student?.role;
    if (!role) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!roles.includes(role)) {
      return next(
        new ApiError(403, 'You do not have permission to access this resource.', {
          code: 'FORBIDDEN_ROLE',
          requiredRoles: roles,
        })
      );
    }
    next();
  };
}
