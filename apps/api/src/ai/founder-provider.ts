import type { Database } from '../db/index.ts';
import { learningSettings } from '../learning/proto-settings.ts';
import { createLearningModel, learningEnvironment } from '../learning/proto-model.ts';
import { GeminiProvider, type DraftSource, type GroundedQuestion, type LlmProvider } from './provider.ts';

/** Existing tutor entry points also see founder key changes without restarting. */
export function founderProvider(database: Database, fallback: LlmProvider): LlmProvider {
  function hasGemini() {
    return !!learningEnvironment().GEMINI_API_KEY?.trim()
      || !!database.sqlite.prepare("SELECT 1 FROM proto_founder_settings WHERE gemini_key<>'' LIMIT 1").get();
  }
  function selected(schoolId?: string) {
    const saved = schoolId ? learningSettings(database, schoolId) : undefined;
    const env = learningEnvironment();
    if (!saved?.gemini_key && !env.GEMINI_API_KEY?.trim()) return fallback;
    return new GeminiProvider(createLearningModel({ ...env,
      GEMINI_API_KEY: saved?.gemini_key || env.GEMINI_API_KEY,
      GEMINI_MODEL: saved?.gemini_model || env.GEMINI_MODEL,
      // The existing provider owns the legacy OpenAI fallback.
      OPENAI_API_KEY: '',
    }).generate, fallback);
  }
  return {
    get id() {
      return hasGemini() ? 'gemini' : fallback.id;
    },
    get cacheKey() {
      // Invalidate the legacy response cache when an administrator saves settings.
      const revision = database.sqlite.prepare('SELECT sum(updated_at) AS value FROM proto_founder_settings').get() as { value: number | null };
      return `${fallback.id}:founder:${revision.value ?? 0}`;
    },
    get configured() {
      return fallback.configured || hasGemini();
    },
    ask: (input: GroundedQuestion) => selected(input.schoolId).ask(input),
    draft: (input: DraftSource) => selected(input.schoolId).draft(input),
    stream: (input: GroundedQuestion, signal: AbortSignal) => selected(input.schoolId).stream(input, signal),
    health: () => fallback.health(),
  };
}
