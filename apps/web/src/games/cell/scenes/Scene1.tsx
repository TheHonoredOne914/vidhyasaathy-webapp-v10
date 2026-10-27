import type { Scene } from '../../engine/types';
import { CellArt, MembraneStage } from '../art/CellArt';

export const scene1: Scene = { id: 'membrane-map', durationMs: 9000, narration: ['Welcome to the membrane gate.', 'Small paths, big choices.'], signals: ['membrane', 'gates'], render: (t, state) => <CellArt label="Phospholipid bilayer with four transport gates"><MembraneStage t={t} solved={state.solved} /></CellArt> };
