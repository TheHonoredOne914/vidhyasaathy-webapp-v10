import { useRef, useState } from 'react';
import { experiment } from './shared';
import type { ArenaApi } from '../engine/types';

function Scribe({ api }: { api: ArenaApi }) {
  const [draft, setDraft] = useState(''), [strokes, setStrokes] = useState<string[]>([]);
  const drawing = useRef(false);
  return <div className="port-lab"><svg viewBox="0 0 480 220" role="img" aria-label="A quill faces the wind; saved checkpoints strengthen its shield">
    <path d="M65 175Q170 110 220 35Q180 35 115 110Z" stroke="currentColor" fill="#D6E2E6" strokeWidth="3" /><path d="M65 175L185 65M290 65Q430 25 425 95Q420 130 305 115M290 150Q410 110 440 165" stroke="#517DAB" fill="none" strokeWidth="3" /><text x="30" y="205">Quill &amp; Blade · strengthen your words</text><text x="280" y="205">{api.round - 1} checkpoints passed</text>
  </svg><label>Think about the poet’s words. Jot down an idea.<input className="port-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="My reading of Wind…" /></label><svg className="port-ink" viewBox="0 0 480 100" aria-label="Optional ink sketch pad" onPointerDown={(event) => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); const r = event.currentTarget.getBoundingClientRect(); setStrokes((s) => [...s, `M${(event.clientX - r.left) * 480 / r.width} ${(event.clientY - r.top) * 100 / r.height}`]); }} onPointerMove={(event) => { if (!drawing.current) return; const r = event.currentTarget.getBoundingClientRect(); const p = `L${(event.clientX - r.left) * 480 / r.width} ${(event.clientY - r.top) * 100 / r.height}`; setStrokes((s) => s.map((line, i) => i === s.length - 1 ? line + p : line)); }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }}>
    {strokes.map((path, i) => <path key={i} d={path} fill="none" stroke="currentColor" strokeWidth="2" />)}
  </svg><button type="button" onClick={() => { setDraft(''); setStrokes([]); }}>Clear rough work</button><p>Rough work is optional. Your checkpoint answer is checked and saved by Saathy.</p></div>;
}
export const game = experiment('quill-blade', 'Quill & Blade', 'Wind', Scribe, [
  ['Address the wind', 'Notice how the poet treats the wind as a person.'], ['Hear the repeated word', 'Repetition can emphasise an idea in a poem.'],
  ['Read beyond the literal', 'A strong fire can suggest resilience.'], ['Stand strong', 'Connect the images in the poem to its theme.'],
]);
