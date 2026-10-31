import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AtomForgeScene, type ScenePhase } from './AtomForgeScene';
import { BEATS, RECAP } from './kz/beats';
import { Caption, Chips, Hint, Progress, Tag } from './kz/Hud';
import type { ParticleKind } from './kz/Particle';
import type { ScreenAnchor } from './kz/useProjected';
import './atom-forge-video.css';

export function AtomForgeVideo() {
  const [episode, setEpisode] = useState(0);
  const [phase, setPhase] = useState<ScenePhase>('intro');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [branchKind, setBranchKind] = useState<'ok' | 'bad' | null>(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const protonTag = useRef<HTMLDivElement>(null), neutronTag = useRef<HTMLDivElement>(null);
  const protonLine = useRef<HTMLDivElement>(null), neutronLine = useRef<HTMLDivElement>(null);
  const beat = BEATS[episode]!;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (phase !== 'play' || !playing) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.1); previous = now;
      setTime((value) => Math.min(beat.actAt, value + dt));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, playing, beat.actAt]);
  useEffect(() => {
    if (phase === 'play' && time >= beat.actAt) { setPhase('act'); setPlaying(false); }
  }, [time, phase, beat.actAt]);
  useEffect(() => {
    if (phase !== 'branch' || branchKind !== 'ok' || !playing) return;
    const timer = window.setTimeout(() => {
      if (episode === BEATS.length - 1) { setPhase('done'); setPlaying(false); }
      else { setEpisode(episode + 1); setTime(0); setBranchKind(null); setPhase('play'); }
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [phase, branchKind, playing, episode]);

  const select = (index: number) => { setEpisode(index); setTime(0); setPhase('play'); setBranchKind(null); setPlaying(true); };
  const complete = () => { setBranchKind('ok'); setPhase('branch'); setPlaying(true); };
  const skip = () => { setTime(beat.actAt); setPhase('act'); setPlaying(false); };
  const advanceCaption = () => {
    if (phase === 'play') setTime((value) => Math.min(beat.actAt, (Math.floor(value / 3.5) + 1) * 3.5));
  };
  const project = useCallback((kind: ParticleKind, point: ScreenAnchor) => {
    const tag = (kind === 'p' ? protonTag : neutronTag).current;
    const line = (kind === 'p' ? protonLine : neutronLine).current;
    if (!tag || !line) return;
    const rect = tag.getBoundingClientRect();
    const x = kind === 'p' ? rect.right : rect.left, y = rect.top + rect.height / 2;
    const dx = point.x - x, dy = point.y - y;
    Object.assign(line.style, { left: x + 'px', top: y + 'px', width: Math.hypot(dx, dy) + 'px', transform: 'rotate(' + Math.atan2(dy, dx) + 'rad)', opacity: point.visible ? '1' : '0' });
  }, []);
  const caption = phase === 'branch' || phase === 'done' ? beat.payoff : beat.captions[Math.min(beat.captions.length - 1, Math.floor(time / 3.5))]!;

  return <main className="afv-kz" aria-label="Atom Forge" data-afv-episode={beat.id} data-afv-phase={phase} data-afv-playing={playing ? '1' : '0'}>
    <AtomForgeScene episode={beat.id} beat={episode} phase={phase} t={time} branchKind={branchKind} reduced={reduced}
      dragElectron={false} targetShell={null} onNucleusTap={() => undefined} onShellDrop={() => undefined} onAnchor={project} />
    <div className="hud">
      <div className="chip"><Tag>Atom Forge</Tag><span className="chapter-name">{beat.title}</span></div>
      <Progress current={episode} titles={BEATS.map((item) => item.title)} onSelect={select} />
      <Link className="exit" to="/student/games" aria-label="Back to games">Back to games</Link>
      {episode === 0 && phase !== 'done' && <div className="title"><h1>What is everything<br />made of?</h1><p>{beat.subtitle}</p></div>}
      {episode === 1 && <>
        <div ref={protonLine} className="lead" /><div ref={neutronLine} className="lead" />
        <div ref={protonTag} className="particle-label proton-label"><Tag color="#c4246f">Proton <small>charge +1</small></Tag></div>
        <div ref={neutronTag} className="particle-label neutron-label"><Tag color="#e8540a">Neutron <small>no charge</small></Tag></div>
      </>}
      {episode === 2 && <Chips protons={6} neutrons={4} />}
      {episode === 3 && <div className="count"><Tag>K 2</Tag><Tag>L 8</Tag><Tag>M 0 / 1</Tag></div>}
      {episode === 4 && [12, 13, 14].map((mass, i) => <div key={mass}>
        <Tag className="panelTag" style={{ left: ((i + 0.5) * 100 / 3) + '%' }}>{['¹²C', '¹³C', '¹⁴C'][i]}</Tag>
        <div className="panelData" style={{ left: ((i + 0.5) * 100 / 3) + '%' }}>6 protons · {mass - 6} neutrons<span>Z = 6 · A = {mass}</span></div>
      </div>)}
      {phase === 'intro' && <button type="button" className="primary begin" data-afv-begin="1" onClick={() => { setPhase('play'); setPlaying(true); }}>Enter the atom</button>}
      {phase === 'act' && <><Hint>{beat.hint}</Hint><div className="act-controls"><button type="button" className="primary" data-afv-assist="continue" onClick={complete}>Continue exploring</button></div></>}
      {phase === 'branch' && <div className="payoff" data-afv-branch={branchKind ?? 'ok'}>Almost there · watch what changes</div>}
      {phase === 'done' && <section className="recap" aria-label="Atom recap"><h1>Mastered</h1><div className="recap-grid">{RECAP.map((card) => <article key={card.kind}>
        <div className={'vignette ' + card.kind} aria-hidden="true"><i>+</i><i>0</i><i>−</i></div><h2>{card.title}</h2><p>{card.text}</p>
      </article>)}</div><button type="button" className="primary" onClick={() => select(0)}>Explore again</button></section>}
      {phase !== 'done' && <Caption text={caption} onAdvance={advanceCaption} />}
      {phase !== 'intro' && phase !== 'done' && <div className="transport">
        <button type="button" data-afv-play="1" disabled={phase === 'act'} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
        <input data-afv-scrub="1" aria-label="Cutscene timeline" type="range" min={0} max={beat.actAt} step={0.1} value={time} onChange={(event) => { setTime(Number(event.target.value)); setPhase('play'); setBranchKind(null); }} />
        <span data-afv-time="1">{Math.floor(time)} / {beat.actAt}s</span>
        {phase === 'play' && <button type="button" onClick={skip}>Your turn</button>}
      </div>}
    </div>
  </main>;
}
