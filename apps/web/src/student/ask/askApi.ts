import { z } from 'zod';
import { SaathyArtifactSchema } from '../../../../../packages/contracts/src/ask';
import { apiFetch, ApiClientError, errorFrom, getJson, postJson, uploadForm } from '../../api/client';

export const OptionSchema = z.object({ id: z.string(), text: z.string() });
const ConceptSchema = z.object({ id: z.string(), name: z.string(), subjectName: z.string(), chapterLabel: z.string() });
const CitationSchema = z.object({ chunkId: z.string(), noteTitle: z.string(), page: z.number().optional() });
const FlagsSchema = z.object({ homeworkGuard: z.boolean(), honestUnsure: z.boolean(), clarifying: z.boolean() });
const ChipSchema = z.object({ kind: z.enum(['another', 'why', 'reverse', 'example', 'simpler', 'quiz', 'ask_teacher']), label: z.string() });
export const QuickTrySchema = z.object({
  itemId: z.string(), stem: z.string(), options: z.array(OptionSchema),
  answered: z.object({ optionId: z.string(), correct: z.boolean() }).optional(),
});
export const MessageSchema = z.object({
  id: z.string(), role: z.enum(['student', 'saathy']), text: z.string(), createdAt: z.string(), fromLabel: z.string().optional(),
  citations: z.array(CitationSchema).optional(), flags: FlagsSchema.nullish(),
  quickTry: QuickTrySchema.optional(), followups: z.array(ChipSchema).optional(), artifacts: z.array(SaathyArtifactSchema).optional(), levelCheck: z.object({ chapterId: z.string() }).optional(),
}).transform((value) => ({ ...value, citations: value.citations ?? [] }));
export const ThreadSchema = z.object({
  id: z.string(), title: z.string(), style: z.enum(['hints', 'explain']), mode: z.enum(['learn', 'homework']),
  concept: ConceptSchema.nullable(), purged: z.boolean(), messages: z.array(MessageSchema),
});
export const ThreadsSchema = z.object({ threads: z.array(z.object({
  id: z.string(), title: z.string(), subjectName: z.string().nullable(), conceptName: z.string().nullable(), updatedAt: z.string(),
})) });
export const SavedSchema = z.object({ items: z.array(z.object({
  id: z.string(), title: z.string(), subjectName: z.string().nullable(), savedAt: z.string(), messageId: z.string(),
})) });
export const QuickTryResultSchema = z.object({ correct: z.boolean(), correctOptionId: z.string(), explanation: z.string(), xp: z.number() });
const SnapSchema = z.object({ snapId: z.string(), status: z.enum(['extracted', 'failed', 'not_configured']), extractedText: z.string().optional() });
const EventSchemas = {
  thread: z.object({ threadId: z.string(), title: z.string(), concept: ConceptSchema.nullable(), studentMessageId: z.string(), fromLabel: z.string().optional() }),
  thinking: z.object({}),
  token: z.object({ text: z.string() }),
  citation: CitationSchema,
  quickTry: QuickTrySchema,
  artifacts: z.array(SaathyArtifactSchema).max(4),
  levelCheck: z.object({ chapterId: z.string() }),
  followups: z.object({ chips: z.array(ChipSchema) }),
  done: z.object({ messageId: z.string(), text: z.string(), flags: FlagsSchema }),
  error: z.object({ code: z.enum(['provider_down', 'timeout', 'budget', 'rate_limit', 'invalid']), message: z.string() }),
};
export type AskEvent = { [K in keyof typeof EventSchemas]: { type: K; data: z.infer<(typeof EventSchemas)[K]> } }[keyof typeof EventSchemas];
export type AskMessage = z.infer<typeof MessageSchema>;
export type AskThread = z.infer<typeof ThreadSchema>;
export type AskChip = z.infer<typeof ChipSchema>;
export type QuickTry = z.infer<typeof QuickTrySchema>;
export type QuickTryResult = z.infer<typeof QuickTryResultSchema>;
export type AskRequest = {
  clientEventId: string; threadId?: string; text: string; style: 'hints' | 'explain'; mode: 'learn' | 'homework';
  conceptId?: string | undefined; chapterId?: string | undefined; assignmentItemId?: string | undefined; snapId?: string | undefined;
  from?: { kind: 'practice' | 'lesson' | 'homework' | 'session' | 'home'; ref?: string | undefined; label?: string | undefined };
  followupKind?: Exclude<AskChip['kind'], 'ask_teacher'> | undefined;
};

