import { LoginSchema, MeSchema } from '@vidhyasaathy/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, getJson, inlineFieldErrors, postEmpty, postJson, validateForm } from './client';

const me = {
  school: { id: '5d5f0c4a-2e3b-4c1d-8f6a-9b0c1d2e3f4a', name: 'North Ridge School' },
  profile: {
    id: '6e6f1d5b-3f4c-4d2e-9a7b-0c1d2e3f4a5b',
    userId: '7f708e6c-405d-4e3f-8b8c-1d2e3f4a5b6c',
    schoolId: '5d5f0c4a-2e3b-4c1d-8f6a-9b0c1d2e3f4a',
    name: 'Mina Rao',
    role: 'admin',
  },
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('sends cookies and parses the signed-in profile', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(200, me)));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getJson('/me', MeSchema)).resolves.toEqual(me);
    expect(fetchMock).toHaveBeenCalledWith('/api/me', expect.objectContaining({ credentials: 'include' }));
  });

  it('maps field errors and rate limits', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Check the submitted fields.',
      fields: { email: ['Invalid email'] },
    }))));
    const error = await postJson('/auth/login', MeSchema, { email: 'nope', password: 'short' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    if (!(error instanceof ApiClientError)) throw error;
    expect(inlineFieldErrors(error.fields).email).toBe('Enter a valid email address.');

    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('slow down', { status: 429 }))));
    await expect(postJson('/auth/login', MeSchema, {})).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
  });

  it('reports network failures and treats logout 204 as success', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    await expect(getJson('/me', MeSchema)).rejects.toMatchObject({ code: 'NETWORK', status: 0 });

    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));
    await expect(postEmpty('/auth/logout')).resolves.toBeUndefined();
  });

  it('checks a sign-in form before it is sent', () => {
    const invalid = validateForm(LoginSchema, { email: 'not-an-email', password: 'short' });
    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.fields.email).toBe('Enter a valid email address.');
    expect(invalid.fields.password).toBe('Use at least 12 characters.');
  });
});
