import { useState } from 'react';
import { experiment } from './shared';

const IDEAS = { meristem: 'Root and shoot tips: dividing cells help the plant grow.', xylem: 'Water and minerals travel upwards from the roots.', phloem: 'Food from leaves moves to the parts that need it.', muscle: 'Striated muscles help us move our limbs voluntarily.' };
function TissueLab() {
  const [focus, setFocus] = useState<keyof typeof IDEAS>('meristem');
  return <div className="port-lab"><svg viewBox="0 0 480 310" role="img" aria-label={`Plant transport and growth: ${focus}`}><path d="M240 260V70M240 260l-45 25m45 -25l45 25M240 170Q145 180 140 100Q225 95 240 170M240 135Q320 150 345 65Q260 55 240 135" stroke="currentColor" strokeWidth="6" fill="#D6E2E6" /><path d={focus === 'phloem' ? 'M258 115V225l-7 -10m7 10l7 -10' : 'M223 230V110l-7 10m7 -10l7 10'} stroke="#517DAB" strokeWidth="4" fill="none" />{focus === 'meristem' ? <><circle cx="240" cy="70" r="12" fill="#28517C" /><circle cx="195" cy="285" r="10" fill="#28517C" /><circle cx="285" cy="285" r="10" fill="#28517C" /></> : null}<text x="30" y="30">Trace the tissue’s job</text><text x="275" y="255">{focus === 'muscle' ? 'Compare: animal tissue' : focus}</text></svg><div className="port-controls">{(Object.keys(IDEAS) as (keyof typeof IDEAS)[]).map((name) => <button type="button" key={name} aria-pressed={focus === name} onClick={() => setFocus(name)}>{name}</button>)}</div><p role="status">{IDEAS[focus]}</p></div>;
}
export const game = experiment('tissues', 'Tissue Trail', 'Tissues', TissueLab, [
  ['Where growth begins', 'Find the meristems at a plant’s growing tips.'], ['Water’s journey', 'Follow water through xylem.'],
  ['Food’s journey', 'Follow food through phloem.'], ['Make a movement', 'Compare specialised tissues in plants and animals.'],
]);
