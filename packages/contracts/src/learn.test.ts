import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ConceptLessonSchema, MovingObjectBlockSchema, SliderGraphBlockSchema, WorkedProblemBlockSchema, parseLearnBlock, toPublicLesson,
} from './learn.ts';

const slider = { kind: 'slider_graph' as const, title: 'Velocity-time', axis: 'velocity-time' as const, u: 0, v: 10, t: 5, a: 2 };

describe('learn block validator', () => {
  it('accepts acceleration that matches (v - u) / t and rejects a mismatch', () => {
    expect(parseLearnBlock(slider).a).toBe(2);
    expect(SliderGraphBlockSchema.safeParse({ ...slider, a: 9 }).success).toBe(false);
  });

  it('accepts speed that matches distance / time and rejects a mismatch', () => {
    const moving = { kind: 'moving_object' as const, title: 'Car', vehicle: 'car' as const, distance: 20, time: 5, speed: 4 };
    expect(MovingObjectBlockSchema.safeParse(moving).success).toBe(true);
    expect(MovingObjectBlockSchema.safeParse({ ...moving, speed: 20 }).success).toBe(false);
  });

  it('recomputes s = ut + ½at² and rejects a step that disagrees', () => {
    const worked = {
      kind: 'worked_problem' as const, title: 'Stopping', prompt: 'From rest to 10 m/s in 5 s.',
      u: 0, v: 10, t: 5, a: 2, s: 25,
      steps: [
        { text: 'u is 0.', quantity: 'u' as const, value: 0 },
        { text: 'a is 2 m/s².', quantity: 'a' as const, value: 2 },
      ],
    };
    expect(WorkedProblemBlockSchema.safeParse(worked).success).toBe(true);
    expect(WorkedProblemBlockSchema.safeParse({ ...worked, s: 10 }).success).toBe(false);
    expect(WorkedProblemBlockSchema.safeParse({
      ...worked, steps: [...worked.steps, { text: 'Wrong distance.', quantity: 's', value: 1 }],
    }).success).toBe(false);
  });
});

describe('public lesson', () => {
  it('keeps answer keys off the student payload', () => {
    const id = randomUUID();
    const lesson = ConceptLessonSchema.parse({
      bridge: { prereqTitle: 'Motion and Time', link: 'Speed is distance divided by time.', repair: 'Three quiet minutes on equal distances.' },
      notes: {
        simple: 'Speed (चाल) is distance divided by time.',
        standard: 'Speed is the distance covered per unit time.',
        stretch: 'Average speed uses the whole path, not the displacement.',
      },
      steps: [{
        body: 'Equal distances in equal times.',
        checkpoint: { id, prompt: 'Name this motion.', options: ['uniform', 'rest'], answer: 'uniform', explanation: 'Equal distances mean uniform motion.' },
      }],
      worked: { prompt: '20 m, 20 m, 20 m.', hinted: ['Each second matches.'], unhinted: 'Name the motion.' },
      faded: { itemId: randomUUID(), prompt: '8 m then 12 m.', hint: 'Compare the distances.', answers: ['non-uniform'] },
      misconceptions: [{ slip: 'A straight road is always uniform.', fix: 'The speed can still change.' }],
      explainBack: { itemId: randomUUID(), ownWords: 'Say it in your words.', gap: 'Equal distances means ____ motion.', gapAnswers: ['uniform'] },
      summary: { lines: ['Uniform motion covers equal distances in equal times.', 'Non-uniform motion does not.'], formulas: ['speed = distance / time'] },
      flashcards: [{ id: randomUUID(), front: 'Uniform motion', back: 'Equal distances in equal times.' }, { id: randomUUID(), front: 'Non-uniform', back: 'Unequal distances in equal times.' }],
      blocks: [slider],
    });
    const pub = toPublicLesson(lesson, { conceptId: randomUUID(), title: 'Uniform motion', variant: 'simple', weakPrereq: false });
    const raw = JSON.stringify(pub);
    expect(raw).not.toContain('gapAnswers');
    expect(raw).not.toContain('"answer"');
    expect(pub.note).toContain('चाल');
    expect(pub.bridge.repair).toBeNull();
    expect(pub.variant).toBe('simple');
  });
});
