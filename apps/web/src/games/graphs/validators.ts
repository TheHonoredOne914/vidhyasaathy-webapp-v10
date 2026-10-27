import type { Feedback } from '../engine/types';
const pass = (feedback: string): Feedback => ({ correct: true, feedback });
const fail = (feedback: string): Feedback => ({ correct: false, feedback });
function point(answer: unknown): [number, number] | null { if (typeof answer !== 'string') return null; const m = answer.match(/^(-?\d+),(-?\d+)$/); return m ? [Number(m[1]), Number(m[2])] : null; }
export const checkAxesOrigin = (answer: unknown): Feedback => point(answer)?.every((v) => v === 0) ? pass('Correct: axes meet at the origin (0, 0).') : fail('Move the marker to where both axes meet: (0, 0).');
export const checkQuadrant = (answer: unknown): Feedback => { const p = point(answer); return p && p[0] < 0 && p[1] > 0 ? pass('Correct: Quadrant II has negative x and positive y.') : fail('Quadrant II needs x negative and y positive.'); };
export const checkPlotPoint = (answer: unknown): Feedback => { const p = point(answer); return p?.[0] === -3 && p[1] === 2 ? pass('Correct: (−3, 2) is three left and two up.') : fail('Read x first: go three left, then two up to (−3, 2).'); };
export const checkDistance = (answer: unknown): Feedback => { const p = point(answer); return p?.[0] === 4 && p[1] === 0 ? pass('Correct: (4, 0) is 4 units from the origin.') : fail('Keep y at 0 and move four units right to (4, 0).'); };
