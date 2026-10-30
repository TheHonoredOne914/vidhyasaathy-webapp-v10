import { expect, it } from 'vitest';
import { motionDiagnostic, motionExtra, motionExtraContents, motionPractice } from '../src/content/motion-bank.ts';

const CONCEPTS = ['Distance & Displacement', 'Speed & Velocity', 'Acceleration', 'Uniform and non-uniform motion', 'Distance-time graphs', 'Velocity-time graphs'];
const find = (bit: string) => {
  const question = motionExtra.find((row) => row.prompt.includes(bit));
  if (!question) throw new Error(`Missing question: ${bit}`);
  return question;
};

it('gives every ported distractor a family, a reason and a fix', () => {
  for (const item of motionExtraContents()) {
    if (item.type !== 'mcq') throw new Error('Ported Motion questions are MCQs.');
    expect(item.role).toBe('practice');
    const wrong = item.options.filter((option) => option !== item.answer);
    expect(wrong).toHaveLength(3);
    expect(item.mistakes?.map((miss) => miss.option).sort()).toEqual([...wrong].sort());
    for (const miss of item.mistakes ?? []) {
      expect(['concept_gap', 'careless', 'method']).toContain(miss.errorType);
      expect(miss.explanation.length).toBeGreaterThan(20);
      expect(miss.fix?.length).toBeGreaterThan(8);
      expect(miss.explanation).not.toBe(miss.fix);
    }
  }
});

it('keeps the ported bank separate from the existing one and inside Class 9 Motion', () => {
  const numbers = motionExtra.map((row) => row.n);
  expect(new Set(numbers).size).toBe(numbers.length);
  const existing = [...motionPractice, ...motionDiagnostic].map((row) => Number(row.id.slice(-12)));
  expect(numbers.filter((n) => existing.includes(n) || (n >= 1500 && n < 1600))).toEqual([]);
  const prompts = [...motionPractice, ...motionExtra].map((row) => row.prompt);
  expect(new Set(prompts).size).toBe(prompts.length);
  for (const concept of CONCEPTS) expect(motionExtra.filter((row) => row.concept === concept).length).toBeGreaterThanOrEqual(6);
  expect(motionExtra.every((row) => CONCEPTS.includes(row.concept))).toBe(true);
  expect(motionExtra.some((row) => /relative to the road|v²\/r|centripetal|\bHz\b|northeast/.test(`${row.prompt} ${row.options.join(' ')}`))).toBe(false);
  expect(motionExtra.some((row) => /\^|\*/.test(`${row.prompt} ${row.options.join(' ')} ${row.explanation}`))).toBe(false);
});

it('recomputes the numerical answers', () => {
  expect(find('2.5 laps of a 200 m').answer).toBe(`${2.5 * 200} m; ${(200 / Math.PI).toFixed(1)} m`);
  expect(find('6 m east, then 2 m west').answer).toBe(`${6 - 2} m east`);
  expect(find('x = 3 m to x = -5 m').answer).toBe(`${-5 - 3} m`);
  expect(find('150 m in 10 s').answer).toBe(`${150 / 10} m/s`);
  expect(find('24 m west in 6 s').answer).toBe(`${24 / 6} m/s west`);
  expect(find('120 m east in 20 s').answer).toBe(`${(160 / 30).toFixed(2)} m/s; ${(80 / 30).toFixed(2)} m/s east`);
  expect(find('900 m north in 60 s').answer).toBe(`${(600 / 90).toFixed(2)} m/s north`);
  expect(find('one half of a route at 30 km/h').answer).toBe(`${2 / (1 / 30 + 1 / 60)} km/h`);
  expect(find('180 km in 3 h').answer).toBe(`${180 / 3} km/h`);
  expect(find('12 km in 40 minutes').answer).toBe(`${12 / (40 / 60)} km/h`);
  expect(find('waits 30 min').answer).toBe(`${60 / 2.5} km/h`);
  expect(find('2 km to school at 4 km/h').answer).toBe(`${Number((4 / (2 / 4 + 2 / 6)).toFixed(2))} km/h`);
  expect(find('20 km/h and 40 km/h').answer).toBe(`${(20 + 40) / 2} km/h`);
  expect(find('circumference 2 m').answer).toBe(`${2 / 4} m/s`);
  expect(find('4 m/s to 16 m/s in 3 s').answer).toBe(`${(16 - 4) / 3} m/s²`);
  expect(find('10 m/s to 2 m/s in 4 s').answer).toBe(`${(2 - 10) / 4} m/s²`);
  expect(find('6 m/s east to 6 m/s west').answer).toBe(`${(-6 - 6) / 3} m/s²`);
  expect(find('20 m/s brakes uniformly to rest over 5 s').answer).toBe(`${(20 / 2) * 5} m`);
  expect(find('+8 m/s to -4 m/s over 6 s').answer.startsWith(`Acceleration is ${(-4 - 8) / 6} m/s²`)).toBe(true);
  expect(find('starts at 3 m/s').answer).toBe(`${3 + 2 * 5} m/s`);
  expect(find('starts at 4 m/s').answer).toBe(`${4 * 2 + 0.5 * 3 * 2 * 2} m`);
  expect(find('at 5 m/s accelerates').answer).toBe(`${5 + 1.5 * 8} m/s; ${5 * 8 + 0.5 * 1.5 * 8 * 8} m`);
  expect(find('brakes at 4 m/s²').answer).toBe(`${20 / 4} s; ${(20 * 20) / (2 * 4)} m`);
  const a = (25 * 25 - 10 * 10) / (2 * 105);
  expect(find('over 105 m').answer).toBe(`${a} m/s²; ${(25 - 10) / a} s`);
  expect(find('positions 0, 5, 10, 15 m').answer).toBe(`${5 / 2} m/s forward`);
  expect(find('30 m in the first 5 s').answer).toBe(`${30 / 5} m/s then ${50 / 5} m/s`);
  expect(find('2 m at 1 s to 14 m at 5 s').answer).toBe(`${(14 - 2) / (5 - 1)} m/s`);
  expect(find('x = 18 m at 0 s').answer).toBe(`Velocity is ${(6 - 18) / 4} m/s`);
  expect(find('5 m at 0 s to 25 m at 4 s').answer).toBe(`${((25 - 5) / 4) * 7} m`);
  expect(find('2 m/s to 10 m/s in 4 s').answer).toBe(`${(10 - 2) / 4} m/s²; ${((2 + 10) / 2) * 4} m`);
  expect(find('horizontal at -5 m/s').answer).toBe(`0 m/s²; ${-5 * 3} m`);
  expect(find('Velocity is 4 m/s for 5 s').answer).toBe(`${4 * 5} m`);
  expect(find('Velocity is -3 m/s for 4 s').answer).toBe(`${-3 * 4} m`);
  expect(find('0 to 8 m/s over 6 s').answer).toBe(`${0.5 * 6 * 8} m`);
  expect(find('+5 m/s for 4 s').answer).toBe(`${5 * 4 - 2 * 3} m; ${5 * 4 + 2 * 3} m`);
  expect(find('+4 m/s from 0 to 3 s').answer).toBe(`Displacement ${4 * 3 - 4 * 2} m; distance ${4 * 3 + 4 * 2} m`);
});
