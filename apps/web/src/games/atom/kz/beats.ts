import { KZ } from './palette';

export type CameraKey = { ms: number; position: [number, number, number]; target: [number, number, number]; fov: number };
export type ActKind = 'hold-zoom' | 'spin-tap' | 'neutron-drag' | 'shell-place' | 'isotope-sort' | 'free-build';
export type Beat = {
  id: 'cold-open' | 'nucleus' | 'stability' | 'shells' | 'isotopes' | 'recap';
  title: string; subtitle: string; bg: readonly [string, string]; panels?: readonly string[];
  camera: CameraKey[]; playCamera: CameraKey; actAt: number; captions: string[];
  act: ActKind; hint: string; payoff: string;
};
const key = (ms: number, position: CameraKey['position'], target: CameraKey['target'] = [0, 0, 0], fov = 32): CameraKey => ({ ms, position, target, fov });

export const BEATS: Beat[] = [
  {
    id: 'cold-open', title: 'What is everything made of?', subtitle: 'A world inside everything', bg: [KZ.violet, KZ.violetDeep],
    camera: [key(0, [0, 0, 18], [0, -0.9, 0]), key(7000, [0, 0, 14], [0, -0.9, 0])],
    playCamera: key(0, [0, 0, 14], [0, -1.6, 0]), actAt: 7,
    captions: ['Your <b>desk</b>, your hand, the air you breathe.', 'Zoom in far enough and it is all <b>atoms</b>.'],
    act: 'hold-zoom', hint: 'Hold anywhere to zoom in', payoff: 'The atom is mostly <b>empty space</b>.',
  },
  {
    id: 'nucleus', title: 'Meet the nucleus', subtitle: 'The tiny, heavy centre', bg: [KZ.violetLift, KZ.violet],
    camera: [key(0, [0, 0.4, 11]), key(7000, [0, 0.3, 7.4])], playCamera: key(0, [0, 0.3, 7.4]), actAt: 7,
    captions: ['At the very centre sits the <b>nucleus</b>.', '<b>Protons</b> are positive. Neutrons have no charge.'],
    act: 'spin-tap', hint: 'Drag to spin · tap a proton and a neutron', payoff: '<b>Electrons</b> are negative. A neutral atom has as many electrons as protons.',
  },
  {
    id: 'stability', title: 'Keep it together', subtitle: 'A little help from neutrons', bg: [KZ.sunLift, KZ.sun],
    camera: [key(0, [0, 0, 9.5]), key(7000, [0, 0, 9])], playCamera: key(0, [0, 0, 9]), actAt: 7,
    captions: ['Six <b>protons</b> all push each other away.', '<b>Neutrons</b> help hold the nucleus together without adding charge.'],
    act: 'neutron-drag', hint: 'Drag neutrons into the ring · make carbon-12', payoff: 'Steady! 6 protons + 6 neutrons. <b>Z = 6, A = 12</b>.',
  },
  {
    id: 'shells', title: 'Fill the shells', subtitle: 'Sodium · one electron to go', bg: [KZ.azure, '#006ec2'],
    camera: [key(0, [0, 0, 16]), key(7000, [0, 4, 13])], playCamera: key(0, [0, 4, 13]), actAt: 7,
    captions: ['Electrons fill <b>shells</b> from the inside out.', '<b>K</b> holds 2 electrons. L holds 8 for sodium.'],
    act: 'shell-place', hint: 'Tap a shell for the last electron', payoff: 'Sodium: <b>2, 8, 1</b>. One electron in its outermost shell.',
  },
  {
    id: 'isotopes', title: 'Same element, different mass', subtitle: 'Meet the carbon family', bg: [KZ.coral, KZ.coral], panels: [KZ.coral, KZ.teal, KZ.lavender],
    camera: [key(0, [0, 0, 11.5]), key(7000, [0, 0, 11.5])], playCamera: key(0, [0, 0, 11.5]), actAt: 7,
    captions: ['Same 6 <b>protons</b>, so all three are carbon.', 'Only neutrons change. These are <b>isotopes</b>.'],
    act: 'isotope-sort', hint: 'Sort each pair: isotopes or isobars?', payoff: 'Same A, different Z = <b>isobars</b>. Calcium-40 and argon-40 share A = 40.',
  },
  {
    id: 'recap', title: 'Build any atom', subtitle: 'Your own tiny universe', bg: [KZ.violetLift, KZ.violetDeep],
    camera: [key(0, [0, 1, 9]), key(7000, [0, 0, 14])], playCamera: key(0, [0, 0, 14]), actAt: 7,
    captions: ['Change the particles. Watch your <b>atom</b> change.', '<b>Z</b> counts protons. A counts protons plus neutrons.'],
    act: 'free-build', hint: 'Build, explore, then try three quick checks', payoff: 'You explored an entire <b>atom</b>, from its nucleus to its shells.',
  },
];

export const RECAP = [
  { title: 'Nucleus', text: 'Protons (+) and neutrons (0)', kind: 'nucleus' },
  { title: 'Electrons', text: 'Negative · shells K 2, L 8', kind: 'electrons' },
  { title: 'Z and A', text: 'Z = protons · A = protons + neutrons', kind: 'counts' },
  { title: 'Isotopes', text: 'Same Z · different A', kind: 'isotopes' },
] as const;
