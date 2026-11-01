// Kurzgesagt-derived palette (sampled from reference frames, see STYLE_BIBLE.md)
export const KZ = {
  violetDeep: '#1e0063', violet: '#2d0089', violetLift: '#3a00a5', violetGlow: '#5a1fd1',
  coral: '#fd7476', teal: '#00ddb8', lavender: '#7b7cf0', azure: '#0089e0', sun: '#ffc21a', sunLift: '#ffe066',
  // proton: magenta-pink
  pBase: '#fb5a9e', pLit: '#ff8cc0', pShade: '#c4246f', pHi: '#ffd1e6', pRim: '#ff9ad0',
  // neutron: amber-orange
  nBase: '#ff9406', nLit: '#ffbc08', nShade: '#e8540a', nHi: '#fff0b0', nRim: '#ffcf6a',
  // electron: azure with white core
  eBase: '#4d8bff', eCore: '#e8f4ff', eTrail: '#bfe0ff',
  ink: '#2a0b3d', blush: '#ff6f9a', white: '#ffffff',
} as const;
export type Mood = 'smile' | 'grin' | 'worried' | 'wow';
export const MOOD_ID: Record<Mood, number> = { smile: 0, grin: 1, worried: 2, wow: 3 };
