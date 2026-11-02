import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TutorResponseSchema } from '@vidhyasaathy/contracts';
import { createLearningModel, learningEnvironment } from '../src/learning/proto-model.ts';

const env = learningEnvironment();
const statusPath = resolve(import.meta.dirname, '../../../PROTOTYPE_STATUS.md');
if (!env.GEMINI_API_KEY?.trim()) {
  const result = 'Skipped: GEMINI_API_KEY is absent from process environment and apps/api/.env.';
  appendFileSync(statusPath, `\nGemini live check: ${result}\n`);
  console.info(result);
} else {
  try {
    const model = createLearningModel(env);
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
