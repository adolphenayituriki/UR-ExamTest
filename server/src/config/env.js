import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../../.env') });
dotenv.config({ path: path.resolve(here, '../../.env') });

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ur_exam',
  jwtSecret: process.env.JWT_SECRET || 'ur-exam-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  urRegistryApi: process.env.UR_REGISTRY_API || '',
  urRegistryKey: process.env.UR_REGISTRY_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || '',
  aiApiKey: process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  maxTabSwitches: Number(process.env.MAX_TAB_SWITCHES || 3),
};

export const isProd = env.nodeEnv === 'production';
