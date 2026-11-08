import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ApiError } from './utils/errors.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import examRoutes from './routes/exams.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import pastPaperRoutes from './routes/pastPapers.js';
import credentialRoutes from './routes/credentials.js';
import literacyRoutes from './routes/literacy.js';
import { sweepExpiredSessions } from './services/sessionService.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowed = env.clientOrigin
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, `Origin ${origin} is not allowed by CORS.`));
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 800,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please slow down.' },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/past-papers', pastPaperRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/literacy', literacyRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

app.use((error, _req, res, _next) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      message: error.message,
      ...(error.details ? { code: error.details.code, details: error.details } : {}),
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'A conflicting record already exists.' });
  }

  if (error?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed.',
      details: Object.values(error.errors || {}).map((entry) => entry.message),
    });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier supplied.' });
  }

  console.error('[api] unhandled error:', error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

let sweeper;

async function start() {
  await connectDatabase();
  sweeper = setInterval(sweepExpiredSessions, 15000);
  if (typeof sweeper.unref === 'function') sweeper.unref();

  const server = app.listen(env.port, () => {
    console.log(`[api] UR Digital Examination API listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received. Shutting down...`);
    clearInterval(sweeper);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('[api] failed to start:', error.message);
  process.exit(1);
});

export default app;
