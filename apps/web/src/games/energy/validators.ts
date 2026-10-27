import type { CheckpointAnswer, Feedback } from '../engine/types';

const pass = (feedback: string): Feedback => ({ correct: true, feedback });
const fail = (feedback: string): Feedback => ({ correct: false, feedback });

export function validateWork(answer: CheckpointAnswer): Feedback {
  return answer === 'push' ? pass('Sahi! Work = force × displacement: 120 N × 4 m = 480 J.') : fail('Box ko force ki direction mein move hona chahiye.');
}
export function validateKineticEnergy(answer: CheckpointAnswer): Feedback {
  return answer === 180 ? pass('Perfect. KE = ½mv² = ½ × 2 × 13.4² ≈ 180 J.') : fail('KE = ½mv² use karo. Speed ko square karna mat bhoolo.');
}
export function validatePotentialEnergy(answer: CheckpointAnswer): Feedback {
  return answer === 240 ? pass('Bilkul. PE = mgh = 4 × 10 × 6 = 240 J.') : fail('Height badhne par PE = mgh. 4 kg, 6 m aur g = 10 use karo.');
}
export function validateConservation(answer: CheckpointAnswer): Feedback {
  const ok = typeof answer === 'object' && answer !== null && !Array.isArray(answer) && (answer as Record<string, string>).top === 'potential' && (answer as Record<string, string>).bottom === 'kinetic';
  return ok ? pass('Energy conserved! Top par PE maximum, bottom par KE maximum.') : fail('Roller coaster mein top par PE, bottom par KE maximum hoti hai.');
}
