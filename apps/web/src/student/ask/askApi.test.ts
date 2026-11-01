import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerQuickTry, readAskStream, relativeDay, snapDoubt, streamAsk, type AskEvent } from './askApi';

afterEach(() => vi.unstubAllGlobals());
function response(text: string, size = 1) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size));
    controller.close();
  } }));
}
const done = 'event: done\ndata: {"messageId":"m","text":"Guarded final","flags":{"homeworkGuard":true,"honestUnsure":false,"clarifying":false}}\n\n';
describe('Ask transport', () => {
  it('parses named SSE, CRLF, multiline data and split UTF-8; final text is authoritative', async () => {
    const events: AskEvent[] = [];
    await readAskStream(response(': keepalive\r\n\r\nevent: thinking\r\ndata: {}\r\n\r\nevent: token\r\ndata: {"text":\r\ndata: "सोचो…"}\r\n\r\n' + done), (event) => events.push(event));
    expect(events.map((e) => e.type)).toEqual(['thinking', 'token', 'done']);
    expect(events[1]?.data).toEqual({ text: 'सोचो…' });
    expect(events.at(-1)?.data).toMatchObject({ text: 'Guarded final' });
  });
  it('requires a terminal event, rejects malformed data, and releases the reader', async () => {
    const interrupted = response('event: token\ndata: {"text":"partial"}\n\n');
    await expect(readAskStream(interrupted, () => undefined)).rejects.toThrow('interrupted');
    expect(interrupted.body?.locked).toBe(false);
    await expect(readAskStream(response('event: token\ndata: {}\n\n'), () => undefined)).rejects.toThrow();
  });
  it('aborts a pending read without emitting an error or hanging', async () => {
    const controller = new AbortController();
    const res = new Response(new ReadableStream());
    const reading = readAskStream(res, () => undefined, controller.signal);
    controller.abort();
    await expect(reading).rejects.toMatchObject({ name: 'AbortError' });
    expect(res.body?.locked).toBe(false);
  });
  it('uses the authenticated API base and server error codes', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'budget', message: 'Rest' }), { status: 429 }));
    vi.stubGlobal('fetch', fetch);
    await expect(streamAsk({ clientEventId: 'e', text: 'Why?', style: 'hints', mode: 'learn' }, () => undefined, new AbortController().signal)).rejects.toMatchObject({ code: 'budget' });
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/ask/stream');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
  });
  it('includes thread and stable event IDs in quick-try submissions', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ correct: true, correctOptionId: 'a', explanation: 'From notes', xp: 10 })));
    vi.stubGlobal('fetch', fetch);
    await answerQuickTry('q', { clientEventId: 'retry-id', threadId: 't', optionId: 'a' });
    expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({ clientEventId: 'retry-id', threadId: 't', optionId: 'a' });
  });
  it('uploads multipart without a JSON content-type', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ snapId: 's', status: 'not_configured' })));
    vi.stubGlobal('fetch', fetch);
    await snapDoubt(new File(['photo'], 'notes.png', { type: 'image/png' }), new AbortController().signal);
    expect(fetch.mock.calls[0]?.[1].body).toBeInstanceOf(FormData);
    expect(fetch.mock.calls[0]?.[1].headers).toBeUndefined();
  });
  it('formats relative dates at IST midnight, not local midnight', () => {
    const now = new Date('2026-10-31T19:00:00Z');
    expect(relativeDay('2026-10-31T18:45:00Z', now)).toBe('now');
    expect(relativeDay('2026-10-31T17:00:00Z', now)).toBe('Sat');
    expect(relativeDay('2026-10-22T12:00:00Z', now)).toBe('22 Oct');
  });
});
