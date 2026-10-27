import type { CheckpointAnswer, Feedback } from '../engine/types';
const yes = (feedback: string): Feedback => ({ correct: true, feedback });
const no = (feedback: string): Feedback => ({ correct: false, feedback });
const obj = (answer: CheckpointAnswer): Record<string, string> => answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
export function validateDegree(answer: CheckpointAnswer): Feedback { const a = obj(answer); return a.x2 === '1' && a.x1 === '3' && a.constant === '1' && a.degree === '2' && a.type === 'quadratic' ? yes('Correct: 2x² + 3x + 1 is a quadratic trinomial.') : no('Use one x² tile, three x tiles and one unit tile.'); }
export function validateValue(answer: CheckpointAnswer): Feedback { return Number(answer) === 0 ? yes('Correct: p(2) = 4 − 6 + 2 = 0.') : no('Substitute 2 into every x: 2² − 3(2) + 2.'); }
export function validateZeros(answer: CheckpointAnswer): Feedback { const a = obj(answer); return [a.first, a.second].sort().join(',') === '2,3' ? yes('Correct: the curve crosses the axis at x = 2 and x = 3.') : no('Try the x-intercepts 2 and 3. Both make p(x) equal zero.'); }
export function validateFactor(answer: CheckpointAnswer): Feedback { const a = obj(answer); return a.a === '1' && a.remainder === '6' && a.factor === 'not-factor' ? yes('Correct: p(1) = 6, so x − 1 is not a factor.') : no('For x − 1 use p(1). A non-zero remainder means not a factor.'); }
