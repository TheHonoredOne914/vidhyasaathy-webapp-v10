import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApiErrorSchema } from '@vidhyasaathy/contracts';
import { describe, expect, it } from 'vitest';
import { rateLimits } from '../src/db/schema.ts';
import { PASSWORD, createHarness } from './helpers.ts';

describe('persistent rate limiting', () => {
  it('limits authentication requests, persists across restarts, and resets after the window', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'vidhyasaathy-api-'));
    const databasePath = join(directory, 'rate-limit.db');
    let h = await createHarness({ rateLimitMax: 2, databasePath });
    try {
      const input = { email: 'unknown@example.test', password: PASSWORD };
      expect((await h.post('/auth/login', input)).statusCode).toBe(401);
      expect((await h.post('/auth/login', input)).statusCode).toBe(401);
      expect(h.database.db.select().from(rateLimits).get()?.count).toBe(2);
      await h.app.close();
      h = await createHarness({ rateLimitMax: 2, databasePath });
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
});
