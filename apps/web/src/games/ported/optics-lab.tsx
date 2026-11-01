import { useState } from 'react';
import { experiment, Slider } from './shared';

function OpticsLab() {
  const [angle, setAngle] = useState(35), [index, setIndex] = useState(1.5), [mode, setMode] = useState('reflection');
  const a = angle * Math.PI / 180, r = Math.asin(Math.sin(a) / index);
  const startX = 240 - 130 * Math.sin(a), startY = 140 - 130 * Math.cos(a), exit = 240 + 80 * Math.tan(r);
  return <div className="port-lab"><svg viewBox="0 0 480 320" role="img" aria-label={mode === 'reflection' ? 'Light reflects at an equal angle to the normal' : 'Light bends towards the normal in a glass slab'}>
    <rect x="35" y="140" width="410" height={mode === 'reflection' ? 8 : 80} fill="#D6E2E6" stroke="#517DAB" /><path d="M240 15V295" stroke="#517DAB" strokeDasharray="5 5" /><text x="245" y="25">Normal</text><path d={`M${startX} ${startY}L240 140`} stroke="#193E69" strokeWidth="4" fill="none" />
    {mode === 'reflection' ? <path d={`M240 140L${240 + 130 * Math.sin(a)} ${140 - 130 * Math.cos(a)}`} stroke="#28517C" strokeWidth="4" fill="none" /> : <path d={`M240 140L${exit} 220L${exit + 75 * Math.sin(a)} ${220 + 75 * Math.cos(a)}`} stroke="#28517C" strokeWidth="4" fill="none" />}
    <text x="35" y="300">{mode === 'reflection' ? `Incidence ${angle}° · reflection ${angle}°` : `Air → glass: ${angle}° → ${(r * 180 / Math.PI).toFixed(1)}°`}</text>
  </svg><div className="port-controls"><button type="button" aria-pressed={mode === 'reflection'} onClick={() => setMode('reflection')}>Mirror</button><button type="button" aria-pressed={mode === 'refraction'} onClick={() => setMode('refraction')}>Glass slab</button><Slider label="Angle of incidence" value={angle} max={70} unit="°" onChange={setAngle} />{mode === 'refraction' ? <Slider label="Glass refractive index" value={index} min={1.1} max={1.8} step={.1} onChange={setIndex} /> : null}</div><p>Explore · NCERT Class 8 Light and Class 10 Light: Reflection and Refraction. Angles are measured from the normal.</p></div>;
}
export const game = experiment('optics-lab', 'VidhyaSaathy Optics Lab', 'Light — Explore', OpticsLab, [
  ['Aim the reflected ray', 'Rotate the incident ray and compare the two angles.'], ['Find the normal', 'The normal is perpendicular to the mirror.'],
  ['Across the boundary', 'Compare a light ray in air and glass.'], ['Out of the slab', 'Notice the emergent ray is parallel to the incoming ray.'],
]);
