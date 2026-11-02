import { GoogleGenAI } from '@google/genai';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

export type JsonModel = (system: string, input: unknown) => Promise<unknown>;

export function learningEnvironment() {
  const path = resolve(import.meta.dirname, '../../.env');
  const local = existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : {};
  return { ...local, ...process.env };
}

/** Server only. No credentials or raw provider errors are sent to the client. */
export function createLearningModel(env = learningEnvironment()): { provider: string; generate: JsonModel } {
  if (env.GEMINI_API_KEY?.trim()) {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY.trim() });
    return { provider: 'gemini', generate: async (system, input) => {
      const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL || 'gemini-2.5-flash', contents: JSON.stringify(input),
        config: { systemInstruction: system, responseMimeType: 'application/json',
          maxOutputTokens: 4096, httpOptions: { timeout: 20000 } },
      });
      return JSON.parse(response.text ?? 'null') as unknown;
    } };
  }
  if (env.OPENAI_API_KEY?.trim()) {
    // Same chat-completions path and environment as the existing OpenAiProvider.
    return { provider: 'openai', generate: async (system, input) => {
      const response = await fetch(env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(20000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-4o-mini', response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(input) }] }),
      });
      if (!response.ok) { await response.body?.cancel(); throw new Error('Learning provider unavailable'); }
      const body = await response.json() as { choices?: { message: { content: string } }[] };
      return JSON.parse(body.choices?.[0]?.message.content ?? 'null') as unknown;
    } };
  }
  return { provider: 'fallback', generate: async () => { throw new Error('No learning provider configured'); } };
}
