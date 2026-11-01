import { describe, expect, it } from 'vitest';
import type { AskResponse } from '@vidhyasaathy/contracts';
import { askMessage } from './ask';

describe('notebook ask notices', () => {
  const reply: AskResponse = { status: 'answered', message: 'Released note text.', hintLevel: 1, socratic: true, citations: [], cached: false, updatedAt: 1 };
  it('keeps real note answers and not-in-notes responses', () => {
    expect(askMessage(reply)).toBe(reply.message);
    expect(askMessage({ ...reply, status: 'not_in_notes' })).toBe(reply.message);
  });
  it('does not expose configuration or provider errors', () => {
    for (const status of ['not_configured', 'unavailable'] as const) expect(askMessage({ ...reply, status, message: 'SECRET_PROVIDER_ERROR' })).not.toContain('SECRET_PROVIDER_ERROR');
  });
});
