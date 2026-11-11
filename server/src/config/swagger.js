import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const bearerSecurity = [{ bearerAuth: [] }];

const jsonError = {
  'application/json': { schema: { $ref: '#/components/schemas/Error' } },
};

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'UR Digital Examination API',
      version: '1.1.0',
      description:
        'API for the University of Rwanda Digital Exam-Readiness & Practice Platform (ExamLab). ' +
        'All authenticated endpoints expect an `Authorization: Bearer <JWT>` header. ' +
        'Student sessions are single-device (signing in elsewhere invalidates previous tokens), ' +
        'and staff endpoints additionally require the `lecturer` or `admin` role.',
      contact: {
        name: 'UR Digital Exam Platform',
        email: 'support@ur.ac.rw',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            registrationNumber: { type: 'string' },
            studentId: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            program: { type: 'string' },
            department: { type: 'string' },
            college: { type: 'string' },
            campus: { type: 'string' },
            yearOfStudy: { type: 'integer' },
            academicYear: { type: 'string' },
            enrollmentStatus: { type: 'string', enum: ['active', 'inactive', 'suspended', 'graduated'] },
            role: { type: 'string', enum: ['student', 'lecturer', 'admin'] },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            credits: { type: 'integer' },
            semester: { type: 'string', enum: ['I', 'II', 'Annual'] },
            accent: { type: 'string' },
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  title: { type: 'string' },
                  questionCount: { type: 'integer' },
                },
              },
            },
            questionCount: { type: 'integer' },
            assessments: { type: 'array', items: { $ref: '#/components/schemas/Assessment' } },
            attempts: { type: 'integer' },
            average: { type: 'number' },
            best: { type: 'number' },
          },
        },
        Assessment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            course: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            mode: { type: 'string', enum: ['practice', 'mock', 'exam'] },
            durationMinutes: { type: 'integer' },
            questionCount: { type: 'integer' },
            passMark: { type: 'integer' },
            hintsAllowed: { type: 'boolean' },
            published: { type: 'boolean' },
            order: { type: 'integer' },
          },
        },
        ExamSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['in_progress', 'submitted', 'expired'] },
            mode: { type: 'string', enum: ['practice', 'mock', 'exam'] },
            begun: { type: 'boolean' },
            begunAt: { type: 'string', format: 'date-time', nullable: true },
            startedAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time' },
            durationSeconds: { type: 'integer' },
            remainingSeconds: { type: 'integer' },
            currentIndex: { type: 'integer' },
            totalQuestions: { type: 'integer' },
            answeredCount: { type: 'integer' },
            hintsUsed: { type: 'integer' },
            tabSwitchCount: { type: 'integer' },
            maxTabSwitches: { type: 'integer' },
            score: { type: 'number' },
            maxScore: { type: 'number' },
            percentage: { type: 'number' },
            passed: { type: 'boolean' },
            review: {
              type: 'boolean',
              description: 'True once submitted — answers, feedback and explanations are included.',
            },
            result: {
              type: 'object',
              nullable: true,
              description: 'Present after submission (score, percentage, passed, feedback).',
            },
            questions: {
              type: 'array',
              description: 'Question instances; correct answers and explanations are withheld until review.',
              items: {
                type: 'object',
                properties: {
                  instanceId: { type: 'string', format: 'uuid' },
                  type: { type: 'string', enum: ['mcq', 'truefalse', 'numeric', 'short', 'essay'] },
                  prompt: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  marks: { type: 'number' },
                  topic: { type: 'string' },
                  topicTitle: { type: 'string' },
                  difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                  mutated: { type: 'boolean' },
                  answer: { type: 'string' },
                  answered: { type: 'boolean' },
                },
              },
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  instanceId: { type: 'string' },
                  value: { type: 'string' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            theme: {
              type: 'object',
              properties: {
                course: { type: 'object' },
                assessment: { type: 'object' },
              },
            },
          },
        },
        PastPaper: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            college: { type: 'string' },
            department: { type: 'string' },
            program: { type: 'string' },
            yearOfStudy: { type: 'integer' },
            moduleCode: { type: 'string' },
            moduleTitle: { type: 'string' },
            academicYear: { type: 'string' },
            examSession: { type: 'string' },
            semester: { type: 'string' },
            durationMinutes: { type: 'integer' },
            totalMarks: { type: 'integer' },
            description: { type: 'string' },
            topics: { type: 'array', items: { type: 'string' } },
            verified: { type: 'boolean' },
            downloads: { type: 'integer' },
            questionCount: { type: 'integer' },
            sections: {
              type: 'array',
              description: 'Questions are returned WITHOUT correct answers or explanations.',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  title: { type: 'string' },
                  instructions: { type: 'string' },
                  marks: { type: 'number' },
                  questionCount: { type: 'integer' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        number: { type: 'integer' },
                        type: { type: 'string' },
                        prompt: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' } },
                        marks: { type: 'number' },
                        topic: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        LiteracyLesson: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            track: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            level: { type: 'string' },
            durationMinutes: { type: 'integer' },
            sections: { type: 'array', items: { type: 'object' } },
            quiz: { type: 'array', items: { type: 'object' } },
            published: { type: 'boolean' },
            order: { type: 'integer' },
          },
        },
        LiteracyProgress: {
          type: 'object',
          properties: {
            lesson: { type: 'string' },
            completed: { type: 'boolean' },
            completedAt: { type: 'string', format: 'date-time' },
            quizScore: { type: 'number' },
            quizTotal: { type: 'number' },
            lastViewedAt: { type: 'string', format: 'date-time' },
          },
        },
        Credential: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            criteria: { type: 'object' },
            level: { type: 'string' },
            academicYear: { type: 'string' },
            status: { type: 'string', enum: ['issued', 'revoked'] },
            issuedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            issuer: { type: 'string' },
            evidence: { type: 'object' },
          },
        },
      },
    },
    security: bearerSecurity,
    tags: [
      { name: 'System', description: 'Health and diagnostics' },
      { name: 'Authentication', description: 'Student and staff sign-in flows' },
      { name: 'Courses', description: 'Module catalogue scoped to the student record' },
      { name: 'Exams', description: 'Server-timed examination sessions' },
      { name: 'AI', description: 'Socratic hints and engine status' },
      { name: 'Analytics', description: 'Per-student performance analytics' },
      { name: 'Past Papers', description: 'Verified past exam papers and practice sessions' },
      { name: 'Digital Literacy', description: 'Skills lessons and progress tracking' },
      { name: 'Credentials', description: 'Verifiable exam-readiness credentials' },
      { name: 'Staff', description: 'Lecturer/admin role-protected cohort views' },
      { name: 'Landing', description: 'Public landing page content' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['System'],
          security: [],
          responses: {
            '200': {
              description: 'Service status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok', 'degraded'] },
                      database: { type: 'string', enum: ['connected', 'disconnected'] },
                      time: { type: 'string', format: 'date-time' },
                      environment: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/landing': {
        get: {
          summary: 'Public landing page content (hero, steps, features, demo accounts)',
          tags: ['Landing'],
          security: [],
          responses: {
            '200': { description: 'Landing content document' },
          },
        },
      },
      '/auth/verify': {
        post: {
          summary: 'Student login with registration number and password',
          description:
            'Verifies the 9-digit registration number against the student registry, checks the ' +
            'scrypt password hash, and issues a JWT. Bumps the token version, so any previous ' +
            'session for this registration number is locked (single active session per student). ' +
            'Rate limited: 20 requests / 15 minutes per IP.',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['registrationNumber', 'password'],
                  properties: {
                    registrationNumber: {
                      type: 'string',
                      pattern: '^\\d{9}$',
                      description: '9-digit UR registration number',
                    },
                    password: { type: 'string', format: 'password' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      student: { $ref: '#/components/schemas/Student' },
                      access: {
                        type: 'object',
                        properties: {
                          mode: { type: 'string' },
                          singleSession: { type: 'boolean' },
                          notice: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': { description: 'Missing fields or malformed registration number', content: jsonError },
            '401': { description: 'Invalid PIN or password', content: jsonError },
            '403': { description: 'Enrollment not active, or staff account attempting student login', content: jsonError },
            '404': { description: 'Registration number not found', content: jsonError },
            '429': { description: 'Too many verification attempts', content: jsonError },
          },
        },
      },
      '/auth/staff/login': {
        post: {
          summary: 'Staff login step 1 — email and password (sends a 6-digit OTP)',
          description:
            'First factor for lecturer/admin accounts. Sends a one-time code to the registered ' +
            'email (logged to the server console when SMTP is not configured). ' +
            'Rate limited: 10 requests / 15 minutes per IP.',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OTP sent to registered email',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      emailMasked: { type: 'string' },
                      staffId: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid email or password', content: jsonError },
            '403': { description: 'Staff account not active', content: jsonError },
            '429': { description: 'Too many login attempts', content: jsonError },
          },
        },
      },
      '/auth/staff/otp/verify': {
        post: {
          summary: 'Staff login step 2 — verify OTP and receive a staff JWT',
          description:
            'Second factor. The code expires after 10 minutes and allows at most 3 attempts. ' +
            'The issued JWT carries the staff role; staff endpoints validate the role against the ' +
            'database record. Rate limited: 10 requests / 15 minutes per IP.',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['staffId', 'code'],
                  properties: {
                    staffId: { type: 'string', description: 'Staff registration number returned by step 1' },
                    code: { type: 'string', pattern: '^\\d{6}$' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Staff authenticated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      student: { $ref: '#/components/schemas/Student' },
                      access: { type: 'object' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid, expired or exhausted OTP', content: jsonError },
            '404': { description: 'Staff member not found', content: jsonError },
            '429': { description: 'Too many verification attempts', content: jsonError },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Current authenticated profile',
          tags: ['Authentication'],
          responses: {
            '200': {
              description: 'Student or staff profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { student: { $ref: '#/components/schemas/Student' } },
                  },
                },
              },
            },
            '401': { description: 'Missing, invalid, expired or locked session', content: jsonError },
            '403': { description: 'Enrollment not active', content: jsonError },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Sign out and lock all sessions for this account',
          description: 'Bumps the token version so every issued JWT for the account becomes invalid.',
          tags: ['Authentication'],
          responses: {
            '200': { description: 'Signed out' },
            '401': { description: 'Not authenticated', content: jsonError },
          },
        },
      },
      '/courses': {
        get: {
          summary: 'List courses for the authenticated student',
          description: 'Scoped to the student program and year of study from their registry record.',
          tags: ['Courses'],
          responses: {
            '200': {
              description: 'Courses with assessments and the student attempt statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      student: { $ref: '#/components/schemas/Student' },
                      courses: { type: 'array', items: { $ref: '#/components/schemas/Course' } },
                    },
                  },
                },
              },
            },
            '401': { description: 'Not authenticated', content: jsonError },
          },
        },
      },
      '/courses/{courseId}': {
        get: {
          summary: 'Course detail with published assessments and attempt history',
          tags: ['Courses'],
          parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Course, assessments, history and stats',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      course: { $ref: '#/components/schemas/Course' },
                      assessments: { type: 'array', items: { $ref: '#/components/schemas/Assessment' } },
                      history: { type: 'array', items: { type: 'object' } },
                      stats: { type: 'object' },
                    },
                  },
                },
              },
            },
            '403': { description: 'Course not part of the student academic year', content: jsonError },
            '404': { description: 'Course not found', content: jsonError },
          },
        },
      },
      '/exams/start': {
        post: {
          summary: 'Start (or resume) an examination session',
          description:
            'Creates a new server-timed session for a published assessment, or resumes the ' +
            'student single active in-progress session. Question instances are snapshotted per ' +
            'session; parametric questions are re-mutated each attempt. Correct answers are ' +
            'never included in the response.',
          tags: ['Exams'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assessmentId'],
                  properties: {
                    assessmentId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Active session resumed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resumed: { type: 'boolean' },
                      message: { type: 'string' },
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '201': {
              description: 'New session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resumed: { type: 'boolean' },
                      message: { type: 'string' },
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '403': { description: 'Assessment not part of the student academic year', content: jsonError },
            '404': { description: 'Assessment not found or unpublished', content: jsonError },
            '409': { description: 'A different active session already exists', content: jsonError },
            '422': { description: 'Assessment has no published questions', content: jsonError },
          },
        },
      },
      '/exams/active': {
        get: {
          summary: 'Fetch the student active in-progress session (if any)',
          tags: ['Exams'],
          responses: {
            '200': {
              description: 'Active session or null',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      session: {
                        nullable: true,
                        allOf: [{ $ref: '#/components/schemas/ExamSession' }],
                      },
                      expired: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/exams/{sessionId}': {
        get: {
          summary: 'Session details',
          description:
            'Answers, feedback and explanations are only included after the session is submitted ' +
            '(review mode). Expired in-progress sessions are auto-submitted first.',
          tags: ['Exams'],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Session (sanitized until review)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { session: { $ref: '#/components/schemas/ExamSession' } },
                  },
                },
              },
            },
            '404': { description: 'Session not found for this student', content: jsonError },
          },
        },
      },
      '/exams/{sessionId}/begin': {
        post: {
          summary: 'Acknowledge the instructions and start the server clock',
          description:
            'The countdown only starts on begin. Until then the session can be reviewed but no ' +
            'answers can be saved.',
          tags: ['Exams'],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Clock started (or session already begun)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { session: { $ref: '#/components/schemas/ExamSession' } },
                  },
                },
              },
            },
            '409': {
              description: 'Session already submitted',
              content: jsonError,
            },
            '404': { description: 'Session not found', content: jsonError },
          },
        },
      },
      '/exams/{sessionId}/clock': {
        get: {
          summary: 'Server time sync for the countdown',
          description:
            'Polled by the client to stay in sync with the authoritative server clock. ' +
            'Expired sessions are auto-submitted on read.',
          tags: ['Exams'],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Server time and session state',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      serverNow: { type: 'string', format: 'date-time' },
                      endsAt: { type: 'string', format: 'date-time' },
                      remainingSeconds: { type: 'integer' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Session not found', content: jsonError },
          },
        },
      },
      '/exams/{sessionId}/answer': {
        patch: {
          summary: 'Save or update one answer',
          description:
            'Answers are capped at 6000 characters. Rejected if the session was not begun, was ' +
            'submitted, or the server clock ran out (which triggers auto-submit).',
          tags: ['Exams'],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['instanceId'],
                  properties: {
                    instanceId: { type: 'string', format: 'uuid' },
                    value: { type: 'string', maxLength: 6000 },
                    currentIndex: { type: 'integer', minimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Answer saved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      savedAt: { type: 'string', format: 'date-time' },
                      serverNow: { type: 'string', format: 'date-time' },
                      remainingSeconds: { type: 'integer' },
                      answeredCount: { type: 'integer' },
                      totalQuestions: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Session or question not found', content: jsonError },
            '409': { description: 'Session submitted or not begun yet', content: jsonError },
          },
        },
      },
      '/exams/{sessionId}/submit': {
        post: {
          summary: 'Submit the session for grading',
          description:
            'Accepts an optional final answers array (max 200 entries), then grades objective, ' +
            'numeric, short-answer and essay questions (LLM with rubric when configured, ' +
            'otherwise deterministic local grading). Returns the session in review mode.',
          tags: ['Exams'],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answers: {
                      type: 'array',
                      maxItems: 200,
                      items: {
                        type: 'object',
                        required: ['instanceId', 'value'],
                        properties: {
                          instanceId: { type: 'string', format: 'uuid' },
                          value: { type: 'string', maxLength: 6000 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Session graded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { session: { $ref: '#/components/schemas/ExamSession' } },
                  },
                },
              },
            },
            '404': { description: 'Session not found', content: jsonError },
          },
        },
      },
      '/exams/{sessionId}/integrity': {
        post: {
          summary: 'Report an integrity event (tab switch)',
          description:
            'Records a client-reported integrity event. Repeated tab switches (default 3, ' +
            'configurable via MAX_TAB_SWITCHES) trigger an automatic submission of the session.',
          tags: ['Exams'],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'tab_hidden', maxLength: 40 },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Integrity event processed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      action: { type: 'string', enum: ['flagged', 'logged', 'auto_submitted', 'already_submitted'] },
                      tabSwitchCount: { type: 'integer' },
                      remainingStrikes: { type: 'integer' },
                      maxTabSwitches: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Session not found', content: jsonError },
          },
        },
      },
      '/ai/status': {
        get: {
          summary: 'AI engine status',
          description: 'Reports whether hints and essay grading use a configured LLM or the offline local heuristics engine.',
          tags: ['AI'],
          responses: {
            '200': {
              description: 'Engine status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      engine: { type: 'string', enum: ['llm', 'local-heuristics'] },
                      model: { type: 'string' },
                      features: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ai/hint': {
        post: {
          summary: 'Socratic hint for a question in an active session',
          description:
            'Max 12 hints per session; only in practice mode (or when the assessment allows hints). ' +
            'Hints guide the method without revealing the answer.',
          tags: ['AI'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sessionId', 'instanceId'],
                  properties: {
                    sessionId: { type: 'string' },
                    instanceId: { type: 'string', format: 'uuid' },
                    hintLevel: { type: 'integer', minimum: 0, maximum: 2 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Hint generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      hint: { type: 'string' },
                      source: { type: 'string', enum: ['llm', 'local'] },
                      hintLevel: { type: 'integer' },
                      hintsUsed: { type: 'integer' },
                      hintsRemaining: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '403': { description: 'Hints not allowed in this mode', content: jsonError },
            '404': { description: 'Session or question not found', content: jsonError },
            '409': { description: 'Session already submitted', content: jsonError },
            '429': { description: 'Hint limit reached for this session', content: jsonError },
          },
        },
      },
      '/analytics/overview': {
        get: {
          summary: 'Student performance overview',
          description: 'Aggregate stats, course performance, weak topics, and the recent attempt trend.',
          tags: ['Analytics'],
          responses: {
            '200': {
              description: 'Overview data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      stats: { type: 'object' },
                      coursePerformance: { type: 'array', items: { type: 'object' } },
                      weakTopics: { type: 'array', items: { type: 'object' } },
                      trend: { type: 'array', items: { type: 'object' } },
                      recentAttempts: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/analytics/diagnostics': {
        get: {
          summary: 'Weak/strong topic diagnostics with an AI study plan',
          tags: ['Analytics'],
          responses: {
            '200': {
              description: 'Diagnostics data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      weakTopics: { type: 'array', items: { type: 'object' } },
                      strongTopics: { type: 'array', items: { type: 'object' } },
                      narrative: { type: 'string' },
                      engine: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/analytics/courses/{courseId}/history': {
        get: {
          summary: 'Attempt history for one course',
          tags: ['Analytics'],
          parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Attempt history',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { history: { type: 'array', items: { type: 'object' } } },
                  },
                },
              },
            },
          },
        },
      },
      '/past-papers': {
        get: {
          summary: 'List verified past papers for the student year and programme',
          tags: ['Past Papers'],
          responses: {
            '200': {
              description: 'Past paper summaries',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      pastPapers: { type: 'array', items: { $ref: '#/components/schemas/PastPaper' } },
                      student: { $ref: '#/components/schemas/Student' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/past-papers/{slug}': {
        get: {
          summary: 'Past paper detail',
          description:
            'Full sectioned paper WITHOUT correct answers or explanations — those are only ' +
            'revealed after attempting the paper as a graded practice session.',
          tags: ['Past Papers'],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Past paper detail',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { pastPaper: { $ref: '#/components/schemas/PastPaper' } },
                  },
                },
              },
            },
            '403': { description: 'Paper not part of the student academic year', content: jsonError },
            '404': { description: 'Past paper not found', content: jsonError },
          },
        },
      },
      '/past-papers/{slug}/start': {
        post: {
          summary: 'Start a timed practice session from a past paper',
          description:
            'Creates (or reuses) a practice course and assessment for the paper, snapshots its ' +
            'questions into a new server-timed session, and enforces the single-active-session rule.',
          tags: ['Past Papers'],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '201': {
              description: 'Practice session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resumed: { type: 'boolean' },
                      message: { type: 'string' },
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '403': { description: 'Paper not part of the student academic year', content: jsonError },
            '404': { description: 'Past paper not found', content: jsonError },
            '409': { description: 'An active session already exists', content: jsonError },
            '422': { description: 'Paper has no practice questions', content: jsonError },
          },
        },
      },
      '/literacy': {
        get: {
          summary: 'List published digital literacy lessons',
          tags: ['Digital Literacy'],
          responses: {
            '200': {
              description: 'Lessons grouped by track',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { lessons: { type: 'array', items: { $ref: '#/components/schemas/LiteracyLesson' } } },
                  },
                },
              },
            },
          },
        },
      },
      '/literacy/progress': {
        get: {
          summary: 'Lesson progress map for the student',
          tags: ['Digital Literacy'],
          responses: {
            '200': {
              description: 'Progress keyed by lesson id',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: { $ref: '#/components/schemas/LiteracyProgress' },
                  },
                },
              },
            },
          },
        },
      },
      '/literacy/{slug}': {
        get: {
          summary: 'Lesson content (sections, tasks, quiz)',
          tags: ['Digital Literacy'],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Lesson content',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { lesson: { $ref: '#/components/schemas/LiteracyLesson' } },
                  },
                },
              },
            },
            '404': { description: 'Lesson not found', content: jsonError },
          },
        },
      },
      '/literacy/{slug}/progress': {
        post: {
          summary: 'Upsert lesson completion and quiz score',
          tags: ['Digital Literacy'],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['completed'],
                  properties: {
                    completed: { type: 'boolean' },
                    quizScore: { type: 'number', minimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Progress recorded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { progress: { $ref: '#/components/schemas/LiteracyProgress' } },
                  },
                },
              },
            },
            '404': { description: 'Lesson not found', content: jsonError },
          },
        },
      },
      '/credentials/eligibility': {
        get: {
          summary: 'Annual exam-readiness credential eligibility',
          description:
            'Evaluates the annual criteria (graded attempts, average, pass rate, best score, study minutes).',
          tags: ['Credentials'],
          parameters: [
            { name: 'academicYear', in: 'query', schema: { type: 'string' }, description: 'Defaults to the student record academic year' },
          ],
          responses: {
            '200': { description: 'Eligibility evaluation with per-criterion checks' },
          },
        },
      },
      '/credentials/issue': {
        post: {
          summary: 'Issue the annual credential (if eligible)',
          description:
            'Issues one signed, verifiable credential per academic year. The credential payload is ' +
            'signed with HMAC-SHA256 and can be verified publicly by code.',
          tags: ['Credentials'],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    academicYear: { type: 'string', description: 'Defaults to the student record academic year' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Credential issued',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      credential: { $ref: '#/components/schemas/Credential' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '409': { description: 'Not eligible or already issued for this year', content: jsonError },
          },
        },
      },
      '/credentials/mine': {
        get: {
          summary: 'Credentials issued to the student',
          tags: ['Credentials'],
          responses: {
            '200': {
              description: 'Issued credentials',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { credentials: { type: 'array', items: { $ref: '#/components/schemas/Credential' } } },
                  },
                },
              },
            },
          },
        },
      },
      '/credentials/verify/{code}': {
        get: {
          summary: 'Publicly verify a credential by code',
          description:
            'Open endpoint for employers and institutions. Validates the HMAC signature over the ' +
            'credential payload before reporting it as valid.',
          tags: ['Credentials'],
          security: [],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Verification result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      credential: { $ref: '#/components/schemas/Credential' },
                      student: { $ref: '#/components/schemas/Student' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Credential not found', content: jsonError },
          },
        },
      },
      '/staff/overview': {
        get: {
          summary: 'Cohort readiness overview',
          description:
            'Role-protected (lecturer/admin). Lecturers see their own department/programme ' +
            'cohort; admins see the whole institution.',
          tags: ['Staff'],
          responses: {
            '200': {
              description: 'Cohort statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      staff: { $ref: '#/components/schemas/Student' },
                      cohort: {
                        type: 'object',
                        properties: {
                          scope: { type: 'string' },
                          students: { type: 'integer' },
                          activeStudents: { type: 'integer' },
                          courses: { type: 'integer' },
                          gradedAttempts: { type: 'integer' },
                          averageScore: { type: 'number' },
                          passRate: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '403': { description: 'Authenticated but not lecturer/admin', content: jsonError },
          },
        },
      },
      '/staff/students': {
        get: {
          summary: 'Student roster for the staff member scope',
          description: 'Role-protected (lecturer/admin). Lecturers see their cohort; admins see everyone.',
          tags: ['Staff'],
          responses: {
            '200': {
              description: 'Roster records',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      students: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            registrationNumber: { type: 'string' },
                            fullName: { type: 'string' },
                            email: { type: 'string' },
                            program: { type: 'string' },
                            department: { type: 'string' },
                            yearOfStudy: { type: 'integer' },
                            enrollmentStatus: { type: 'string' },
                            academicYear: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '403': { description: 'Authenticated but not lecturer/admin', content: jsonError },
          },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'UR Digital Exam API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    })
  );

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
  });
}
