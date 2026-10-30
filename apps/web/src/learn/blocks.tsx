import { LabelResultSchema, type PublicLesson } from '@vidhyasaathy/contracts';
import { useEffect, useId, useState } from 'react';
import { postJson } from '../api/client';

type Block = PublicLesson['blocks'][number];

function axisValue(block: Extract<Block, { kind: 'slider_graph' }>, time: number) {
  return block.axis === 'distance-time' ? block.u * time + 0.5 * block.a * time * time : block.u + block.a * time;
}

export function SliderGraph({ block }: { block: Extract<Block, { kind: 'slider_graph' }> }) {
  const [time, setTime] = useState(block.t);
  const label = useId();
  const samples = Array.from({ length: 25 }, (_, index) => {
    const t = (block.t * index) / 24;
    return { t, y: axisValue(block, t) };
  });
  const maxY = Math.max(...samples.map((point) => point.y), 1);
  const width = 280;
  const height = 140;
  const path = samples.map((point, index) => {
    const x = 24 + (point.t / block.t) * (width - 36);
    const y = height - 20 - (point.y / maxY) * (height - 36);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const now = axisValue(block, time);
  const dotX = 24 + (time / block.t) * (width - 36);
  const dotY = height - 20 - (now / maxY) * (height - 36);
  return (
    <figure className="learn-block">
      <figcaption>{block.title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={block.axis === 'distance-time' ? 'Distance-time graph' : 'Velocity-time graph'}>
        <line x1="24" y1="12" x2="24" y2={height - 16} />
        <line x1="24" y1={height - 16} x2={width - 8} y2={height - 16} />
        <path d={path} />
        <circle cx={dotX} cy={dotY} r="5" />
      </svg>
      <label htmlFor={label}>{block.axis === 'distance-time' ? 'Time on the distance-time graph' : 'Time on the velocity-time graph'}</label>
      <input id={label} type="range" min={0} max={block.t} step={block.t / 20} value={time} onChange={(event) => { setTime(Number(event.target.value)); }} />
      <p>{block.axis === 'distance-time' ? 'Distance' : 'Velocity'} at {time.toFixed(1)} s is {now.toFixed(1)}. a = (v - u) / t = {block.a}.</p>
    </figure>
  );
}

export function MovingObject({ block }: { block: Extract<Block, { kind: 'moving_object' }> }) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      setPlaying(false);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / 4000);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [playing]);
  return (
    <figure className="learn-block">
      <figcaption>{block.title}</figcaption>
      <div className="learn-track" aria-hidden="true">
        <span className={`learn-vehicle is-${block.vehicle}`} style={{ left: `${progress * 82}%` }}>{block.vehicle}</span>
      </div>
      <p>Distance {block.distance}, time {block.time}, speed {block.speed}. Speed = distance / time.</p>
      <button type="button" className="player-btn" onClick={() => { setProgress(0); setPlaying(true); }}>{playing ? 'Moving' : 'Move the ' + block.vehicle}</button>
    </figure>
  );
}

export function DragLabel({ block, conceptId, blockIndex }: { block: Extract<Block, { kind: 'drag_label' }>; conceptId: string; blockIndex: number }) {
  const [picked, setPicked] = useState<string | null>(block.labels[0]?.id ?? null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);
  async function check() {
    const placements = Object.entries(placed).map(([labelId, targetId]) => ({ labelId, targetId }));
    if (placements.length < block.labels.length) {
      setNote('Match every label.');
      return;
    }
    const result = await postJson(`/concepts/${conceptId}/lesson/label`, LabelResultSchema, { blockIndex, placements });
    setNote(result.correct ? result.explanation : 'Not yet. ' + result.explanation);
  }
  return (
    <figure className="learn-block">
      <figcaption>{block.title}</figcaption>
      <p>{block.prompt}</p>
      <div className="learn-labels" role="list">
        {block.labels.map((label) => (
          <button key={label.id} type="button" className={picked === label.id ? 'is-on' : ''} aria-pressed={picked === label.id} onClick={() => { setPicked(label.id); }}>{label.text}</button>
        ))}
      </div>
      <div className="learn-targets">
        {block.targets.map((target) => (
          <button key={target.id} type="button" onClick={() => { if (picked) setPlaced((current) => ({ ...current, [picked]: target.id })); }}>
            {target.text}{Object.entries(placed).find(([, targetId]) => targetId === target.id) ? `: ${block.labels.find((label) => placed[label.id] === target.id)?.text ?? ''}` : ''}
          </button>
        ))}
      </div>
      <button type="button" className="player-btn" onClick={() => { void check(); }}>Check the labels</button>
      {note ? <p>{note}</p> : null}
    </figure>
  );
}

export function PredictReveal({ block }: { block: Extract<Block, { kind: 'predict_reveal' }> }) {
  const [choice, setChoice] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <figure className="learn-block">
      <figcaption>{block.title}</figcaption>
      <p>{block.prompt}</p>
      {block.choices.map((option) => (
        <label key={option} className="lesson-check">
          <input type="radio" name={block.title} checked={choice === option} onChange={() => { setChoice(option); }} />
          {option}
        </label>
      ))}
      <button type="button" className="player-btn" disabled={!choice || open} onClick={() => { setOpen(true); }}>Reveal</button>
      {open ? <p>{block.reveal}</p> : null}
    </figure>
  );
}

export function WorkedSteps({ block }: { block: Extract<Block, { kind: 'worked_problem' }> }) {
  const [shown, setShown] = useState(1);
  return (
    <figure className="learn-block">
      <figcaption>{block.title}</figcaption>
      <p>{block.prompt}</p>
      <ol>
        {block.steps.slice(0, shown).map((step) => <li key={step.text}>{step.text}</li>)}
      </ol>
      {shown < block.steps.length ? <button type="button" className="player-btn" onClick={() => { setShown((count) => count + 1); }}>Next step</button> : <p>a = (v - u) / t = {block.a}. Distance s = {block.s}.</p>}
    </figure>
  );
}

export function LearnBlocks({ blocks, conceptId }: { blocks: Block[]; conceptId: string }) {
  return (
    <div className="learn-blocks">
      {blocks.map((block, index) => {
        if (block.kind === 'slider_graph') return <SliderGraph key={block.title} block={block} />;
        if (block.kind === 'moving_object') return <MovingObject key={block.title} block={block} />;
        if (block.kind === 'drag_label') return <DragLabel key={block.title} block={block} conceptId={conceptId} blockIndex={index} />;
        if (block.kind === 'predict_reveal') return <PredictReveal key={block.title} block={block} />;
        return <WorkedSteps key={block.title} block={block} />;
      })}
    </div>
  );
}
