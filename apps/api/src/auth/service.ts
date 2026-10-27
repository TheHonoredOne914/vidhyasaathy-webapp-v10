import { randomUUID } from 'node:crypto';
import type { Me } from '@vidhyasaathy/contracts';
import { and, eq, gt, lte } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from '../db/index.ts';
import { auditLogs, profiles, schools, sessions } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { generateSessionToken, hashToken } from './security.ts';

export interface AuthOptions {
  appOrigin: string;
  cookieName: string;
  sessionTtlMs: number;
  pinLockoutMs: number;
  now: () => number;
}

export function createAuthService(db: Db, options: AuthOptions) {
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: new URL(options.appOrigin).protocol === 'https:',
  };

  function identityForProfile(profileId: string): Me {
    const row = db.select({
      school: { id: schools.id, name: schools.name },
      profile: {
        id: profiles.id, userId: profiles.userId, schoolId: profiles.schoolId,
        name: profiles.name, role: profiles.role,
      },
    }).from(profiles).innerJoin(schools, eq(profiles.schoolId, schools.id))
      .where(eq(profiles.id, profileId)).get();
    if (!row) throw new ApiException(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    return row;
  }

  function identityForUser(userId: string): Me {
    const profile = db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).get();
    if (!profile) throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');
    return identityForProfile(profile.id);
  }

  function audit(request: FastifyRequest, action: string, identity: Me | null = request.auth): void {
    db.insert(auditLogs).values({
      id: randomUUID(), schoolId: identity?.school.id ?? null,
      profileId: identity?.profile.id ?? null, action, requestId: request.id, createdAt: options.now(),
    }).run();
  }

  function startSession(request: FastifyRequest, reply: FastifyReply, action: string, resolveIdentity: () => Me): Me {
    const token = generateSessionToken();
    const now = options.now();
    const identity = db.transaction(() => {
      const result = resolveIdentity();
      if (request.sessionHash) db.delete(sessions).where(eq(sessions.tokenHash, request.sessionHash)).run();
      db.delete(sessions).where(lte(sessions.expiresAt, now)).run();
      db.insert(sessions).values({
        tokenHash: hashToken(token), profileId: result.profile.id, schoolId: result.school.id,
        expiresAt: now + options.sessionTtlMs, createdAt: now,
      }).run();
      audit(request, action, result);
      return result;
    });
    reply.setCookie(options.cookieName, token, {
      ...cookieOptions, maxAge: Math.floor(options.sessionTtlMs / 1000),
    });
    return identity;
  }

  async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.header('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== options.appOrigin) {
      throw new ApiException(403, 'CSRF_ORIGIN', 'The request origin is not allowed.');
    }
    const token = request.cookies[options.cookieName];
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) request.sessionHash = hashToken(token);
    if (request.routeOptions.config.public) return;
    if (!request.sessionHash) throw new ApiException(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    const session = db.select().from(sessions).where(and(
      eq(sessions.tokenHash, request.sessionHash), gt(sessions.expiresAt, options.now()),
    )).get();
    if (!session) {
      db.delete(sessions).where(eq(sessions.tokenHash, request.sessionHash)).run();
      reply.clearCookie(options.cookieName, cookieOptions);
      throw new ApiException(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    }
    const identity = identityForProfile(session.profileId);
    if (identity.school.id !== session.schoolId) throw new ApiException(403, 'SCHOOL_FORBIDDEN', 'You cannot access another school.');
    request.auth = identity;
  }

  function logout(request: FastifyRequest, reply: FastifyReply): void {
    db.transaction(() => {
      if (request.sessionHash) db.delete(sessions).where(eq(sessions.tokenHash, request.sessionHash)).run();
      audit(request, 'auth.logout');
    });
    reply.clearCookie(options.cookieName, cookieOptions);
  }

  return { identityForProfile, identityForUser, audit, startSession, authenticateRequest, logout };
}

export type AuthService = ReturnType<typeof createAuthService>;
