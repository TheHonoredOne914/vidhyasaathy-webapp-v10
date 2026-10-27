import type { ReactNode } from 'react';

const ink = '#D6E2E6';
const navy = '#041D3D';
const deep = '#193E69';
const blue = '#517DAB';
const peach = '#FFD8C2';
const success = '#5BAE7E';

export function CellArt({ children, label = 'Cell membrane illustration' }: { children?: ReactNode; label?: string }) {
  return <svg viewBox="0 0 960 420" role="img" aria-label={label} className="cell-art">
    <defs><linearGradient id="cell-stage" x1="0" x2="1" y1="0" y2="1"><stop stopColor={deep} /><stop offset="1" stopColor={navy} /></linearGradient><linearGradient id="bilayer" x1="0" x2="1"><stop stopColor={peach} /><stop offset=".5" stopColor={ink} /><stop offset="1" stopColor={peach} /></linearGradient></defs>
    <rect width="960" height="420" fill="url(#cell-stage)" />{children}
  </svg>;
}

function Dot({ x, y, color = peach, r = 7 }: { x: number; y: number; color?: string; r?: number }) { return <circle cx={x} cy={y} r={r} fill={color} stroke={ink} strokeWidth="2" />; }

export function MembraneStage({ t, solved = false }: { t: number; solved?: boolean }) {
  const drift = (n: number) => Math.sin(t * 18 + n * 2.1) * 5;
  const molecules = [['O₂', 105, 92, peach], ['CO₂', 210, 132, peach], ['H₂O', 325, 76, '#BFE3F5'], ['glucose', 90, 318, '#FFB894'], ['Na⁺', 240, 350, '#BFE3F5'], ['K⁺', 710, 326, '#BFE3F5']] as const;
  return <>
    <text x="40" y="34" fill={peach} fontSize="16" fontWeight="bold">LEVEL 1 · THE GATEKEEPER</text><text x="40" y="56" fill={ink} fontSize="18" fontWeight="bold">EXTRACELLULAR FLUID</text><text x="40" y="402" fill={ink} fontSize="20" fontWeight="bold">CYTOPLASM</text><text x="710" y="34" fill={peach} fontSize="17">outside → inside</text>
    <g opacity=".28">{Array.from({ length: 12 }, (_, i) => <Dot key={i} x={420 + (i % 6) * 76} y={55 + Math.floor(i / 6) * 275} color={blue} r={18} />)}</g>
    <g aria-label="horizontal phospholipid bilayer"><rect x="32" y="186" width="896" height="48" rx="24" fill="#0A2A4D" stroke={peach} strokeWidth="2" />{Array.from({ length: 26 }, (_, i) => <g key={i}><circle cx={48 + i * 34} cy="194" r="8" fill="url(#bilayer)" /><circle cx={48 + i * 34} cy="226" r="8" fill="url(#bilayer)" /><path d={`M${48 + i * 34} 202v20`} stroke={ink} strokeWidth="5" /></g>)}<text x="480" y="178" textAnchor="middle" fill={ink} fontSize="16">PHOSPHOLIPID BILAYER</text></g>
    <g aria-label="transport gates"><rect x="132" y="170" width="78" height="80" rx="18" fill={blue} stroke={ink} strokeWidth="3" /><path d="M150 210h42" stroke={navy} strokeWidth="12" /><rect x="330" y="166" width="82" height="88" rx="28" fill="#BFE3F5" stroke={ink} strokeWidth="3" /><circle cx="371" cy="210" r="13" fill={navy} /><rect x="530" y="166" width="92" height="88" rx="24" fill="#FFB894" stroke={ink} strokeWidth="3" /><path d="M551 210q24-24 48 0q-24 24-48 0Z" fill={deep} /><rect x="735" y="160" width="100" height="100" rx="24" fill={success} stroke={ink} strokeWidth="3" /><path d="M755 208h60M785 184v48" stroke={navy} strokeWidth="8" /></g>
    <g fill={ink} fontSize="15" textAnchor="middle"><text x="171" y="278">simple diffusion</text><text x="371" y="278">aquaporin</text><text x="576" y="278">carrier</text><text x="785" y="278">Na⁺/K⁺ pump</text></g>
    {molecules.map(([label, x, y, color], i) => <g key={label} transform={`translate(${x + drift(i)} ${y + drift(i + 1)})`}><circle r={label === 'glucose' ? 27 : 21} fill={color} stroke={ink} strokeWidth="3" /><text y="6" textAnchor="middle" fill={navy} fontSize="14" fontWeight="bold">{label}</text></g>)}
    <g transform="translate(760 70)"><rect width="150" height="64" rx="14" fill={navy} stroke={blue} /><text x="12" y="23" fill={ink} fontSize="14">ATP</text><text x="128" y="26" textAnchor="end" fill={peach} fontSize="22" fontWeight="bold">{solved ? '2' : '3'}</text><text x="12" y="47" fill={ink} fontSize="13">pump fuel</text></g>
    <g transform="translate(38 112)"><text fill={ink} fontSize="14">concentration</text><rect y="10" width="78" height="8" rx="4" fill={blue} /><rect y="10" x="88" width="78" height="8" rx="4" fill={solved ? success : peach} /><text y="42" fill={ink} fontSize="12">outside</text><text x="88" y="42" fill={ink} fontSize="12">inside</text></g>
    <g transform="translate(650 300)"><rect width="270" height="78" rx="16" fill={navy} stroke={blue} /><text x="16" y="24" fill={peach} fontSize="15" fontWeight="bold">CONCEPT STEP</text><text x="16" y="47" fill={ink} fontSize="14">Diffusion: high → low.</text><text x="16" y="66" fill={ink} fontSize="14">Pump: ATP, low → high.</text></g>
  </>;
}

