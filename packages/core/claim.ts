import { randomInt } from 'node:crypto';

export const CLAIM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CLAIM_CODE_LENGTH = 12;
export const CLAIM_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateClaimCode(): string {
  return Array.from({ length: CLAIM_CODE_LENGTH }, () => CLAIM_CODE_ALPHABET[randomInt(CLAIM_CODE_ALPHABET.length)]).join('');
}

export function isClaimCodeExpired(expiresAt: number | Date, now: number | Date = Date.now()): boolean {
  const expiry = Number(expiresAt);
  const current = Number(now);
  return !Number.isFinite(expiry) || !Number.isFinite(current) || expiry <= current;
}
