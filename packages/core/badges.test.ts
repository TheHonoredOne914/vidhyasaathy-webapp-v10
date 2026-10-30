import { expect, it } from 'vitest';
import { evaluateBadges } from './badges.ts';

it('awards Fixed It, Comeback King, and Dushman Slayer once, and never Boss Buster', () => {
  expect(evaluateBadges({ id: 'e1', kind: 'mastery', conceptId: 'speed', fromLevel: 1, toLevel: 2 }, []))
    .toEqual([{ badgeId: 'fixed_it', scopeKey: 'speed', triggerEventId: 'e1' }]);
  expect(evaluateBadges({ id: 'e2', kind: 'mastery', conceptId: 'speed', fromLevel: 2, toLevel: 3 }, [])).toEqual([]);
  expect(evaluateBadges({ id: 'e3', kind: 'recovery_completed', absentDays: 3, absenceStartDay: '2026-10-20' }, []))
    .toEqual([{ badgeId: 'comeback_king', scopeKey: '2026-10-20', triggerEventId: 'e3' }]);
  expect(evaluateBadges({ id: 'e4', kind: 'recovery_completed', absentDays: 2, absenceStartDay: '2026-10-20' }, [])).toEqual([]);
  expect(evaluateBadges({ id: 'e5', kind: 'dushman_retired', conceptId: 'speed', toLevel: 3 }, []))
    .toEqual([{ badgeId: 'dushman_slayer', scopeKey: 'speed', triggerEventId: 'e5' }]);
  const again = evaluateBadges(
    { id: 'e6', kind: 'mastery', conceptId: 'speed', fromLevel: 1, toLevel: 2 },
    [{ badgeId: 'fixed_it', scopeKey: 'speed' }],
  );
  expect(again).toEqual([]);
  expect(evaluateBadges({ id: 'boss', kind: 'mastery', conceptId: 'chapter', fromLevel: 3, toLevel: 4 }, [])).toEqual([]);
});