// SSE frames can cross byte chunks, use CRLF, and contain multiple data lines.
export async function readAskStream(response: Response, onEvent: (event: AskEvent) => void, signal?: AbortSignal): Promise<void> {
  if (!response.body) throw new ApiClientError(502, 'INVALID_RESPONSE', 'The response was interrupted.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let terminal = false;
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal?.addEventListener('abort', abort, { once: true });
  function frame(value: string) {
    let name = '';
    const data: string[] = [];
    for (const line of value.split('\n')) {
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      const content = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') name = content;
      if (field === 'data') data.push(content);
    }
    if (!data.length || !(name in EventSchemas)) return;
    const type = name as keyof typeof EventSchemas;
    const parsed = EventSchemas[type].safeParse(JSON.parse(data.join('\n')));
    if (!parsed.success) throw new ApiClientError(502, 'INVALID_RESPONSE', 'The response was interrupted.');
    // The schema selected by type validates exactly the corresponding event payload.
    onEvent({ type, data: parsed.data } as AskEvent);
    terminal = type === 'done' || type === 'error';
  }
  try {
    while (!terminal) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });
      // Normalize only complete CRLF pairs (a CR can be the last byte in a chunk).
      buffer = buffer.replace(/\r\n/g, '\n');
      let end: number;
      while (!terminal && (end = buffer.indexOf('\n\n')) >= 0) {
        frame(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
      }
      if (done) {
        if (!terminal && buffer.trim()) frame(buffer);
        break;
      }
    }
    if (!terminal) throw new ApiClientError(502, 'INVALID_RESPONSE', 'The response was interrupted.');
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function streamAsk(request: AskRequest, onEvent: (event: AskEvent) => void, signal: AbortSignal): Promise<void> {
  const response = await apiFetch('/ask/stream', { method: 'POST', body: JSON.stringify(request), signal });
  if (!response.ok) throw await errorFrom(response);
  await readAskStream(response, onEvent, signal);
}

export const getThread = (id: string, signal?: AbortSignal): Promise<AskThread> => getJson(`/ask/threads/${encodeURIComponent(id)}`, ThreadSchema, signal);
export const answerQuickTry = (itemId: string, body: { clientEventId: string; threadId: string; optionId: string }, signal?: AbortSignal) =>
  postJson(`/ask/quick-try/${encodeURIComponent(itemId)}/answer`, QuickTryResultSchema, body, signal);

export const getQuickHint = (itemId: string, threadId: string, stage: 'nudge' | 'hint' | 'worked-step') =>
  postJson(`/ask/quick-try/${encodeURIComponent(itemId)}/hint`, z.object({ stage: z.enum(['nudge', 'hint', 'worked-step']), text: z.string() }), { threadId, stage });

export async function snapDoubt(file: File, signal: AbortSignal) {
  const body = new FormData();
  body.append('file', file);
  const response = await uploadForm('/ask/snap', body, signal);
  if (!response.ok) throw await errorFrom(response);
  return SnapSchema.parse(await response.json());
}

export const confirmSnap = (id: string, text: string, signal: AbortSignal) =>
  postJson(`/ask/snap/${encodeURIComponent(id)}/confirm`, z.object({ snapId: z.string(), text: z.string() }), { text }, signal);

export function relativeDay(value: string, now = new Date()): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  if (now.getTime() - date.getTime() < 60 * 60 * 1000 && date <= now) return 'now';
  if (day(date) === day(now)) return 'today';
  const days = (Date.parse(day(now)) - Date.parse(day(date))) / 86400000;
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', ...(days > 0 && days <= 6 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }) }).format(date);
}
