import type { Checkpoint, Scene } from '../../engine/types';
import { CellArt, OrganelleStage } from '../art/CellArt';

export const organelleValidator: Checkpoint['validate'] = (answer) => {
  const expected: Record<string, string> = { nucleus: 'control', mitochondria: 'energy', er: 'manufacture', golgi: 'package', vacuole: 'storage' };
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return { correct: false, feedback: 'Place every label on its matching job.' };
  const placements = answer as Record<string, string>;
  return Object.entries(expected).every(([key, value]) => placements[key] === value) ? { correct: true, feedback: 'Great match. Organelles share the cell work.' } : { correct: false, feedback: 'Nucleus controls; mitochondria release energy; vacuole stores.' };
};

export const scene4: Scene = { id: 'organelle-match', durationMs: 15000, narration: ['Now match each organelle to its job.', 'A cell is a team, not a tiny bag.'], signals: ['organelles', 'team'], checkpoint: { kind: 'drag', prompt: 'Drag each organelle to its cell job.', conceptId: 'cell-organelles-functions', validate: organelleValidator, items: [{ id: 'nucleus', label: 'nucleus' }, { id: 'mitochondria', label: 'mitochondria' }, { id: 'er', label: 'ER' }, { id: 'golgi', label: 'Golgi' }, { id: 'vacuole', label: 'vacuole' }], targets: [{ id: 'control', label: 'control and genetic information' }, { id: 'energy', label: 'release energy' }, { id: 'manufacture', label: 'make and transport' }, { id: 'package', label: 'modify and package' }, { id: 'storage', label: 'store cell sap' }], reteach: { sceneId: 'organelle-match', hint: 'The nucleus directs; mitochondria release energy.', recall: { prompt: 'Which organelle is the powerhouse?', choices: [{ id: 'mitochondria', label: 'mitochondria' }, { id: 'golgi', label: 'Golgi apparatus' }], answerId: 'mitochondria', explanation: 'Mitochondria release energy for cell activities.' } } }, render: () => <CellArt label="Plant and animal cell organelle map"><OrganelleStage /></CellArt> };
