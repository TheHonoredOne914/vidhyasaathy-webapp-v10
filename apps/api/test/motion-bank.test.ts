import { expect, it } from 'vitest';
import { motionContents, motionDiagnostic, motionPractice } from '../src/content/motion-bank.ts';

const find = (bit: string) => {
  const question = motionPractice.find((row) => row.prompt.includes(bit));
  if (!question) throw new Error(`Missing question: ${bit}`);
  return question;
};

it('explains every Class 9 distractor and recomputes the numerical answers', () => {
  for (const item of motionContents()) {
    if (item.type !== 'mcq' || item.role !== 'practice') continue;
    const wrong = item.options.filter((option) => option !== item.answer);
    expect(wrong).toHaveLength(3);
    expect(item.mistakes?.map((miss) => miss.option).sort()).toEqual([...wrong].sort());
    for (const miss of item.mistakes ?? []) {
      expect(miss.explanation.length).toBeGreaterThan(20);
      expect(miss.fix?.length).toBeGreaterThan(8);
      expect(miss.explanation).not.toBe(item.prompt);
      expect(miss.fix).not.toBe(item.prompt);
      expect(miss.explanation).not.toBe(miss.fix);
    }
  }
  expect(find('4 m east').answer).toBe(`${Math.hypot(4, 3)} m`);
  expect(find('2 min 20 s').answer).toBe(`${(10 * Math.SQRT2).toFixed(1)} m`);
  expect(find('100 km in 2 h').answer).toBe(`${100 / 2} km/h`);
  expect(find('2400 km').answer).toBe(`${(2400 - 2000) / 8} km/h`);
  expect(find('15 minutes').answer).toBe(`${10 / 0.25} km/h`);
  const bus = ((60 - 80) * (5 / 18)) / 5;
  expect(find('80 km/h to 60').answer).toBe(`${bus.toFixed(2)} m/s²`);
  const train = (40 * (5 / 18)) / 600;
  expect(find('40 km/h in 10 minutes').answer).toBe(`${train.toFixed(4)} m/s²`);
  const u = 18 * (5 / 18);
  const v = 36 * (5 / 18);
  const acceleration = (v - u) / 5;
  const distance = u * 5 + 0.5 * acceleration * 5 * 5;
  expect(find('18 km/h to 36').answer).toBe(`${distance} m`);
  expect(find('60 m at 10 s').answer).toBe(`${60 / 10} m/s`);
  expect(find('8 m/s from 0 to 5 s').answer).toBe(`${8 * 5} m`);
  expect(find('accelerates at 2 m/s² through 9 m').answer).toBe(`${Math.sqrt(2 * 2 * 9)} m/s`);
  expect(find('u = 0, a = 4').answer).toBe(`${0.5 * 4 * 3 * 3} m`);
});

it('keeps the Class 7 diagnostic items on earlier concepts', () => {
  expect(motionDiagnostic.map((row) => row.role)).toEqual(['diagnostic', 'diagnostic', 'diagnostic', 'diagnostic', 'diagnostic', 'diagnostic']);
  expect(new Set(motionDiagnostic.map((row) => row.concept))).toEqual(new Set(['Motion and Time', 'Units and ratios', 'Reading graphs']));
  expect(motionDiagnostic.every((row) => row.options.includes("Haven't learned this yet") && row.answer !== "Haven't learned this yet")).toBe(true);
  expect(find('4 m east').role).toBe('practice');
});
