import type { Feedback } from '../engine/types';

const result = (correct: boolean, feedback: string): Feedback => ({ correct, feedback });

export type FmaAnswer = { force: number; mass: number; acceleration: number };
export type MomentumAnswer = { before: number; after: number };

export function validateInertia(answer: number): Feedback {
  return answer >= 7 ? result(true, 'Correct. A quick pull changes the card, while inertia keeps the coin nearly still.') : result(false, 'Set the pull speed to 7 or more. Inertia resists a sudden change in motion.');
}
export function validateFma(answer: FmaAnswer): Feedback {
  return answer.force === 12 && answer.mass === 3 && answer.acceleration === 4 ? result(true, 'Correct. F = ma, so 12 N ÷ 3 kg = 4 m/s².') : result(false, 'For a 3 kg cart at 4 m/s², use F = ma = 12 N.');
}
export function validateReaction(answer: string): Feedback {
  return answer === 'balloon-air' ? result(true, 'Correct. The balloon pushes air back; the air pushes the balloon forward.') : result(false, 'Choose the equal and opposite forces acting on two different bodies.');
}
export function validateMomentum(answer: MomentumAnswer): Feedback {
  return answer.before === 8 && answer.after === 8 ? result(true, 'Correct. In an isolated collision, total momentum stays 8 kg·m/s.') : result(false, 'Total momentum must match before and after: 8 kg·m/s.');
}
