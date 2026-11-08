import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProvider, createVisionProvider, HttpModelProvider, LocalStubProvider, OpenAiProvider } from '../src/ai/provider.ts';
import { loadConfig } from '../src/config.ts';

const input = { question: 'What is speed?', hintLevel: 1 as const, socratic: true,
  sources: [{ id: 7, noteId: 'note', title: 'Motion', position: 0, text: 'Speed is distance travelled per unit time.' }] };

afterEach(() => vi.unstubAllGlobals());

describe('AI provider registry', () => {
  it('defaults offline, selects configured providers and leaves vision disabled', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const config = loadConfig({ APP_ORIGIN: 'http://school.test' });
    const stub = createProvider(config);
    expect(stub).toBeInstanceOf(LocalStubProvider);
    expect(await stub.health()).toBe(true);
    const events = [];
    for await (const event of stub.stream(input, new AbortController().signal)) events.push(event);
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(JSON.stringify(events)).toContain('[chunk:7]');
    expect(fetch).not.toHaveBeenCalled();
    expect(await createVisionProvider(config).extractText(new File(['image'], 'x.png', { type: 'image/png' }))).toEqual({ status: 'not_configured' });
    expect(createProvider(loadConfig({ APP_ORIGIN: 'http://school.test', OPENAI_API_KEY: 'secret' }))).toBeInstanceOf(OpenAiProvider);
    expect(createProvider(loadConfig({ APP_ORIGIN: 'http://school.test', AI_PROVIDER: 'http', AI_HTTP_URL: 'http://localhost/model' }))).toBeInstanceOf(HttpModelProvider);
  });

  it('parses incremental HTTP SSE and sanitizes upstream failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new ReadableStream({ start(controller) {
      for (const part of ['data: {"type":"token","text":"Speed"}\r', '\n\r\ndata: {"type":"done"}\n\n']) controller.enqueue(new TextEncoder().encode(part));
      controller.close();
    } }), { headers: { 'content-type': 'text/event-stream' } })));
    const provider = new HttpModelProvider({ apiUrl: 'http://localhost/model', token: 'private-key', model: 'class9' });
    const events = [];
    for await (const event of provider.stream(input, new AbortController().signal)) events.push(event);
    expect(events).toContainEqual({ type: 'token', text: 'Speed' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('private-key from upstream'); }));
    await expect(provider.ask(input)).rejects.toThrow('cannot connect');
    await expect(provider.ask(input)).rejects.not.toThrow('private-key');
  });

  it('times out a stalled request and propagates abort without credential details', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new Error('secret timeout')), { once: true });
    })));
    const provider = new HttpModelProvider({ apiUrl: 'http://localhost/model', token: '', model: 'class9', timeoutMs: 10 });
    await expect(provider.ask(input)).rejects.toThrow('cannot connect');
  });

  it('sends conversation turns to an OpenAI-compatible model without duplicating history', async () => {
    const fetch = vi.fn(async () => new Response('data: {"choices":[{"delta":{"content":"Think about distance."}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetch);
    const provider = new OpenAiProvider({ apiUrl: 'https://provider.test/v1/chat/completions', apiKey: 'test-key', model: 'tutor' });
    const history = [{ role: 'user' as const, content: 'Explain speed' }, { role: 'assistant' as const, content: 'Distance per unit time.' }];
    const events = [];
    for await (const event of provider.stream({ ...input, question: 'Why?', history }, new AbortController().signal)) events.push(event);
    const payload = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(payload.messages.slice(1, 3)).toEqual(history);
    expect(JSON.parse(payload.messages[3].content)).not.toHaveProperty('history');
    expect(events).toContainEqual({ type: 'token', text: 'Think about distance.' });
  });
});
