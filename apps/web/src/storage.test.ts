import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseCached, parseCachedMe } from './storage';

const cached = {
  updatedAt: '2026-10-24T12:00:00.000Z',
  me: {
    school: { id: '5d5f0c4a-2e3b-4c1d-8f6a-9b0c1d2e3f4a', name: 'North Ridge School' },
    profile: {
      id: '6e6f1d5b-3f4c-4d2e-9a7b-0c1d2e3f4a5b',
      userId: '7f708e6c-405d-4e3f-8b8c-1d2e3f4a5b6c',
      schoolId: '5d5f0c4a-2e3b-4c1d-8f6a-9b0c1d2e3f4a',
      name: 'Mina Rao',
      role: 'admin',
    },
  },
};

describe('parseCachedMe', () => {
  it('keeps a valid saved sign-in and drops anything else', () => {
    expect(parseCachedMe(JSON.stringify(cached))).toEqual(cached);
    expect(parseCachedMe('not json')).toBeNull();
    expect(parseCachedMe(JSON.stringify({ updatedAt: '2026-10-24T12:00:00.000Z', me: { school: {} } }))).toBeNull();
  });
});

describe('parseCached', () => {
  it('keeps data that matches the schema', () => {
    const schema = z.object({ name: z.string() }).strict();
    expect(parseCached(JSON.stringify({ data: { name: 'Class 6' }, updatedAt: '2026-10-25T00:00:00.000Z' }), schema)).toEqual({
      data: { name: 'Class 6' },
      updatedAt: '2026-10-25T00:00:00.000Z',
    });
    expect(parseCached(JSON.stringify({ data: { name: 1 }, updatedAt: '2026-10-25T00:00:00.000Z' }), schema)).toBeNull();
  });
});
