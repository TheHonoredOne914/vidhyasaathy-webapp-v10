import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { LEARNER_CHANGED, postJson } from './client';

afterEach(() => vi.unstubAllGlobals());

it('announces saved learning evidence so home and progress refetch (UX02)', async () => {
  const target = new EventTarget();
  const heard = vi.fn();
  target.addEventListener(LEARNER_CHANGED, heard);
  vi.stubGlobal('window', target);
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ ok: true }))));
  await postJson('/concepts/c1/lesson/checkpoint', z.object({ ok: z.boolean() }), { itemId: 'i' });
  expect(heard).toHaveBeenCalledTimes(1);
  await postJson('/announcements', z.object({ ok: z.boolean() }), {});
  expect(heard).toHaveBeenCalledTimes(1);
});

it('does not announce a rejected answer', async () => {
  const target = new EventTarget();
  const heard = vi.fn();
  target.addEventListener(LEARNER_CHANGED, heard);
  vi.stubGlobal('window', target);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'INVALID_ANSWER', message: 'Choose one.' }), { status: 400 })));
  await expect(postJson('/concepts/c1/lesson/checkpoint', z.object({ ok: z.boolean() }), {})).rejects.toBeTruthy();
  expect(heard).not.toHaveBeenCalled();
});
