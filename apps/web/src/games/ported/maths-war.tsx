import { useState } from 'react';
import { experiment, Slider } from './shared';
import type { ArenaApi } from '../engine/types';

function Duel({ api }: { api: ArenaApi }) {
  const [n, setN] = useState(3), [d, setD] = useState(4), [power, setPower] = useState(2);
  const value = n / d;
  return <div className="port-lab"><svg viewBox="0 0 480 290" role="img" aria-label="A number line and a fraction shield in the concept arena"><text x="25" y="30">Maths War · the number arena</text><path d="M35 180H445" stroke="currentColor" strokeWidth="3" />{[0, 1, 2, 3, 4].map((v) => <g key={v}><path d={`M${40 + v * 100} 172v16`} stroke="currentColor" /><text x={35 + v * 100} y="210">{v}</text></g>)}<circle cx={40 + Math.min(4, value) * 100} cy="180" r="9" fill="#28517C" /><path d="M70 60L115 75V110Q110 140 70 150Q30 140 25 110V75Z" fill="#D6E2E6" stroke="currentColor" /><text x="45" y="108">{n}/{d}</text><text x="170" y="90">{n}/{d} = {value.toFixed(4)}…</text><text x="170" y="125">{n}^{power} = {n ** power}</text><text x="40" y="260">Checkpoint path: {Array.from({ length: api.round }, () => '·').join(' ')}</text></svg><div className="port-controls"><Slider label="Numerator" value={n} max={9} onChange={setN} /><Slider label="Denominator" value={d} min={1} max={9} onChange={setD} /><Slider label="Exponent" value={power} min={0} max={5} onChange={setPower} /></div><p>A fraction with integer numerator and non-zero integer denominator is rational. Try a recurring decimal such as 1/3.</p></div>;
}
export const game = experiment('maths-war', 'Maths War', 'Number Systems', Duel, [
  ['Raise a rational shield', 'Place a fraction on the number line.'], ['The recurring challenge', 'Compare terminating decimals with recurring decimals.'],
  ['Between two numbers', 'Find a place for an irrational number between integers.'], ['Powers in the arena', 'Explore the laws of exponents.'],
]);
