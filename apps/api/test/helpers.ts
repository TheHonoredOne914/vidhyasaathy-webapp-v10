import { randomUUID } from 'node:crypto';
import type { Role } from '@vidhyasaathy/contracts';
import { generateClaimCode } from '@vidhyasaathy/core/claim';
import { buildApp } from '../src/app.ts';
import type { LlmProvider } from '../src/ai/provider.ts';
import { generateSessionToken, hashToken } from '../src/auth/security.ts';
import { openDatabase } from '../src/db/index.ts';
import { claimCodes, profiles, sessions, users } from '../src/db/schema.ts';

export const ORIGIN = 'https://school.test';
export const PASSWORD = 'A test-only password 42';
export const PIN = '0123';
export const COOKIE_NAME = 'vidhyasaathy_session';

export function cookieFrom(headers: Record<string, string | string[] | number | undefined>): string {
  const header = headers['set-cookie'];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') throw new Error('Expected a session cookie.');
  const cookie = value.split(';')[0];
  if (!cookie) throw new Error('Expected a session cookie.');
  return cookie;
}

export async function createHarness(options: { rateLimitMax?: number; authRateLimitMax?: number; databasePath?: string; uploadsDirectory?: string; llmProvider?: LlmProvider; aiDailyTokenBudget?: number } = {}) {
  let currentTime = Date.UTC(2026, 9, 24, 12);
  const now = () => currentTime;
  const database = openDatabase(options.databasePath ?? ':memory:');
  const app = await buildApp({
    database, appOrigin: ORIGIN, now, rateLimitMax: options.rateLimitMax ?? 1000, authRateLimitMax: options.authRateLimitMax ?? 1000,
    claimCodeEncryptionKey: '11'.repeat(32),
    aiJobPollMs: 0,
    aiDailyTokenBudget: options.aiDailyTokenBudget ?? 30000,
    ...(options.llmProvider ? { llmProvider: options.llmProvider } : {}),
    ...(options.uploadsDirectory ? { uploadsDirectory: options.uploadsDirectory } : {}),
  });

  function post(url: string, payload?: Record<string, unknown>, cookie?: string) {
    return app.inject({
      method: 'POST', url, ...(payload === undefined ? {} : { payload }),
      headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}) },
    });
  }

  function register(email = 'admin@example.test') {
    return post('/auth/register-school', {
      schoolName: 'Test school', name: 'Test administrator', email, password: PASSWORD,
    });
  }

  function createProfile(schoolId: string, role: Role = 'student', expiresAt = now() + 60000) {
    const userId = randomUUID();
    const profileId = randomUUID();
    const code = generateClaimCode();
    const claimId = randomUUID();
    database.db.insert(users).values({ id: userId, createdAt: now() }).run();
    database.db.insert(profiles).values({ id: profileId, userId, schoolId, name: 'Test profile', role, createdAt: now() }).run();
    database.db.insert(claimCodes).values({
      id: claimId, codeHash: hashToken(code), schoolId, profileId, expiresAt, createdAt: now(),
    }).run();
    return { userId, profileId, code, claimId };
  }

  function roleCookie(schoolId: string, role: Role) {
    const profile = createProfile(schoolId, role);
    const token = generateSessionToken();
    database.db.insert(sessions).values({
      tokenHash: hashToken(token), profileId: profile.profileId, schoolId,
      expiresAt: now() + 60000, createdAt: now(),
    }).run();
    return { ...profile, cookie: `${COOKIE_NAME}=${token}` };
  }

  return { app, database, now, advance: (ms: number) => { currentTime += ms; }, post, register, createProfile, roleCookie };
}

export type Harness = Awaited<ReturnType<typeof createHarness>>;
