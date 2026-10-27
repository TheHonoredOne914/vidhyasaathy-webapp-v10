import type { CheckpointAnswer, Feedback } from '../engine/types';

const values = (answer: CheckpointAnswer): Record<string, string> => answer && typeof answer === 'object' && !Array.isArray(answer) ? answer as Record<string, string> : {};

export function uniformMotionValidator(answer: CheckpointAnswer): Feedback {
  return answer === 'uniform' ? { correct: true, feedback: 'Constant speed means uniform motion.' } : { correct: false, feedback: 'A straight, steady speed is uniform motion.' };
}
export function speedValidator(answer: CheckpointAnswer): Feedback {
  const v = Number(values(answer).speed);
  return Math.abs(v - 12) < 0.01 ? { correct: true, feedback: 'Speed = distance ÷ time = 60 ÷ 5 = 12 m/s.' } : { correct: false, feedback: 'Use speed = distance ÷ time: 60 ÷ 5.' };
}
export function accelerationValidator(answer: CheckpointAnswer): Feedback {
  const v = Number(values(answer).velocity); const s = Number(values(answer).distance);
  return Math.abs(v - 11) < 0.01 && Math.abs(s - 28) < 0.01 ? { correct: true, feedback: 'v = 11 m/s and s = 28 m: both equations agree.' } : { correct: false, feedback: 'Use u = 3, a = 2, t = 4 in v = u + at and s = ut + ½at².' };
}
export function equationValidator(answer: CheckpointAnswer): Feedback {
  const v = Number(values(answer).velocity); const s = Number(values(answer).distance);
  return Math.abs(v - 10) < 0.01 && Math.abs(s - 21) < 0.01 ? { correct: true, feedback: 'The area under the v–t graph is 21 m.' } : { correct: false, feedback: 'Set u = 4, a = 2, t = 3. Then v = 10 m/s and s = 21 m.' };
}
