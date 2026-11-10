import crypto from 'node:crypto';

export function hashPassword(candidate) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(candidate), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPasswordHash(candidate, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hash] = stored.split(':');
  const computed = crypto.scryptSync(String(candidate), salt, 64).toString('hex');
  const storedBuffer = Buffer.from(hash, 'hex');
  const computedBuffer = Buffer.from(computed, 'hex');
  if (storedBuffer.length !== computedBuffer.length) return false;
  return crypto.timingSafeEqual(computedBuffer, storedBuffer);
}