export function OsmosisStage({ salt }: { salt: number }) {
  const size = 44 - Math.abs(salt - 50) * .35;
  const state = salt < 35 ? 'hypotonic · swell' : salt > 65 ? 'hypertonic · shrink' : 'isotonic · steady';
  return <><text x="42" y="40" fill={ink} fontSize="22" fontWeight="bold">LEVEL 2 · OSMOSIS LAB</text><text x="42" y="72" fill={ink} fontSize="17">Drag salt concentration. Watch water follow its gradient.</text><path d="M150 118h660v230H150z" fill="#BFE3F5" fillOpacity=".16" stroke={ink} strokeWidth="4" />{Array.from({ length: Math.max(4, Math.round(salt / 5)) }, (_, i) => <Dot key={i} x={185 + (i * 67) % 580} y={155 + (i * 41) % 150} color={peach} r={5} />)}<circle cx="480" cy="232" r={size} fill={deep} stroke={peach} strokeWidth="6" /><ellipse cx="467" cy="225" rx={size * .28} ry={size * .18} fill={peach} /><circle cx="490" cy="250" r={size * .12} fill={blue} /><text x="480" y="326" textAnchor="middle" fill={ink} fontSize="20">{state}</text><text x="166" y="378" fill={ink} fontSize="15">low salt outside</text><text x="660" y="378" fill={ink} fontSize="15">high salt outside</text></>;
}

export function OrganelleStage() {
  return <><text x="42" y="38" fill={ink} fontSize="22" fontWeight="bold">LEVEL 3 · ORGANELLE MATCH</text><path d="M150 100Q95 180 150 310Q315 375 492 314Q650 346 798 242Q842 120 720 94Q460 48 150 100Z" fill={deep} stroke={peach} strokeWidth="5" /><ellipse cx="310" cy="202" rx="62" ry="50" fill={peach} stroke={ink} strokeWidth="4" /><circle cx="310" cy="202" r="15" fill={navy} /><path d="M430 130q54 34 0 68t12 68M482 130q54 34 0 68t12 68M534 130q54 34 0 68t12 68" fill="none" stroke={blue} strokeWidth="11" /><ellipse cx="675" cy="150" rx="52" ry="24" fill={blue} stroke={ink} strokeWidth="4" /><circle cx="210" cy="276" r="27" fill="#BFE3F5" stroke={ink} strokeWidth="4" /><ellipse cx="675" cy="258" rx="40" ry="25" fill={peach} stroke={ink} strokeWidth="4" /></>;
}
