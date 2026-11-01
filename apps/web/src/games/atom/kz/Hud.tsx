import type { CSSProperties, ReactNode } from 'react';
import { SaathyLine } from './SaathyLine';

export function Tag({ children, color, style, className = '' }: { children: ReactNode; color?: string; style?: CSSProperties; className?: string }) {
  return <div className={`tag ${className}`} style={{ background: color ?? '#2d0089', ...style }}>{children}</div>;
}
export function Leader({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  return <div className="lead" style={{ left: from[0], top: from[1], width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx)}rad)` }} />;
}
export function Caption({ text, onAdvance }: { text: string; onAdvance?: () => void }) {
  const [before, term, after] = text.split(/<b>(.*?)<\/b>/);
  return <button type="button" className="cap" onClick={onAdvance} aria-label="Next caption">
    <SaathyLine /><span aria-live="polite">{before}{term && <b>{term}</b>}{after}</span>
  </button>;
}
export function Meter({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, value * 100));
  return <div className="meter" role="meter" aria-label="Nucleus steadiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
    <div className="row"><span className="end" style={{ background: '#e0244f' }}>Wobbly</span><div className="bar">
      <div className="fill" style={{ width: `${percent}%` }} /><div className="mid" style={{ left: '95%' }} /><div className="knob" style={{ left: `${percent}%` }} />
    </div><span className="end" style={{ background: '#2d0089' }}>Steady</span></div>
  </div>;
}
export function Chips({ protons, neutrons }: { protons: number; neutrons: number }) {
  return <div className="count"><Tag color="#c4246f">{protons} protons</Tag><Tag color="#e8540a">{neutrons} neutrons</Tag><Tag>Z = {protons} · A = {protons + neutrons}</Tag></div>;
}
export function Progress({ current, titles, onSelect }: { current: number; titles: string[]; onSelect: (index: number) => void }) {
  return <nav className="prog" aria-label="Beat chapters">{titles.map((title, i) => <button type="button" key={title} title={title} aria-label={title} aria-current={i === current ? 'step' : undefined} onClick={() => onSelect(i)}><i className={i <= current ? 'on' : ''} /></button>)}</nav>;
}
export function Hint({ children }: { children: ReactNode }) {
  return <div className="hint" data-afv-prompt="1"><div className="ring" />{children}</div>;
}
