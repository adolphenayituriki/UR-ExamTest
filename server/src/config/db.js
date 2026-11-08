import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`[db] connected to ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

mongoose.connection.on('error', (err) => {
  console.error('[db] connection error:', err.message);
});
