import { expect, it } from 'vitest';
import { dushmanRetirement, selectDushman, type DushmanEvidence, type DushmanState } from './dushman.ts';

function rows(conceptId: string, pattern: readonly { correct: boolean; confidence: DushmanEvidence['confidence'] }[], start = 0): DushmanEvidence[] {
  return pattern.map((row, index) => ({ conceptId, ...row, notTaught: false, createdAt: start + index }));
}

it('picks the three weakest taught concepts and retires at mastered', () => {
  const states: DushmanState[] = [
    { conceptId: 'new', name: 'New', level: null },
    { conceptId: 'mastered', name: 'Mastered', level: 3 },
    { conceptId: 'speed', name: 'Speed', level: 1 },
    { conceptId: 'distance', name: 'Distance', level: 2 },
    { conceptId: 'graphs', name: 'Graphs', level: 2 },
    { conceptId: 'units', name: 'Units', level: 1 },
  ];
  const evidence = [
    ...rows('mastered', [{ correct: true, confidence: 'sure' }, { correct: true, confidence: 'sure' }, { correct: true, confidence: 'sure' }]),
    ...rows('speed', [{ correct: false, confidence: 'sure' }, { correct: false, confidence: 'sure' }, { correct: true, confidence: 'unsure' }], 10),
    ...rows('distance', [{ correct: true, confidence: 'sure' }, { correct: false, confidence: 'unsure' }, { correct: true, confidence: 'sure' }], 1),
    ...rows('graphs', [{ correct: false, confidence: 'unsure' }, { correct: false, confidence: 'unsure' }, { correct: false, confidence: 'guess' }], 20),
    ...rows('units', [{ correct: false, confidence: 'sure' }], 5),
    ...rows('new', [{ correct: false, confidence: 'sure' }, { correct: false, confidence: 'sure' }, { correct: false, confidence: 'sure' }]),
  ];
  expect(selectDushman(states, evidence).map((row) => row.conceptId)).toEqual(['speed', 'graphs', 'distance']);
  expect(selectDushman(states, evidence, '0-25').map((row) => row.conceptId)).toEqual(['speed', 'units', 'graphs']);
  expect(selectDushman(states, evidence, '50-75').some((row) => row.conceptId === 'new')).toBe(false);
  const earlyOnly = selectDushman([{ conceptId: 'units', name: 'Units', level: 1 }], evidence, '25-50');
  expect(earlyOnly).toEqual([]);
  expect(selectDushman([{ conceptId: 'units', name: 'Units', level: 1 }], evidence, '0-25')).toHaveLength(1);
  expect(dushmanRetirement(2)).toEqual({ retire: false, badgeId: null });
  expect(dushmanRetirement(3)).toEqual({ retire: true, badgeId: 'dushman_slayer' });
});
