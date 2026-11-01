import { useState } from 'react';
import { experiment } from './shared';
import type { ArenaApi } from '../engine/types';

const STOPS = [
  ['The village gate', 'Who chooses the people who govern?'], ['The voting bridge', 'Every adult citizen has an equal vote.'],
  ['The choice crossroads', 'A real election lets the people replace their rulers.'], ['The rights tower', 'Even an elected government must respect rights.'],
];
function Quest({ api }: { api: ArenaApi }) {
  const [stop, setStop] = useState(Math.min(api.round - 1, STOPS.length - 1));
  return <div className="port-lab"><svg viewBox="0 0 480 300" role="img" aria-label="A knowledge quest travels from the village gate to the rights tower">
    <path d="M65 220Q110 90 180 130T300 160T420 75" fill="none" stroke="#517DAB" strokeWidth="5" strokeDasharray="8 6" />{STOPS.map(([name], i) => <g key={name}><circle cx={[65, 180, 300, 420][i]} cy={[220, 130, 160, 75][i]} r={i === stop ? 20 : 12} fill={i <= stop ? '#193E69' : '#D6E2E6'} /><text x={[35, 130, 250, 340][i]} y={[260, 95, 205, 40][i]}>{['Village', 'Vote', 'Choice', 'Rights'][i]}</text></g>)}
  </svg><h2>{STOPS[stop]![0]}</h2><p>{STOPS[stop]![1]}</p><div className="port-controls">{STOPS.map(([name], i) => <button type="button" key={name} aria-pressed={stop === i} onClick={() => setStop(i)}>{name}</button>)}</div><p>Collect an idea at every stop. Answer the checkpoint to save your quest to your learning path.</p></div>;
}
export const game = experiment('tinker', 'Tinker: The Knowledge Quest', 'What is Democracy? Why Democracy?', Quest, [
  ['Enter the knowledge quest', 'Discover who holds power in a democracy.'], ['Cross the voting bridge', 'Every adult citizen has an equal vote.'],
  ['A real choice', 'People must be able to change their rulers.'], ['Guard the rights tower', 'A majority must still respect constitutional law and rights.'],
]);
