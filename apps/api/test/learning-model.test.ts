import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLearningModel, schoolLearningModel } from '../src/learning/proto-model.ts';
import { openDatabase } from '../src/db/index.ts';
import { prepareLearningSettings } from '../src/learning/proto-settings.ts';
import { founderProvider } from '../src/ai/founder-provider.ts';
import { LocalStubProvider } from '../src/ai/provider.ts';
import { createHarness } from './helpers.ts';

const mocks = vi.hoisted(() => ({ generate: vi.fn(), keys: [] as string[] }));
vi.mock('@google/genai', () => ({ GoogleGenAI: class {
  constructor({ apiKey }: { apiKey: string }) { mocks.keys.push(apiKey); }
  models = { generateContent: mocks.generate };
} }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); mocks.generate.mockReset(); mocks.keys.length = 0; });

describe('learning provider selection', () => {
  it('limits the live connection check to administrators and reports missing configuration honestly', async () => {
    vi.stubEnv('GEMINI_API_KEY', ''); vi.stubEnv('OPENAI_API_KEY', '');
    const h = await createHarness();
    try {
      const schoolId = (await h.register()).json().school.id as string;
      const admin = h.roleCookie(schoolId, 'admin').cookie;
      const student = h.roleCookie(schoolId, 'student').cookie;
      expect((await h.post('/founder/test-connection', {}, student)).statusCode).toBe(403);
      expect((await h.post('/founder/test-connection', {}, admin)).json()).toMatchObject({ connected: false });
      expect(mocks.generate).not.toHaveBeenCalled();
    } finally { await h.app.close(); }
  });

  it('verifies a real provider response and keeps provider failure details private', async () => {
    vi.stubEnv('GEMINI_API_KEY', ''); vi.stubEnv('OPENAI_API_KEY', '');
    const h = await createHarness();
    try {
      const schoolId = (await h.register()).json().school.id as string;
      const admin = h.roleCookie(schoolId, 'admin').cookie;
      h.database.sqlite.prepare('INSERT INTO proto_founder_settings VALUES (?,?,?,?)').run(schoolId, 'test-private-key', 'test-model', h.now());
      mocks.generate.mockResolvedValue({ text: '{"ok":true}' });
      expect((await h.post('/founder/test-connection', {}, admin)).json()).toMatchObject({ connected: true });
      mocks.generate.mockRejectedValue(new Error('test-private-key: upstream error'));
      const response = await h.post('/founder/test-connection', {}, admin);
      expect(response.json()).toMatchObject({ connected: false });
      expect(response.body).not.toContain('test-private-key');
    } finally { await h.app.close(); }
  });
  it('uses Gemini JSON with the configurable model', async () => {
    mocks.generate.mockResolvedValue({ text: '{"explanation":"Grounded idea"}' });
    const model = createLearningModel({ GEMINI_API_KEY: 'test-gemini', GEMINI_MODEL: 'test-model' });
    expect(model.provider).toBe('gemini');
    expect(await model.generate('Teach', { chapter: 'Motion' })).toEqual({ explanation: 'Grounded idea' });
    expect(mocks.generate.mock.calls[0]![0]).toMatchObject({ model: 'test-model', config: { responseMimeType: 'application/json' } });
  });

  it('falls through a failed Gemini call to OpenAI without exposing provider errors', async () => {
    mocks.generate.mockRejectedValue(new Error('provider detail'));
    const fetch = vi.fn(async () => Response.json({ choices: [{ message: { content: '{"ok":true}' } }] }));
    vi.stubGlobal('fetch', fetch);
    const model = createLearningModel({ GEMINI_API_KEY: 'test-gemini', OPENAI_API_KEY: 'test-openai' });
    expect(await model.generate('Teach', {})).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledOnce();
    await expect(createLearningModel({}).generate('Teach', {})).rejects.toThrow('No learning provider configured');
  });

  it('reads saved, replaced and removed school keys at call time, before environment keys', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-env');
    mocks.generate.mockResolvedValue({ text: '{}' });
    const database = openDatabase(':memory:');
    try {
      await prepareLearningSettings(database);
      const generate = () => schoolLearningModel(database, 'school').generate('Teach', {});
      await generate();
      database.sqlite.prepare('INSERT INTO proto_founder_settings VALUES (?,?,?,?)').run('school', 'test-founder', 'saved-model', 1);
      await generate();
      database.sqlite.prepare('UPDATE proto_founder_settings SET gemini_key=?').run('test-replaced');
      await generate();
      await schoolLearningModel(database, 'another-school').generate('Teach', {});
      database.sqlite.prepare('UPDATE proto_founder_settings SET gemini_key=?').run('');
      await generate();
      expect(mocks.keys).toEqual(['test-env', 'test-founder', 'test-replaced', 'test-env', 'test-env']);
      expect(mocks.generate.mock.calls[1]![0]).toMatchObject({ model: 'saved-model' });
    } finally { database.close(); }
  });

  it('updates existing tutor entry points and keeps a grounded legacy fallback', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const database = openDatabase(':memory:');
    try {
      await prepareLearningSettings(database);
      const fallback = new LocalStubProvider();
      const provider = founderProvider(database, fallback);
      expect(provider.id).toBe('stub');
      const initialCache = provider.cacheKey;
      const input = { schoolId: 'school', question: 'What is speed?', hintLevel: 3, socratic: false,
        sources: [{ id: 1, noteId: 'note', title: 'Motion', position: 0, text: 'Speed is distance travelled per unit time.' }] };
      database.sqlite.prepare('INSERT INTO proto_founder_settings VALUES (?,?,?,?)').run('school', 'test-founder', '', 1);
      expect(provider.id).toBe('gemini');
      expect(provider.cacheKey).not.toBe(initialCache);
      mocks.generate.mockResolvedValue({ text: JSON.stringify({ message: 'Use distance divided by time.', sources: [{ chunkId: 1, quote: 'Speed is distance travelled per unit time.' }] }) });
      expect((await provider.ask(input))?.message).toContain('divided');
      expect(mocks.keys).toEqual(['test-founder']);
      mocks.generate.mockRejectedValue(new Error('unavailable'));
      expect(await provider.ask(input)).toEqual(await fallback.ask(input));
      database.sqlite.prepare('DELETE FROM proto_founder_settings').run();
      mocks.generate.mockClear();
      expect(await provider.ask(input)).toEqual(await fallback.ask(input));
      expect(mocks.generate).not.toHaveBeenCalled();
    } finally { database.close(); }
  });
});
