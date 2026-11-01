import type { ComponentType } from 'react';
import type { ArenaApi, GameDef } from '../engine/types';
import './ported.css';

/** Simulations teach; SessionQuestion is the only source of scored answers. */
export function experiment(id: string, title: string, chapter: string, Stage: ComponentType<{ api: ArenaApi }>, tasks: readonly [string, string][]): GameDef {
  return { id, title, chapterRef: chapter, conceptIds: [], scenes: [], arena: {
    name: title, world: chapter, chapterLabel: chapter,
    levels: tasks.map(([name, task]) => ({ title: name, subtitle: 'Explore the idea, then try your checkpoint.',
      taskTitle: name, taskText: task, card2: <p>Change one thing at a time. What changes? What stays the same?</p>,
      primaryLabel: 'Observe again', concept: <span>{task}</span>, Stage, check: () => {},
    })),
  } };
}

export function Slider({ label, value, min = 0, max = 10, step = 1, unit = '', onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (value: number) => void;
}) {
  return <label className="port-slider">{label}: <output>{value} {unit}</output><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export const point = (angle: number, radius = 125) => ({ x: 240 + radius * Math.cos(angle * Math.PI / 180), y: 160 - radius * Math.sin(angle * Math.PI / 180) });
