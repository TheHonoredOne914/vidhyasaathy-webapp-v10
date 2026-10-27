import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashCredential(credential: string): Promise<string> {
  return argon2.hash(credential, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export function verifyCredential(hash: string, credential: string): Promise<boolean> {
  return argon2.verify(hash, credential);
}
