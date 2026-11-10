import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'UR Digital Examination API',
      version: '1.0.0',
      description: 'API for the University of Rwanda Digital Exam-Readiness & Practice Platform',
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
            _id: { type: 'string' },
            registrationNumber: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            department: { type: 'string' },
            program: { type: 'string' },
            yearOfStudy: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            title: { type: 'string' },
            department: { type: 'string' },
            yearOfStudy: { type: 'integer' },
            credits: { type: 'integer' },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Assessment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            course: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['formative', 'summative', 'practice', 'past-paper'] },
            durationMinutes: { type: 'integer' },
            passMark: { type: 'integer' },
            maxTabSwitches: { type: 'integer' },
            shuffleQuestions: { type: 'boolean' },
            shuffleOptions: { type: 'boolean' },
            isPublished: { type: 'boolean' },
            academicYear: { type: 'string' },
            semester: { type: 'string', enum: ['Semester 1', 'Semester 2', 'Summer'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            assessment: { type: 'string' },
            text: { type: 'string' },
            type: { type: 'string', enum: ['single-choice', 'multiple-choice', 'short-answer', 'essay', 'true-false'] },
            marks: { type: 'integer' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  isCorrect: { type: 'boolean' },
                },
              },
            },
            correctAnswer: { type: 'string' },
            explanation: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ExamSession: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            assessment: { type: 'string' },
            mode: { type: 'string', enum: ['practice', 'summative', 'formative'] },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'expired'] },
            currentIndex: { type: 'integer' },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  instanceId: { type: 'string' },
                  value: { type: 'string' },
                  isCorrect: { type: 'boolean' },
                  marksAwarded: { type: 'number' },
                },
              },
            },
            score: { type: 'number' },
            totalMarks: { type: 'integer' },
            percentage: { type: 'number' },
            passed: { type: 'boolean' },
            begun: { type: 'boolean' },
            startedAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time' },
            durationSeconds: { type: 'integer' },
            tabSwitchCount: { type: 'integer' },
            maxTabSwitches: { type: 'integer' },
            hintsUsed: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PastPaper: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            slug: { type: 'string' },
            moduleCode: { type: 'string' },
            moduleTitle: { type: 'string' },
            description: { type: 'string' },
            academicYear: { type: 'string' },
            examSession: { type: 'string' },
            yearOfStudy: { type: 'integer' },
            semester: { type: 'string' },
            durationMinutes: { type: 'integer' },
            questionCount: { type: 'integer' },
            topics: { type: 'array', items: { type: 'string' } },
            isPublished: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LiteracyLesson: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            slug: { type: 'string' },
            track: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            durationMinutes: { type: 'integer' },
            order: { type: 'integer' },
            isPublished: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LiteracyProgress: {
          type: 'object',
          properties: {
            lessonId: { type: 'string' },
            completed: { type: 'boolean' },
            completedAt: { type: 'string', format: 'date-time' },
            timeSpentSeconds: { type: 'integer' },
          },
        },
        Credential: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            type: { type: 'string', enum: ['completion', 'achievement', 'literacy'] },
            title: { type: 'string' },
            description: { type: 'string' },
            badgeUrl: { type: 'string' },
            pdfUrl: { type: 'string' },
            verificationCode: { type: 'string' },
            issuedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        Analytics: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalSessions: { type: 'integer' },
                completedSessions: { type: 'integer' },
                averageScore: { type: 'number' },
                passRate: { type: 'number' },
              },
            },
            byAssessment: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  assessmentId: { type: 'string' },
                  assessmentTitle: { type: 'string' },
                  attempts: { type: 'integer' },
                  averageScore: { type: 'number' },
                  passRate: { type: 'number' },
                },
              },
            },
            byTopic: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  questionsAttempted: { type: 'integer' },
                  correctRate: { type: 'number' },
                },
              },
            },
            recentSessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  assessmentTitle: { type: 'string' },
                  score: { type: 'number' },
                  percentage: { type: 'number' },
                  completedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          tags: ['System'],
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
      '/auth/login': {
        post: {
          summary: 'Student login',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['registrationNumber', 'password'],
                  properties: {
                    registrationNumber: { type: 'string' },
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
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Student not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Get current authenticated student',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Student profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Student' },
                },
              },
            },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/courses': {
        get: {
          summary: 'List courses for the authenticated student',
          tags: ['Courses'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'yearOfStudy', in: 'query', schema: { type: 'integer' }, description: 'Filter by year of study' },
            { name: 'department', in: 'query', schema: { type: 'string' }, description: 'Filter by department' },
          ],
          responses: {
            '200': {
              description: 'List of courses',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      courses: { type: 'array', items: { $ref: '#/components/schemas/Course' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/courses/{id}': {
        get: {
          summary: 'Get course details with assessments',
          tags: ['Courses'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Course with assessments',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      course: { $ref: '#/components/schemas/Course' },
                      assessments: { type: 'array', items: { $ref: '#/components/schemas/Assessment' } },
                    },
                  },
                },
              },
            },
            '404': { description: 'Course not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/exams/start': {
        post: {
          summary: 'Start a new exam session',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assessmentId', 'mode'],
                  properties: {
                    assessmentId: { type: 'string' },
                    mode: { type: 'string', enum: ['practice', 'summative', 'formative'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Exam session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Assessment not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '409': { description: 'Active session already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/exams/{sessionId}': {
        get: {
          summary: 'Get exam session details',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Exam session with questions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          summary: 'Save an answer',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['instanceId', 'value', 'currentIndex'],
                  properties: {
                    instanceId: { type: 'string' },
                    value: { type: 'string' },
                    currentIndex: { type: 'integer' },
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
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/exams/{sessionId}/begin': {
        post: {
          summary: 'Begin the exam (starts the timer)',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Exam started',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Exam already begun or invalid state', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/exams/{sessionId}/submit': {
        post: {
          summary: 'Submit exam for grading',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['answers'],
                  properties: {
                    answers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['instanceId', 'value'],
                        properties: {
                          instanceId: { type: 'string' },
                          value: { type: 'string' },
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
              description: 'Exam submitted and graded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/exams/{sessionId}/clock': {
        get: {
          summary: 'Get server time sync for exam',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Server time and session end time',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      serverNow: { type: 'string', format: 'date-time' },
                      endsAt: { type: 'string', format: 'date-time' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/exams/{sessionId}/integrity': {
        post: {
          summary: 'Report integrity violation (tab switch)',
          tags: ['Exams'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { type: 'string', enum: ['tab_hidden'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Integrity check result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      action: { type: 'string', enum: ['flagged', 'auto_submitted', 'already_submitted', 'ok'] },
                      tabSwitchCount: { type: 'integer' },
                      remainingStrikes: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/ai/hint': {
        post: {
          summary: 'Get AI-powered Socratic hint',
          tags: ['AI'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sessionId', 'instanceId', 'hintLevel'],
                  properties: {
                    sessionId: { type: 'string' },
                    instanceId: { type: 'string' },
                    hintLevel: { type: 'integer', minimum: 0, maximum: 2 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'AI hint generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      hint: { type: 'string' },
                      hintLevel: { type: 'integer' },
                      source: { type: 'string', enum: ['llm', 'local'] },
                      hintsUsed: { type: 'integer' },
                      hintsRemaining: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Invalid request or hints exhausted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Hints not allowed in this mode', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Session or question not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/analytics': {
        get: {
          summary: 'Get student analytics and diagnostics',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Analytics data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      analytics: { $ref: '#/components/schemas/Analytics' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/past-papers': {
        get: {
          summary: 'List past papers for the student',
          tags: ['Past Papers'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of past papers',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      pastPapers: { type: 'array', items: { $ref: '#/components/schemas/PastPaper' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/past-papers/{slug}/start': {
        post: {
          summary: 'Start a past paper practice session',
          tags: ['Past Papers'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '201': {
              description: 'Past paper session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      session: { $ref: '#/components/schemas/ExamSession' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Past paper not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '409': { description: 'Active session already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/literacy': {
        get: {
          summary: 'List digital literacy lessons',
          tags: ['Digital Literacy'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of lessons grouped by track',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      lessons: { type: 'array', items: { $ref: '#/components/schemas/LiteracyLesson' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/literacy/progress': {
        get: {
          summary: 'Get student literacy progress',
          tags: ['Digital Literacy'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Progress by lesson',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      progress: {
                        type: 'object',
                        additionalProperties: { $ref: '#/components/schemas/LiteracyProgress' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/literacy/{slug}': {
        get: {
          summary: 'Get literacy lesson content',
          tags: ['Digital Literacy'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Lesson content',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      lesson: { $ref: '#/components/schemas/LiteracyLesson' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Lesson not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          summary: 'Mark lesson as completed',
          tags: ['Digital Literacy'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    timeSpentSeconds: { type: 'integer' },
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
                    properties: {
                      progress: { $ref: '#/components/schemas/LiteracyProgress' },
                    },
                  },
                },
              },
            },
            '404': { description: 'Lesson not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/credentials/eligibility': {
        get: {
          summary: 'Check credential eligibility for student',
          tags: ['Credentials'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Eligibility status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      eligible: { type: 'boolean' },
                      credentials: { type: 'array', items: { $ref: '#/components/schemas/Credential' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/credentials/{id}/verify': {
        get: {
          summary: 'Verify a credential by verification code',
          tags: ['Credentials'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
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
            '404': { description: 'Credential not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/staff/login': {
        post: {
          summary: 'Staff login with email and password (sends OTP)',
          tags: ['Authentication'],
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
            '401': { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '403': { description: 'Staff account not active', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/staff/otp/verify': {
        post: {
          summary: 'Verify staff OTP and get JWT token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['staffId', 'code'],
                  properties: {
                    staffId: { type: 'string' },
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
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid or expired OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Staff not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
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