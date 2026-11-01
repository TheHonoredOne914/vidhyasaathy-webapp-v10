import { useState } from 'react';
import { experiment, Slider } from './shared';

function ForceLab() {
  const [force, setForce] = useState(6), [mass, setMass] = useState(3), [opposing, setOpposing] = useState(0), [time, setTime] = useState(0);
  const a = (force - opposing) / mass, x = Math.min(390, Math.max(60, 80 + .5 * a * time ** 2 * 8));
  return <div className="port-lab"><svg viewBox="0 0 480 270" role="img" aria-label="A crate moves in response to the net force">
    <line x1="25" x2="455" y1="210" y2="210" stroke="currentColor" strokeWidth="2" /><rect x={x - 25} y="155" width="50" height="54" rx="3" fill="#D6E2E6" stroke="currentColor" strokeWidth="3" />
    <path d={`M${x + 28} 175h${force * 6}l-10 -6m10 6l-10 6`} fill="none" stroke="#28517C" strokeWidth="4" />
    <path d={`M${x - 28} 190h${-opposing * 6}l10 -6m-10 6l10 6`} fill="none" stroke="#517DAB" strokeWidth="4" /><text x="35" y="40">FORCE: The Series · crate experiment</text><text x={x - 15} y="190">{mass} kg</text>
  </svg><div className="port-readout"><span>Net force: {force - opposing} N</span><span>Acceleration: {a.toFixed(2)} m/s²</span><span>Momentum: {(mass * a * time).toFixed(1)} kg m/s</span></div><div className="port-controls"><Slider label="Push" value={force} max={12} unit="N" onChange={(v) => { setForce(v); setTime(0); }} /><Slider label="Opposing push" value={opposing} max={12} unit="N" onChange={(v) => { setOpposing(v); setTime(0); }} /><Slider label="Mass" value={mass} min={1} max={8} unit="kg" onChange={(v) => { setMass(v); setTime(0); }} /><Slider label="Time from rest" value={time} max={5} step={.1} unit="s" onChange={setTime} /><button type="button" onClick={() => setTime(0)}>Reset experiment</button></div><p>Equal opposing forces give zero acceleration. Action and reaction act on different objects.</p></div>;
}
export const game = experiment('force-series', 'FORCE: The Series', 'Force and Laws of Motion', ForceLab, [
  ['The stopping bus', 'Inertia is the tendency to resist a change in motion.'], ['Push the crate', 'Change the force and mass. Use net force = mass × acceleration.'],
  ['Two objects, two forces', 'Action and reaction are equal and opposite, on different objects.'], ['Carry the momentum', 'Compare mass × velocity before and after a force acts.'],
]);
