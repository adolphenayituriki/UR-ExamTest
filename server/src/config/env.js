import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../../.env') });
dotenv.config({ path: path.resolve(here, '../../.env') });

const PLACEHOLDER_SECRETS = new Set([
  '',
  'change-this-to-a-long-random-string',
  'ur-exam-dev-secret-change-in-production',
]);

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

// Separate key for signing verifiable credentials (HMAC). Falls back to the
// JWT secret so existing signatures keep verifying, but deployments should
// set its own value to contain the blast radius of one leaked key.
env.credentialSecret =
  process.env.CREDENTIAL_SECRET && PLACEHOLDER_SECRETS.has(process.env.CREDENTIAL_SECRET) === false
    ? process.env.CREDENTIAL_SECRET
    : env.jwtSecret;

export const isProd = env.nodeEnv === 'production';

// Fail fast on insecure deployment configuration.
if (isProd && PLACEHOLDER_SECRETS.has(process.env.JWT_SECRET || '')) {
  console.error(
    '[env] FATAL: JWT_SECRET is missing or is a known placeholder. ' +
      'Generate one with `node -e "console.log(require(\'node:crypto\').randomBytes(48).toString(\'hex\'))"` ' +
      'and set it before starting in production.'
  );
  process.exit(1);
}

if (!isProd && PLACEHOLDER_SECRETS.has(process.env.JWT_SECRET || '')) {
  console.warn(
    '[env] WARNING: JWT_SECRET not set — using the shared development secret. ' +
      'Tokens signed with it can be forged by anyone with the public source. Never reuse this in production.'
  );
}
