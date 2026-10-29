import { expect, it } from 'vitest';
import {
  BRIDGE_ON_DROP, LEVEL_WORDS, NEW_WORD, NOT_TAUGHT, SESSION_BRIDGE, chapterBand, classifyError, countsAsMastery,
  diagnosticEntry, initialLadder, isMisconception, isNotTaughtAnswer, levelWord, masteryFromEvents, pickLadderItem,
  sessionGate, stepLadder, type LearningEvent,
} from './learning.ts';

const sure = (correct: boolean, level: LearningEvent['level'], timeMs = 20_000): LearningEvent =>
  ({ correct, confidence: 'sure', level, timeMs });

it('names levels with friendly words and hides the number from that label', () => {
  expect(levelWord(null)).toBe(NEW_WORD);
  expect(levelWord(1)).toBe(LEVEL_WORDS[1]);
  expect(levelWord(2)).toBe('Almost there');
  expect(levelWord(3)).toBe('Mastered');
  expect(levelWord(4)).toBe('Top form');
  expect(Object.values(LEVEL_WORDS).join(' ')).not.toMatch(/0-25|25-50|band|rank/i);
});

it('does not treat a correct guess as mastery and flags sure-and-wrong as a misconception', () => {
  expect(countsAsMastery({ correct: true, confidence: 'guess' })).toBe(false);
  expect(countsAsMastery({ correct: true, confidence: 'sure' })).toBe(true);
  expect(countsAsMastery({ correct: true, confidence: 'unsure' })).toBe(true);
  expect(isMisconception({ correct: false, confidence: 'sure' })).toBe(true);
  expect(isMisconception({ correct: false, confidence: 'guess' })).toBe(false);
  expect(isMisconception({ correct: false, confidence: 'sure', notTaught: true })).toBe(false);
  const guessed = masteryFromEvents([
    { correct: true, confidence: 'guess', level: 4, timeMs: 10_000 },
    { correct: true, confidence: 'guess', level: 4, timeMs: 10_000 },
  ]);
  expect(guessed.level).toBe(1);
  expect(guessed.score).toBe(0);
});

it('earns L2 at 60 percent, L3 from sure application answers, and L4 from sure advanced answers', () => {
  expect(masteryFromEvents([]).level).toBeNull();
  expect(masteryFromEvents([sure(false, 1), sure(true, 1)]).level).toBe(1);
  const steady = [sure(true, 1), sure(true, 2), sure(true, 2), sure(false, 1)];
  expect(masteryFromEvents(steady).level).toBe(2);
  const strong = [sure(true, 3), sure(true, 3), sure(true, 3), sure(true, 2)];
  expect(masteryFromEvents(strong).level).toBe(3);
  const top = [sure(true, 4), sure(true, 4), sure(true, 4)];
  expect(masteryFromEvents(top)).toMatchObject({ level: 4, misconception: false });
  expect(masteryFromEvents([sure(false, 2), ...top]).misconception).toBe(true);
});

it('starts at L2, climbs after three correct, and drops after two wrong with bridge text', () => {
  let state = initialLadder();
  expect(state.level).toBe(2);
  state = stepLadder(state, true);
  state = stepLadder(state, true);
  let climbed = stepLadder(state, true);
  expect(climbed).toMatchObject({ level: 3, dropped: false, bridge: null, streakCorrect: 0 });
  climbed = stepLadder(climbed, false);
  const dropped = stepLadder(climbed, false);
  expect(dropped).toMatchObject({ level: 2, dropped: true, bridge: BRIDGE_ON_DROP, streakWrong: 0 });
  const floor = stepLadder(stepLadder({ level: 1, streakCorrect: 0, streakWrong: 1 }, false), false);
  expect(floor.level).toBe(1);
  const ceiling = [1, 2, 3].reduce((current) => stepLadder(current, true), { level: 4, streakCorrect: 2, streakWrong: 0 });
  expect(ceiling.level).toBe(4);
});

it('classifies error DNA and leaves an untaught answer unpenalised', () => {
  expect(isNotTaughtAnswer(NOT_TAUGHT)).toBe(true);
  expect(classifyError({ correct: false, confidence: 'guess', level: 2, timeMs: 30_000 })).toBe('guess');
  expect(classifyError({ correct: true, confidence: 'guess', level: 2, timeMs: 30_000 })).toBe('guess');
  expect(classifyError({ correct: false, confidence: 'sure', level: 2, timeMs: 40_000 })).toBe('concept_gap');
  expect(classifyError({ correct: false, confidence: 'unsure', level: 2, timeMs: 2_000 }, 3)).toBe('careless');
  expect(classifyError({ correct: false, confidence: 'unsure', level: 2, timeMs: 20_000, markedFamily: 'method' })).toBe('method');
  expect(classifyError({ correct: false, confidence: 'sure', level: 1, timeMs: 10_000, notTaught: true })).toBeNull();
  expect(classifyError(sure(true, 2))).toBeNull();
});

it('keeps a session open below 60 percent and completes at or above it', () => {
  expect(sessionGate([false, false, true, false, true])).toMatchObject({ passed: false, bridge: SESSION_BRIDGE, ratio: 0.4 });
  expect(sessionGate([true, true, true, false, false]).passed).toBe(true);
  expect(sessionGate([true, true, false, null, null])).toMatchObject({ passed: true, marked: 3, ratio: 2 / 3 });
  expect(sessionGate([null, null])).toMatchObject({ passed: true, bridge: null });
});

it('places a chapter band from mastery scores and skips an empty chapter', () => {
  expect(chapterBand([])).toBeNull();
  expect(chapterBand([0.1, 0.2])).toBe('0-25');
  expect(chapterBand([0.25])).toBe('25-50');
  expect(chapterBand([0.5, 0.6])).toBe('50-75');
  expect(chapterBand([0.75, 0.9])).toBe('75-100');
});

it('routes a diagnostic without punishing an untaught prerequisite', () => {
  const missed = [{ correct: false, notTaught: false }, { correct: false, notTaught: false }, { correct: true, notTaught: false }];
  expect(diagnosticEntry(missed)).toEqual({ level: 1, route: 'repair' });
  const fresh = Array.from({ length: 5 }, () => ({ correct: false, notTaught: true }));
  expect(diagnosticEntry(fresh)).toEqual({ level: 1, route: 'repair' });
  const strong = [{ correct: true, notTaught: false }, { correct: true, notTaught: false }, { correct: true, notTaught: false }, { correct: true, notTaught: false }, { correct: false, notTaught: false }];
  expect(diagnosticEntry(strong)).toEqual({ level: 3, route: 'challenge' });
  expect(diagnosticEntry([{ correct: true, notTaught: false }, { correct: false, notTaught: false }])).toEqual({ level: 2, route: 'steady' });
});

it('picks the question closest to the ladder', () => {
  const items = [
    { id: 'a', conceptId: 'speed', level: 1 as const },
    { id: 'b', conceptId: 'speed', level: 3 as const },
    { id: 'c', conceptId: 'accel', level: 4 as const },
  ];
  expect(pickLadderItem(items, [{ conceptId: 'speed', level: 3 }])?.id).toBe('b');
  expect(pickLadderItem(items, [])?.id).toBe('a');
  expect(pickLadderItem([], [])).toBeNull();
});
