import { describe, expect, it } from 'vitest';
import { weekStartIST } from './parent';

describe('parent week', () => {
  it('changes weeks at midnight in India, not in the browser timezone', () => {
    expect(new Date(weekStartIST(Date.parse('2026-11-01T18:29:00Z'))).toISOString()).toBe('2026-10-26T06:00:00.000Z');
    expect(new Date(weekStartIST(Date.parse('2026-11-01T18:30:00Z'))).toISOString()).toBe('2026-11-02T06:00:00.000Z');
  });
});
