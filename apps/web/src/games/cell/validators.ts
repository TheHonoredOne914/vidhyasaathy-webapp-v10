import type { Feedback } from '../engine/types';

export type CellMolecule = 'oxygen' | 'carbonDioxide' | 'water' | 'glucose' | 'sodium';
export type CellGate = 'simple' | 'aquaporin' | 'carrier' | 'pump';

export const gateForMolecule: Record<CellMolecule, CellGate> = {
  oxygen: 'simple',
  carbonDioxide: 'simple',
  water: 'aquaporin',
  glucose: 'carrier',
  sodium: 'pump',
};

export function membranePassValidator(molecule: CellMolecule, gate: CellGate): Feedback {
  return gateForMolecule[molecule] === gate
    ? { correct: true, feedback: 'Correct gate.' }
    : { correct: false, feedback: 'That molecule needs a different transport gate.' };
}

export function membraneValidator(answer: Record<string, string>): Feedback {
  const expected: Record<string, string> = { oxygen: 'simple', carbonDioxide: 'simple', water: 'aquaporin', glucose: 'carrier', sodium: 'pump', potassium: 'pump' };
  return Object.entries(expected).every(([key, value]) => answer[key] === value)
    ? { correct: true, feedback: 'Every molecule is matched to the right gate.' }
    : { correct: false, feedback: 'O₂ and CO₂ diffuse, water uses aquaporin, glucose uses a carrier, and ions use the pump.' };
}

export function osmosisValidator(answer: number | string): Feedback {
  const value = Number(answer);
  return value >= 35 && value <= 65
    ? { correct: true, feedback: 'Isotonic: water moves equally in both directions.' }
    : { correct: false, feedback: value < 35 ? 'Hypotonic: water enters and the cell swells.' : 'Hypertonic: water leaves and the cell shrinks.' };
}

export function organelleValidator(answer: Record<string, string>): Feedback {
  const expected = { nucleus: 'control', mitochondria: 'energy', er: 'manufacture', golgi: 'package', vacuole: 'storage' };
  return Object.entries(expected).every(([key, value]) => answer[key] === value)
    ? { correct: true, feedback: 'The cell parts are in place.' }
    : { correct: false, feedback: 'Check each organelle function and try again.' };
}

export function diffusionDirectionValidator(answer: string): Feedback { return answer === 'high-low' ? { correct: true, feedback: 'Diffusion follows the concentration gradient.' } : { correct: false, feedback: 'Particles move from high concentration to low concentration.' }; }
export function activeTransportValidator(answer: string): Feedback { return answer === 'pump' ? { correct: true, feedback: 'The pump uses ATP for active transport.' } : { correct: false, feedback: 'Active transport needs a pump and ATP.' }; }
export function conceptCheckValidator(answer: string): Feedback { return answer === 'selective' ? { correct: true, feedback: 'The membrane is selectively permeable.' } : { correct: false, feedback: 'The membrane lets some substances pass and blocks others.' }; }
