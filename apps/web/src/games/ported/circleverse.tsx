import { useState } from 'react';
import { experiment, point, Slider } from './shared';
import type { ArenaApi } from '../engine/types';

function CircleLab({ api }: { api: ArenaApi }) {
  const [angle, setAngle] = useState(55);
  const [height, setHeight] = useState(60);
  const [mode, setMode] = useState(api.round > 2 ? 'angle' : 'chord');
  const p = point(angle), a = point(180), b = point(0);
  const half = Math.sqrt(125 ** 2 - height ** 2);
  return <div className="port-lab"><svg viewBox="0 0 480 330" role="img" aria-label={mode === 'chord' ? 'Move a chord towards the centre to make it longer' : 'A triangle drawn on a diameter of a circle'}>
    <circle cx="240" cy="160" r="125" fill="none" stroke="currentColor" strokeWidth="3" />
    <circle cx="240" cy="160" r="4" fill="currentColor" />
    {mode === 'chord' ? <><line x1={240 - half} x2={240 + half} y1={160 - height} y2={160 - height} stroke="#28517C" strokeWidth="5" /><line x1="240" x2="240" y1="160" y2={160 - height} stroke="#517DAB" strokeDasharray="5 5" /><text x="245" y="185">Centre</text><text x="160" y="310">Chord length: {(half * 8 / 250).toFixed(2)} cm</text></> : <><path d={`M${a.x} ${a.y}L${p.x} ${p.y}L${b.x} ${b.y}Z`} fill="#D6E2E6" stroke="#28517C" strokeWidth="3" /><circle cx={p.x} cy={p.y} r="7" fill="#193E69" /><text x={p.x - 12} y={p.y - 12}>90°</text><text x="160" y="310">Diameter = 2 × radius</text></>}
  </svg><div className="port-controls"><button type="button" aria-pressed={mode === 'chord'} onClick={() => setMode('chord')}>Explore chords</button><button type="button" aria-pressed={mode === 'angle'} onClick={() => setMode('angle')}>Angle in a semicircle</button>{mode === 'chord' ? <Slider label="Distance from centre" value={height} max={120} onChange={setHeight} /> : <Slider label="Point on the semicircle" value={angle} min={15} max={165} unit="°" onChange={setAngle} />}</div><p>Move the point with the slider. A diameter goes through the centre; every angle on its semicircle stays a right angle.</p></div>;
}
export const game = experiment('circleverse', 'Circleverse', 'Circles', CircleLab, [
  ['Meet the circle', 'Explore the radius, diameter and chord.'], ['Twin chords', 'Move a chord closer to the centre. Compare its length.'],
  ['An arc and its angles', 'Compare the angle at the centre with the angle on the remaining circumference.'], ['The semicircle secret', 'Move the top point. Does the right angle change?'],
]);
