import { describe, expect, it } from 'vitest';
import { ApiErrorSchema, ClaimSchema, LoginSchema, PinLoginSchema, RegisterSchoolSchema, RoleSchema } from './index.ts';

describe('auth contracts', () => {
  it('normalizes names and email without modifying passwords', () => {
    expect(RegisterSchoolSchema.parse({
      schoolName: ' Test school ', name: ' Admin ', email: ' ADMIN@example.test ', password: ' a long password ',
    })).toEqual({ schoolName: 'Test school', name: 'Admin', email: 'admin@example.test', password: ' a long password ' });
    expect(LoginSchema.parse({ email: ' ADMIN@example.test ', password: 'a long password' }).email).toBe('admin@example.test');
  });

  it('normalizes claim codes and keeps leading zeroes in PINs', () => {
    expect(ClaimSchema.parse({ code: ' abcd2345efgh ', pin: '0123' })).toEqual({ code: 'ABCD2345EFGH', pin: '0123' });
  });

  it.each(['0', '1', 'I', 'L', 'O'])('rejects ambiguous code character %s', (character) => {
    expect(ClaimSchema.safeParse({ code: `${character}BCD2345EFGH`, pin: '1234' }).success).toBe(false);
  });

  it('rejects weak credentials, unknown fields, invalid identifiers and unknown roles', () => {
    expect(LoginSchema.safeParse({ email: 'bad', password: 'short' }).success).toBe(false);
    expect(ClaimSchema.safeParse({ code: 'ABCD2345EFGH', pin: '123' }).success).toBe(false);
    expect(ClaimSchema.safeParse({ code: 'ABCD2345EFGH', pin: '1234', role: 'admin' }).success).toBe(false);
    expect(PinLoginSchema.safeParse({ profileId: 'not-a-uuid', pin: '1234' }).success).toBe(false);
    expect(RoleSchema.safeParse('owner').success).toBe(false);
  });

  it('validates field-level API errors', () => {
    expect(ApiErrorSchema.parse({ code: 'VALIDATION_ERROR', message: 'Invalid input.', fields: { pin: ['Use digits.'] } }).fields?.pin).toEqual(['Use digits.']);
  });
});
