import { z } from 'zod';

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_ORIGIN: z.string().url().refine((value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && value === url.origin;
  }, 'APP_ORIGIN must be an HTTP(S) origin without a path or trailing slash.'),
  DATABASE_PATH: z.string().min(1).default('./data/vidhyasaathy.db'),
  SESSION_COOKIE_NAME: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/).default('vidhyasaathy_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(60).max(2592000).default(604800),
  PIN_LOCKOUT_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  // Per client per minute: RATE_LIMIT_MAX covers ordinary routes; AUTH_RATE_LIMIT_MAX is the shared budget for /auth/* credential routes.
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000).default(120),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(20),
  UPLOAD_DIRECTORY: z.string().trim().min(1).default('./uploads'),
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  OPENAI_MODEL: z.string().trim().min(1).default('gpt-4o-mini'),
  OPENAI_API_URL: z.string().url().refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS provider endpoint.').default('https://api.openai.com/v1/chat/completions'),
  CLAIM_CODE_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
}).superRefine((env, context) => {
  if (env.NODE_ENV === 'production' && !env.APP_ORIGIN.startsWith('https://')) {
    context.addIssue({ code: 'custom', path: ['APP_ORIGIN'], message: 'Production requires HTTPS.' });
  }
});

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  return EnvironmentSchema.parse(environment);
}
