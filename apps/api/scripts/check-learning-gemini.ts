import { appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Sqlite from 'better-sqlite3';
import { TutorResponseSchema } from '@vidhyasaathy/contracts';
import { createLearningModel, learningEnvironment } from '../src/learning/proto-model.ts';
import { DEMO_SCHOOL_ID } from '../src/db/demo.ts';

const env = learningEnvironment();
const databasePath = resolve(import.meta.dirname, '..', env.DATABASE_PATH || './data/vidhyasaathy.db');
if (existsSync(databasePath)) {
  const sqlite = new Sqlite(databasePath, { readonly: true, fileMustExist: true });
  try {
    if (sqlite.prepare("SELECT 1 FROM sqlite_master WHERE name='proto_founder_settings'").get()) {
      const saved = sqlite.prepare("SELECT gemini_key,gemini_model FROM proto_founder_settings WHERE gemini_key<>'' AND school_id=?")
        .get(env.LEARNING_SCHOOL_ID || DEMO_SCHOOL_ID) as { gemini_key: string; gemini_model: string } | undefined;
      if (saved) { env.GEMINI_API_KEY = saved.gemini_key; env.GEMINI_MODEL = saved.gemini_model || env.GEMINI_MODEL; }
    }
  } finally { sqlite.close(); }
}
const statusPath = resolve(import.meta.dirname, '../../../PROTOTYPE_STATUS.md');
if (!env.GEMINI_API_KEY?.trim()) {
  const result = 'Skipped: no Gemini key in founder settings for LEARNING_SCHOOL_ID (default demo school), process environment or apps/api/.env.';
  appendFileSync(statusPath, `\nGemini live check: ${result}\n`);
  console.info(result);
} else {
  try {
    // A smoke check must prove Gemini itself; do not silently pass through OpenAI.
    const model = createLearningModel({ ...env, OPENAI_API_KEY: '' });
    const response = await model.generate('You are Saathy, a calm NCERT tutor. Return JSON {explanation:string,suggestedAction:string,conceptId:"motion-speed"}. Explain average speed using only the supplied NCERT context. No ranks, emoji, links or answer keys.', {
      subject: 'Physics', chapter: 'Motion', concept: 'motion-speed', session: 'smoke-check',
      question: 'Explain average speed simply.', answer: null, lastWrongAttempt: null, plan: null,
      grounding: 'Average speed is total distance travelled divided by total time taken. The SI unit is m/s.',
    });
    const validated = TutorResponseSchema.parse(response);
    if (validated.conceptId !== 'motion-speed') throw new Error('Invalid concept');
    const result = `PASS: real Gemini call; model ${env.GEMINI_MODEL || 'gemini-2.5-flash'}; TutorResponse validated; ${validated.explanation.length} explanation characters. No credentials recorded.`;
    appendFileSync(statusPath, `\nGemini live check (${new Date().toISOString()}): ${result}\n`);
    console.info(result);
  } catch {
    const result = 'FAIL: live Gemini request or TutorResponse validation failed. Provider error and credentials withheld.';
    appendFileSync(statusPath, `\nGemini live check (${new Date().toISOString()}): ${result}\n`);
    console.error(result);
    process.exitCode = 1;
  }
}
