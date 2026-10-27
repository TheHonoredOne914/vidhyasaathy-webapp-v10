import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';
import { openDatabase } from './db/index.ts';
import { OpenAiProvider } from './ai/provider.ts';

const config = loadConfig();
const database = openDatabase(config.DATABASE_PATH);
const app = await buildApp({
  database,
  appOrigin: config.APP_ORIGIN,
  cookieName: config.SESSION_COOKIE_NAME,
  sessionTtlMs: config.SESSION_TTL_SECONDS * 1000,
  pinLockoutMs: config.PIN_LOCKOUT_SECONDS * 1000,
  rateLimitMax: config.AUTH_RATE_LIMIT_MAX,
  uploadsDirectory: config.UPLOAD_DIRECTORY,
  ...(config.OPENAI_API_KEY ? { llmProvider: new OpenAiProvider({ apiKey: config.OPENAI_API_KEY, model: config.OPENAI_MODEL, apiUrl: config.OPENAI_API_URL }) } : {}),
  ...(config.CLAIM_CODE_ENCRYPTION_KEY ? { claimCodeEncryptionKey: config.CLAIM_CODE_ENCRYPTION_KEY } : {}),
  logger: true,
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().catch((error: unknown) => {
      app.log.error(error);
      process.exitCode = 1;
    });
  });
}

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
