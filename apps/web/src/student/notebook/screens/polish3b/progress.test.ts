import { describe, expect, it } from 'vitest';
import { monthAward, monthDays } from './progress';

describe('notebook month', () => {
  it('starts on Monday, includes the whole month and keeps freezes distinct', () => {
    const days = monthDays('2026-10-30', ['2026-10-29', '2026-10-29'], ['2026-10-28']);
    expect(days[0]?.day).toBe('2026-09-28');
    expect(days.at(-1)?.day).toBe('2026-11-01');
    expect(days.filter((day) => day.studied)).toHaveLength(1);
    expect(days.find((day) => day.frozen)?.day).toBe('2026-10-28');
    expect(days.find((day) => day.today)?.number).toBe(30);
  });
  it('handles leap years and IST award boundaries', () => {
    expect(monthDays('2024-02-02', [], []).filter((day) => !day.outside)).toHaveLength(29);
    expect(monthAward(Date.parse('2026-09-30T19:00:00Z'), '2026-10-01')).toBe(true);
    expect(monthAward(Date.parse('2026-09-30T18:00:00Z'), '2026-10-01')).toBe(false);
  });
});
