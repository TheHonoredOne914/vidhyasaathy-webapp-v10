import { describe, expect, it } from 'vitest';
import { CLAIM_CODE_ALPHABET, CLAIM_CODE_LENGTH, generateClaimCode, isClaimCodeExpired } from './claim.ts';

describe('claim codes', () => {
  it('generates fixed-length, unambiguous codes with independent randomness', () => {
    const codes = Array.from({ length: 1000 }, generateClaimCode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toHaveLength(CLAIM_CODE_LENGTH);
      expect([...code].every((character) => CLAIM_CODE_ALPHABET.includes(character))).toBe(true);
      expect(code).not.toMatch(/[01ILO]/);
    }
  });

  it('rejects expired codes including the exact expiry boundary', () => {
    expect(isClaimCodeExpired(99, 100)).toBe(true);
    expect(isClaimCodeExpired(100, 100)).toBe(true);
    expect(isClaimCodeExpired(101, 100)).toBe(false);
    expect(isClaimCodeExpired(new Date(101), new Date(100))).toBe(false);
  });

  it('fails closed on invalid timestamps', () => {
    expect(isClaimCodeExpired(new Date('invalid'), 100)).toBe(true);
    expect(isClaimCodeExpired(Infinity, 100)).toBe(true);
    expect(isClaimCodeExpired(101, NaN)).toBe(true);
    expect(isClaimCodeExpired(Date.now() - 1)).toBe(true);
  });
});
