export type GameModule = { [key: string]: unknown };

export const GAME_REGISTRY = [
  { id: 'demo', title: 'The Atom’s Smallest Orbit', detail: 'Predict, tap, slide, order, and match through a guided science scene.' },
  { id: 'atom', title: 'Atom Builder', detail: 'Build atoms and explore charges, shells, and atomicity.' },
  { id: 'cell', title: 'Cell Gatekeeper', detail: 'Sort the parts of a cell and protect what belongs inside.' },
  { id: 'matter', title: 'Matter Mixer', detail: 'Explore changes of state with quick checkpoints.' },
  { id: 'motion', title: 'Motion Tracker', detail: 'Follow movement, signals, and changing speed.' },
  { id: 'newton', title: 'Cricket Lab', detail: 'Test force and motion with a familiar game.' },
  { id: 'graphs', title: 'Graph Detective', detail: 'Read the story hidden in a changing line.' },
  { id: 'float', title: 'Float or Sink', detail: 'Make predictions about weight, force, and water.' },
  { id: 'sound', title: 'Echo Corridor', detail: 'Trace vibrations as sound moves through a space.' },
  { id: 'energy', title: 'Energy Slide', detail: 'Move energy through a system and notice what changes.' },
  { id: 'poly', title: 'Polynomial Factory', detail: 'Build expressions one piece at a time.' },
] as const;

const gameLoaders: Record<string, () => Promise<GameModule>> = {
  demo: async () => import('./demo'),
  atom: async () => import('../atom'),
  cell: async () => import('../cell'),
  matter: async () => import('../matter'),
  motion: async () => import('../motion'),
  newton: async () => import('../newton/index.tsx'),
  graphs: async () => import('../graphs/index'),
  float: async () => import('../float'),
  sound: async () => import('../sound'),
  energy: async () => import('../energy'),
  poly: async () => import('../poly'),
};

export async function loadGame(id: string) {
  const module = await gameLoaders[id]?.();
  return module && 'game' in module ? (module.game as import('./types').GameDef) : module && 'default' in module ? (module.default as import('./types').GameDef) : module && 'matterGame' in module ? (module.matterGame as import('./types').GameDef) : module && 'demoGame' in module ? (module.demoGame as import('./types').GameDef) : module && 'atomGame' in module ? (module.atomGame as import('./types').GameDef) : null;
}
