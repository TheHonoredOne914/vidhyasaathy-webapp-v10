import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApiErrorSchema } from '@vidhyasaathy/contracts';
import { describe, expect, it } from 'vitest';
import { rateLimits } from '../src/db/schema.ts';
import { PASSWORD, cookieFrom, createHarness } from './helpers.ts';

describe('persistent rate limiting', () => {
  it('limits authentication requests, persists across restarts, and resets after the window', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'vidhyasaathy-api-'));
    const databasePath = join(directory, 'rate-limit.db');
    let h = await createHarness({ authRateLimitMax: 2, databasePath });
    try {
      const input = { email: 'unknown@example.test', password: PASSWORD };
      expect((await h.post('/auth/login', input)).statusCode).toBe(401);
      expect((await h.post('/auth/login', input)).statusCode).toBe(401);
      expect(h.database.db.select().from(rateLimits).get()?.count).toBe(2);
      await h.app.close();
      h = await createHarness({ authRateLimitMax: 2, databasePath });
      const limited = await h.post('/auth/login', input);
      expect(limited.statusCode).toBe(429);
      expect(ApiErrorSchema.parse(limited.json()).code).toBe('RATE_LIMITED');
      expect(limited.headers['retry-after']).toBeDefined();
      h.advance(60000);
      expect((await h.post('/auth/login', input)).statusCode).toBe(401);
    } finally {
      await h.app.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('keeps signed-in routes on the general budget, separate from the auth budget', async () => {
    const h = await createHarness({ rateLimitMax: 3, authRateLimitMax: 1 });
    try {
      const registration = await h.register();
      expect(registration.statusCode).toBe(201);
      const cookie = cookieFrom(registration.headers);
      // The one auth request is spent, and every credential route shares that bucket.
      expect((await h.post('/auth/login', { email: 'unknown@example.test', password: PASSWORD })).statusCode).toBe(429);
      expect((await h.post('/auth/pin-login', { profileId: randomUUID(), pin: '1234' })).statusCode).toBe(429);
      for (let index = 0; index < 3; index++) expect((await h.app.inject({ url: '/me', headers: { cookie } })).statusCode).toBe(200);
      expect((await h.app.inject({ url: '/me', headers: { cookie } })).statusCode).toBe(429);
    } finally {
      await h.app.close();
    }
  });
});
