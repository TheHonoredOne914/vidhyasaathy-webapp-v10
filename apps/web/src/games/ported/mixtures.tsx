import { useState } from 'react';
import { experiment } from './shared';

function MixtureLab() {
  const [solute, setSolute] = useState('sand'), [filtered, setFiltered] = useState(false), [beam, setBeam] = useState(false);
  return <div className="port-lab"><svg viewBox="0 0 480 300" role="img" aria-label={`Water mixed with ${solute}${filtered ? ' after filtration' : ''}`}><path d="M140 45V250Q240 275 340 250V45" stroke="currentColor" fill="none" strokeWidth="4" /><path d="M143 110Q240 130 337 110V245Q240 270 143 245Z" fill="#D6E2E6" />{Array.from({ length: 26 }, (_, i) => <circle key={i} cx={155 + (i * 47 % 175)} cy={solute === 'sand' ? 239 - i % 4 * 4 : 130 + i * 17 % 95} r={solute === 'salt' ? 1.5 : 4} fill="#28517C" opacity={filtered && solute === 'sand' ? 0 : .8} />)}{beam ? <path d="M50 160H425" stroke="#517DAB" strokeWidth={solute === 'milk' ? 12 : 2} opacity={solute === 'milk' ? .6 : .25} /> : null}<text x="130" y="295">{filtered && solute === 'sand' ? 'Sand stays in the filter' : `${solute} + water`}</text></svg><div className="port-controls">{['sand', 'salt', 'milk'].map((name) => <button type="button" aria-pressed={solute === name} key={name} onClick={() => { setSolute(name); setFiltered(false); }}>{name}</button>)}<button type="button" onClick={() => setFiltered(true)}>Filter</button><button type="button" aria-pressed={beam} onClick={() => setBeam(!beam)}>Shine a light</button><button type="button" onClick={() => { setFiltered(false); setBeam(false); }}>Reset</button></div><p>Filtration removes insoluble sand. Dissolved salt passes through. A colloid such as milk scatters light.</p></div>;
}
export const game = experiment('mixtures', 'Mixture Detective', 'Is Matter Around Us Pure?', MixtureLab, [
  ['Mix and observe', 'Compare homogeneous and heterogeneous mixtures.'], ['Choose a separation', 'Filter an insoluble solid from water.'],
  ['Follow the beam', 'Explore scattering in a colloid.'], ['Mixture or compound?', 'A compound has a fixed chemical composition.'],
]);
