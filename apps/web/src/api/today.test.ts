import { expect, it } from 'vitest';
import type { StudentHome } from '@vidhyasaathy/contracts';
import { fallbackToday } from './today';

it('offers one safe next step without exposing resume state', () => {
  const home = { greeting: { dateIST: '2026-11-02', line: 'Welcome' }, streak: { currentDays: 2 }, nextAction: { kind: 'resume', title: 'Continue Motion', href: '/student', estMinutes: 8, resumeState: 'step=4' }, todaysGoal: { items: Array.from({ length: 4 }, () => ({ label: 'Recall an idea', href: '/student/revise', done: false })) } } as unknown as StudentHome;
  const today = fallbackToday(home);
  expect(today.source).toBe('mock');
  expect(today.next).toHaveLength(3);
  expect(JSON.stringify(today)).not.toContain('step=');
  expect(today.primary.title).toBe('Continue Motion');
});
