import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { Database } from '../db/index.ts';
import { parseInput } from '../errors.ts';
import { learningSettings, prepareLearningSettings } from '../learning/proto-settings.ts';
import { learningEnvironment } from '../learning/proto-model.ts';

export async function registerFounderSettings(app: FastifyInstance, database: Database, now: () => number) {
  await prepareLearningSettings(database);
  const admin = { preHandler: requireRole('admin') };
  function view(schoolId: string) {
    const settings = learningSettings(database, schoolId);
    const env = learningEnvironment();
    const key = settings?.gemini_key || env.GEMINI_API_KEY?.trim();
    return { geminiConfigured: !!key, geminiKeyMasked: key ? `********${key.length > 4 ? key.slice(-4) : ''}` : null,
      geminiModel: settings?.gemini_model || env.GEMINI_MODEL || 'gemini-2.5-flash',
      source: settings?.gemini_key ? 'founder' : key ? 'environment' : 'fallback' };
  }
  app.get('/founder/settings', admin, async (request) => view(requireAuth(request).school.id));
  app.put('/founder/settings', admin, async (request) => {
    const input = parseInput(z.object({ geminiApiKey: z.string().trim().max(512).nullable().optional(),
      geminiModel: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._/-]+$/).optional() }).strict(), request.body);
    const schoolId = requireAuth(request).school.id;
    const existing = learningSettings(database, schoolId);
    database.sqlite.prepare(`INSERT INTO proto_founder_settings VALUES (?,?,?,?)
      ON CONFLICT(school_id) DO UPDATE SET gemini_key=excluded.gemini_key,gemini_model=excluded.gemini_model,updated_at=max(proto_founder_settings.updated_at+1,excluded.updated_at)`)
      .run(schoolId, input.geminiApiKey === undefined ? existing?.gemini_key ?? '' : input.geminiApiKey ?? '',
        input.geminiModel ?? existing?.gemini_model ?? '', now());
    return view(schoolId);
  });
}
