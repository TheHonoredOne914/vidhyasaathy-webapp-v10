import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { SchoolSchema } from '@vidhyasaathy/contracts';
import Fastify, { type FastifyRequest } from 'fastify';
import { requireAuth, requireRole, requireSchool } from './auth/middleware.ts';
import { generateSessionToken, hashCredential, hashToken } from './auth/security.ts';
import { createAuthService, type AuthOptions } from './auth/service.ts';
import type { Database } from './db/index.ts';
import { ApiException, parseInput } from './errors.ts';
import { sqliteRateLimitStore } from './rate-limit.ts';
import { registerClaimRoute } from './routes/claim.ts';
import { registerPasswordRoutes } from './routes/password.ts';
import { registerPinRoute } from './routes/pin.ts';
import { registerInvitationRoutes } from './routes/invitations.ts';
import { registerRosterRoutes } from './routes/roster.ts';
import { registerSchoolRoutes } from './routes/school.ts';
import { registerFlowRoutes } from './routes/flow.ts';
import { registerContentRoutes } from './routes/content.ts';
import { registerContentFileRoutes } from './routes/content-files.ts';
import { registerLearningSessionRoutes } from './routes/learning-sessions.ts';
import { registerAssessmentRoutes } from './routes/assessments.ts';
import { registerSyncRoutes } from './routes/sync.ts';
import { createClaimIssuance } from './school/claims.ts';
import { LocalStubProvider, type LlmProvider } from './ai/provider.ts';
import { registerAiRoutes } from './routes/ai.ts';
import { registerRemediationRoutes } from './routes/remediation.ts';
import { registerDashboardRoutes } from './routes/dashboard.ts';
import { registerPracticeRoutes } from './routes/practice.ts';
import { registerDiagnosticRoutes } from './routes/diagnostic.ts';
import { registerLessonRoutes } from './routes/lessons.ts';
import { registerAuthV9Routes } from './routes/auth-v9.ts';

export interface AppOptions {
  database: Database;
  appOrigin: string;
  cookieName?: string;
  sessionTtlMs?: number;
  pinLockoutMs?: number;
  /** Requests per minute per client for ordinary routes. */
  rateLimitMax?: number;
  /** Requests per minute per client, shared across the public /auth/* credential routes. */
  authRateLimitMax?: number;
  now?: () => number;
  logger?: boolean;
  claimCodeEncryptionKey?: string;
  uploadsDirectory?: string;
  llmProvider?: LlmProvider;
  aiJobPollMs?: number;
}

export async function buildApp(input: AppOptions) {
  const app = Fastify({
    bodyLimit: 16384,
    trustProxy: false,
    logger: input.logger ? {
      redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
    } : false,
  });
  const options: AuthOptions = {
    appOrigin: input.appOrigin,
    cookieName: input.cookieName ?? 'vidhyasaathy_session',
    sessionTtlMs: input.sessionTtlMs ?? 604800000,
    pinLockoutMs: input.pinLockoutMs ?? 900000,
    now: input.now ?? Date.now,
  };
  const { db } = input.database;
  const auth = createAuthService(db, options);
  app.addHook('onClose', async () => { input.database.close(); });
  app.decorateRequest('auth', null);
  app.decorateRequest('sessionHash', null);
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Cache-Control', 'no-store');
    return payload;
  });
  app.setErrorHandler((error, request, reply) => {
    const status = typeof error === 'object' && error !== null
      && 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode : 500;
    const fallback: Record<number, [string, string]> = {
      400: ['INVALID_REQUEST', 'The request is invalid.'],
      413: ['PAYLOAD_TOO_LARGE', 'The request body is too large.'],
      415: ['UNSUPPORTED_MEDIA_TYPE', 'Send a JSON request body.'],
      429: ['RATE_LIMITED', 'Too many requests. Try again later.'],
    };
    const [code, message] = fallback[status] ?? ['INTERNAL_ERROR', 'The request could not be completed.'];
    const response = error instanceof ApiException ? error.toJSON() : { code, message };
    if (status >= 500) request.log.error({ err: error }, 'Request failed');
    try {
      auth.audit(request, `${request.method} ${request.routeOptions.url ?? 'unknown'}:${response.code}`);
    } catch (auditError) {
      request.log.error({ err: auditError }, 'Audit write failed');
    }
    void reply.code(status).send(response);
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ code: 'NOT_FOUND', message: 'Resource not found.' }));

  try {
    await app.register(cookie);
    app.addHook('onRequest', auth.authenticateRequest);
    // Must run before the rate-limit plugin's own onRoute hook: credential routes share one stricter bucket.
    const authRateLimit = {
      max: input.authRateLimitMax ?? 20,
      timeWindow: 60000,
      keyGenerator: (request: FastifyRequest) => `auth:${hashToken(request.ip)}`,
    };
    app.addHook('onRoute', (route) => {
      if (route.url.startsWith('/auth/') && route.config?.public === true && route.config.rateLimit === undefined) {
        route.config = { ...route.config, rateLimit: authRateLimit };
      }
    });
    await app.register(rateLimit, {
      max: input.rateLimitMax ?? 120,
      timeWindow: 60000,
      keyGenerator: (request) => hashToken(request.ip),
      store: sqliteRateLimitStore(db, options.now),
      skipOnError: false,
      errorResponseBuilder: () => new ApiException(429, 'RATE_LIMITED', 'Too many requests. Try again later.'),
    });
    const dummyHash = await hashCredential(generateSessionToken());
    registerPasswordRoutes(app, db, auth, dummyHash, options.now);
    registerAuthV9Routes(app, db, auth, options);
    registerClaimRoute(app, db, auth, options.now);
    registerPinRoute(app, db, auth, options, dummyHash);
    registerSchoolRoutes(app, db, auth);
    registerFlowRoutes(app, db, auth);
    registerInvitationRoutes(app, db, auth, options.now);
    registerRosterRoutes(app, db, auth, createClaimIssuance(db, input.claimCodeEncryptionKey, options.now), options.now);
    registerContentRoutes(app, db, auth, options.now);
    registerContentFileRoutes(app, db, auth, input.uploadsDirectory ?? './uploads', options.now);
    registerLearningSessionRoutes(app, db, auth, options.now);
    registerAssessmentRoutes(app, db, auth, options.now);
    registerSyncRoutes(app, db, options.now);
    registerAiRoutes(app, input.database, auth, input.llmProvider ?? new LocalStubProvider(), options.now, input.aiJobPollMs ?? 1000);
    registerRemediationRoutes(app, input.database, options.now);
    registerDashboardRoutes(app, input.database, auth, options.now);
    registerPracticeRoutes(app, db, auth, options.now);
    registerDiagnosticRoutes(app, db, options.now);
    registerLessonRoutes(app, db, options.now);
    app.post('/auth/logout', async (request, reply) => {
      auth.logout(request, reply);
      return reply.code(204).send();
    });
    app.get('/me', async (request) => requireAuth(request));
    app.get<{ Params: { schoolId: string } }>('/schools/:schoolId', {
      preHandler: [
        requireRole('admin'),
        requireSchool((request) => parseInput(SchoolSchema.shape.id, (request.params as { schoolId: string }).schoolId)),
      ],
    }, async (request) => requireAuth(request).school);
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
