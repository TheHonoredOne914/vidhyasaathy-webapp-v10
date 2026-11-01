import { ApiErrorSchema } from '@vidhyasaathy/contracts';
import { ZodError, type ZodType, type ZodTypeDef } from 'zod';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function apiBase(): string {
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw new ApiClientError(0, 'CONFIG', 'VITE_API_URL is not set.');
  return base.replace(/\/$/, '');
}

export function friendlyMessage(message: string): string {
  if (message.includes('at least 12')) return 'Use at least 12 characters.';
  if (message.includes('at least 1')) return 'Enter a value.';
  if (message.includes('at most 128')) return 'Use at most 128 characters.';
  if (message.includes('at most 120')) return 'Use at most 120 characters.';
  if (message.includes('at most 254')) return 'Use at most 254 characters.';
  if (message === 'Invalid email') return 'Enter a valid email address.';
  if (message === 'Invalid date') return 'Enter a date.';
  if (message === 'Invalid uuid') return 'Choose a valid account or item.';
  return message;
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string' || fields[key]) continue;
    fields[key] = friendlyMessage(issue.message);
  }
  return fields;
}

export function validateForm<T>(schema: ZodType<T>, value: unknown): { ok: true; data: T } | { ok: false; fields: Record<string, string> } {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, fields: zodFieldErrors(parsed.error) };
}

async function errorFrom(response: Response): Promise<ApiClientError> {
  const payload: unknown = await response.json().catch(() => null);
  const parsed = ApiErrorSchema.safeParse(payload);
  if (parsed.success) {
    return new ApiClientError(response.status, parsed.data.code, parsed.data.message, parsed.data.fields ?? {});
  }
  if (response.status === 429) {
    return new ApiClientError(429, 'RATE_LIMITED', 'Too many requests. Try again later.');
  }
  return new ApiClientError(response.status, 'REQUEST_FAILED', 'The request could not be completed.');
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    const response = await fetch(`${apiBase()}${path}`, { ...init, headers, credentials: 'include' });
    if (response.status === 401 && path !== '/me' && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('session-expired'));
    }
    return response;
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')) throw error;
    throw new ApiClientError(0, 'NETWORK', 'The network request failed. Check your connection and try again.');
  }
}

async function readJson<T>(response: Response, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  if (!response.ok) throw await errorFrom(response);
  const payload: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new ApiClientError(response.status, 'INVALID_RESPONSE', 'The server response did not match the expected format.');
  return parsed.data;
}

export function getJson<T>(path: string, schema: ZodType<T, ZodTypeDef, unknown>, signal?: AbortSignal): Promise<T> {
  return apiFetch(path, signal ? { signal } : {}).then((response) => readJson(response, schema));
}

/** POSTs that save learning evidence; after the server acknowledges one, learner views (home, progress, badges) refetch. */
const LEARNING_WRITE = /^\/(?:concepts\/[^/]+\/(?:lesson\/(?:checkpoint|faded|explain|flashcard)|remediation\/check)|games\/[^/]+\/sessions\/[^/]+\/(?:answer|finish)|chapters\/[^/]+\/diagnostic|sessions\/[^/]+\/check|ask\/quick-try\/(?:[^/]+\/)?answer|student\/(?:warmup|daily-challenge|practice))/;
export const LEARNER_CHANGED = 'learner-changed';

export function postJson<T>(path: string, schema: ZodType<T, ZodTypeDef, unknown>, body: unknown, signal?: AbortSignal): Promise<T> {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  }).then((response) => readJson(response, schema)).then((result) => {
    if (LEARNING_WRITE.test(path) && typeof window !== 'undefined') window.dispatchEvent(new Event(LEARNER_CHANGED));
    return result;
  });
}

export function putJson<T>(path: string, schema: ZodType<T, ZodTypeDef, unknown>, body: unknown): Promise<T> {
  return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }).then((response) => readJson(response, schema));
}

export async function postEmpty(path: string): Promise<void> {
  const response = await apiFetch(path, { method: 'POST' });
  if (response.status === 204) return;
  throw await errorFrom(response);
}

export function inlineFieldErrors(fields: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fields)) {
    const message = messages[0];
    if (message) result[key] = friendlyMessage(message);
  }
  return result;
}

export { errorFrom };

// Unlike JSON requests, multipart uploads need the browser-generated boundary.
export async function uploadForm(path: string, body: FormData, signal: AbortSignal): Promise<Response> {
  try {
    const response = await fetch(`${apiBase()}${path}`, { method: 'POST', body, signal, credentials: 'include' });
    if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
    return response;
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ApiClientError(0, 'NETWORK', 'The network request failed. Check your connection and try again.');
  }
}
