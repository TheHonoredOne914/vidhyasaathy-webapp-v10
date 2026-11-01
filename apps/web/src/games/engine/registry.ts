export type GameModule = { [key: string]: unknown };

export const GAME_REGISTRY = [
  { id: 'demo', title: "The Atom's Smallest Orbit", detail: 'Predict, tap, slide, order, and match through a guided science scene.' },
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
  { id: 'maths-war', title: 'Maths War', detail: 'Solve number and polynomial challenges.' },
  { id: 'circleverse', title: 'Circleverse', detail: 'Explore angles, chords and arcs in a circle.' },
  { id: 'force-series', title: 'FORCE: The Series', detail: 'Explore Newton’s three laws through motion challenges.' },
  { id: 'chotu-motion', title: 'Chotu ki Kahani: Motion', detail: 'Follow a journey through distance, speed and graphs.' },
  { id: 'tinker', title: 'Tinker: The Knowledge Quest', detail: 'A guided science knowledge quest.' },
  { id: 'optics-lab', title: 'VidhyaSaathy Optics Lab', detail: 'Explore reflection and refraction with ray experiments.' },
  { id: 'quill-blade', title: 'Quill & Blade', detail: 'Explore the images and figures of speech in Wind.' },
  { id: 'mixtures', title: 'Mixture Detective', detail: 'Mix, filter and follow a light beam.' },
  { id: 'tissues', title: 'Tissue Trail', detail: 'Trace growth and transport through a plant.' },
  { id: 'linear', title: 'Line Builder', detail: 'Build solutions and see their straight-line graph.' },
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
  'maths-war': async () => import('../ported/maths-war'),
  circleverse: async () => import('../ported/circleverse'),
  'force-series': async () => import('../ported/force-series'),
  'chotu-motion': async () => import('../ported/chotu-motion'),
  tinker: async () => import('../ported/tinker'),
  'optics-lab': async () => import('../ported/optics-lab'),
  'quill-blade': async () => import('../ported/quill-blade'),
  mixtures: async () => import('../ported/mixtures'),
  tissues: async () => import('../ported/tissues'),
  linear: async () => import('../ported/linear'),
};

const NAMED_KEYS = ['game', 'default', 'matterGame', 'demoGame', 'atomGame', 'newtonGame', 'energyGame', 'motionGame', 'soundGame', 'floatGame', 'graphsGame', 'polyGame', 'cellGame'] as const;

export async function loadGame(id: string) {
  const module = await gameLoaders[id]?.();
  if (!module) return null;
  for (const key of NAMED_KEYS) {
    if (key in module && module[key]) return module[key] as import('./types').GameDef;
  }
  return null;
}
