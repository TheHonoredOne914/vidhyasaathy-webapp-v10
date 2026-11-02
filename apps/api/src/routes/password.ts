import { randomUUID } from 'node:crypto';
import { LoginSchema, RegisterSchoolSchema } from '@vidhyasaathy/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../auth/service.ts';
import { demoLooseAuthEnabled } from '../auth/demo-loose.ts';
import { generateSessionToken, hashCredential, hashToken, verifyCredential } from '../auth/security.ts';
import { DEMO_SCHOOL_ID } from '../db/demo.ts';
import type { Db } from '../db/index.ts';
import { otpChallenges, profiles, schools, users } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';

const looseAuth = demoLooseAuthEnabled;

function looseValue(body: unknown, key: string): string {
  const value = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[key] : undefined;
  return typeof value === 'string' ? value.trim() : '';
}

function safeEmail(value: string): string {
  const normalized = value.toLowerCase().replace(/\s+/g, '');
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized) ? normalized : `demo-${hashToken(value || 'guest').slice(0, 12)}@demo.invalid`;
}

function displayName(email: string): string {
  const name = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return name ? name.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 100) : 'Demo teacher';
}

function minimumLength(value: string, fallback: string, length: number): string {
  return value.length >= length ? value : fallback;
}

export function registerPasswordRoutes(app: FastifyInstance, db: Db, auth: AuthService, dummyHash: string, now: () => number): void {
  app.post('/auth/demo/:role', { config: { public: true } }, async (request, reply) => {
    if (!looseAuth()) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
    const role = (request.params as { role: string }).role;
    if (!['student', 'teacher', 'parent', 'admin'].includes(role)) throw new ApiException(400, 'INVALID_ROLE', 'Choose a demo role.');
    const demo = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, role as 'student' | 'teacher' | 'parent' | 'admin'))).all();
    let profile = demo.find((row) => row.name === 'Aarav') ?? demo[0];
    if (!profile && role === 'admin') {
      const school = db.select().from(schools).where(eq(schools.id, DEMO_SCHOOL_ID)).get();
      if (school) {
        const userId = randomUUID();
        const id = randomUUID();
        db.transaction(() => {
          db.insert(users).values({ id: userId, createdAt: now() }).run();
          db.insert(profiles).values({ id, userId, schoolId: school.id, name: 'Demo administrator', role: 'admin', createdAt: now() }).run();
        });
        profile = db.select().from(profiles).where(eq(profiles.id, id)).get();
      }
    }
    if (!profile) throw new ApiException(503, 'DEMO_UNAVAILABLE', 'The demo profile is not available.');
    return auth.startSession(request, reply, 'auth.demo', () => auth.identityForProfile(profile.id));
  });
  app.post('/auth/register-school', { config: { public: true } }, async (request, reply) => {
    const input = looseAuth()
      ? RegisterSchoolSchema.parse({
        schoolName: minimumLength(looseValue(request.body, 'schoolName'), 'Demo school', 2),
        name: minimumLength(looseValue(request.body, 'name'), 'Demo administrator', 2),
        email: safeEmail(looseValue(request.body, 'email')),
        password: (looseValue(request.body, 'password') || 'demo').padEnd(12, '0').slice(0, 128),
      })
      : parseInput(RegisterSchoolSchema, request.body);
    const passwordHash = await hashCredential(input.password);
    const result = auth.startSession(request, reply, 'auth.register-school', () => {
      if (input.city && !input.confirmDuplicate && db.select({ id: schools.id }).from(schools).where(and(
        sql`lower(${schools.name}) = ${input.schoolName.toLowerCase()}`, sql`lower(${schools.city}) = ${input.city.toLowerCase()}`,
      )).get()) throw new ApiException(409, 'DUPLICATE_SCHOOL', 'A school with this name and city already exists. Confirm that this is a separate school, or sign in.');
      const schoolId = randomUUID();
      const userId = randomUUID();
      const profileId = randomUUID();
      const createdAt = now();
      db.insert(schools).values({ id: schoolId, name: input.schoolName, city: input.city, board: input.board, schoolType: input.schoolType, email: input.email, phone: input.phone, createdAt }).run();
      const user = db.insert(users).values({ id: userId, email: input.email, passwordHash, createdAt })
        .onConflictDoNothing({ target: users.email }).returning({ id: users.id }).get();
      if (!user) throw new ApiException(409, 'EMAIL_IN_USE', 'An account already uses this email.');
      db.insert(profiles).values({ id: profileId, userId, schoolId, name: input.name, role: 'admin', createdAt }).run();
      return auth.identityForProfile(profileId);
    });
    return reply.code(201).send(result);
  });

  app.post('/auth/login', { config: { public: true } }, async (request, reply) => {
    const loose = looseAuth();
    const input = loose
      ? { email: safeEmail(looseValue(request.body, 'email')), password: looseValue(request.body, 'password') || 'demo' }
      : parseInput(LoginSchema, request.body);
    let user = db.select().from(users).where(eq(users.email, input.email)).get();
    if (loose && !user) {
      const schoolId = db.select({ id: schools.id }).from(schools).where(eq(schools.id, DEMO_SCHOOL_ID)).get()?.id
        ?? db.select({ id: schools.id }).from(schools).get()?.id;
      if (schoolId) {
        const createdAt = now();
        const userId = randomUUID();
        const profileId = randomUUID();
        const passwordHash = await hashCredential(input.password);
        const created = db.insert(users).values({ id: userId, email: input.email, passwordHash, createdAt })
          .onConflictDoNothing({ target: users.email }).returning({ id: users.id }).get();
        if (created) db.insert(profiles).values({ id: profileId, userId, schoolId, name: displayName(input.email), role: 'teacher', createdAt }).run();
        user = db.select().from(users).where(eq(users.email, input.email)).get();
      }
    }
    const valid = loose && user ? true : await verifyCredential(user?.passwordHash ?? dummyHash, input.password);
    if (!user?.passwordHash || !valid) throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');
    const teacher = db.select({ profile: profiles }).from(profiles).where(and(eq(profiles.userId, user.id), eq(profiles.role, 'teacher'))).get();
    if (teacher && !user.pinHash && !loose) {
      const pinToken = generateSessionToken();
      db.insert(otpChallenges).values({ id: randomUUID(), tokenHash: hashToken(pinToken), schoolId: teacher.profile.schoolId, profileId: teacher.profile.id, phone: '', purpose: 'teacher_pin', codeHash: hashToken('password-authenticated'), expiresAt: now() + 10 * 60 * 1000, attempts: 0 }).run();
      return { requiresPin: true, pinToken };
    }
    return auth.startSession(request, reply, 'auth.login', () => auth.identityForUser(user.id));
  });
}
