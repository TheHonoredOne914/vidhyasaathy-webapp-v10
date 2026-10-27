import { randomUUID } from 'node:crypto';
import { LoginSchema, RegisterSchoolSchema } from '@vidhyasaathy/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../auth/service.ts';
import { generateSessionToken, hashCredential, hashToken, verifyCredential } from '../auth/security.ts';
import type { Db } from '../db/index.ts';
import { otpChallenges, profiles, schools, users } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';

export function registerPasswordRoutes(app: FastifyInstance, db: Db, auth: AuthService, dummyHash: string, now: () => number): void {
  app.post('/auth/register-school', { config: { public: true } }, async (request, reply) => {
    const input = parseInput(RegisterSchoolSchema, request.body);
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
    const input = parseInput(LoginSchema, request.body);
    const user = db.select().from(users).where(eq(users.email, input.email)).get();
    const valid = await verifyCredential(user?.passwordHash ?? dummyHash, input.password);
    if (!user?.passwordHash || !valid) throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');
    const teacher = db.select({ profile: profiles }).from(profiles).where(and(eq(profiles.userId, user.id), eq(profiles.role, 'teacher'))).get();
    if (teacher && !user.pinHash) {
      const pinToken = generateSessionToken();
      db.insert(otpChallenges).values({ id: randomUUID(), tokenHash: hashToken(pinToken), schoolId: teacher.profile.schoolId, profileId: teacher.profile.id, phone: '', purpose: 'teacher_pin', codeHash: hashToken('password-authenticated'), expiresAt: now() + 10 * 60 * 1000, attempts: 0 }).run();
      return { requiresPin: true, pinToken };
    }
    return auth.startSession(request, reply, 'auth.login', () => auth.identityForUser(user.id));
  });
}
