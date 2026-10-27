import type { GameDef } from '../engine/types';
export * from './validators';

/** Atom Forge ships as a true interactive video (see AtomForgeVideo). */
export const atomGame: GameDef = {
  id: 'atom',
  title: 'Atom Forge',
  chapterRef: 'NCERT · Class 9 · Ch 4 Structure of the Atom',
  conceptIds: ['atom.charged-particles', 'atom.shells', 'atom.numbers', 'atom.isotopes-isobars'],
  scenes: [],
};

export { AtomForgeVideo } from './AtomForgeVideo';
export default atomGame;
