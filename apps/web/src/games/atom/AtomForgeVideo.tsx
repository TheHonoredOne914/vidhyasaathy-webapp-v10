import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AtomForgeScene, type ScenePhase } from './AtomForgeScene';
import { BEATS, RECAP } from './kz/beats';
import { Caption, Chips, Hint, Meter, Progress, Tag } from './kz/Hud';
import { atomBuild, conceptQuiz, isotopeSort, isotopeStability } from './validators';
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
  const [zoom, setZoom] = useState(0);
  const [holding, setHolding] = useState(false);
  const [tapped, setTapped] = useState<ParticleKind[]>([]);
  const [neutrons, setNeutrons] = useState(4);
  const [placed, setPlaced] = useState(false);
  const [message, setMessage] = useState('');
  const [sort, setSort] = useState<Record<string, string>>({});
  const [card, setCard] = useState('c12');
  const [build, setBuild] = useState({ p: 6, n: 6, e: 6 });
  const [quiz, setQuiz] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<'in' | 'out' | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const trayStart = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    setZoom(0); setHolding(false); setTapped([]); setNeutrons(4); setPlaced(false); setMessage(''); setSort({}); setQuiz({}); setDragging(null);
  }, [episode]);
  useEffect(() => {
    if (episode !== 0 || phase !== 'act') return;
    const timer = window.setInterval(() => setZoom((value) => Math.max(0, Math.min(1, value + (holding ? 0.035 : -0.008)))), 50);
    return () => window.clearInterval(timer);
  }, [episode, phase, holding]);
  useEffect(() => { if (zoom >= 1 && phase === 'act') { setHolding(false); setBranchKind('ok'); setPhase('branch'); setPlaying(true); } }, [zoom, phase]);

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
      const dt = Math.min(Math.max(0, (now - previous) / 1000), 0.1); previous = now;
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
  const tapParticle = (kind: ParticleKind) => {
    if (episode !== 1 || phase !== 'act') return;
    const next = [...new Set([...tapped, kind])]; setTapped(next);
    setMessage(kind === 'p' ? 'Proton pinned · charge +1' : 'Neutron pinned · no charge');
    if (next.length === 2) complete();
  };
  const shell = (target: string) => {
    if (episode !== 3 || phase !== 'act') return;
    const answer: Record<string, string> = {};
    for (let i = 0; i < 23; i++) answer['n' + i] = 'nucleus';
    for (let i = 0; i < 10; i++) answer['e' + i] = i < 2 ? 'k' : 'l';
    answer.e10 = target;
    if (atomBuild(answer).correct) { setPlaced(true); setMessage(''); complete(); }
    else setMessage("Let's fix this: " + target.toUpperCase() + ' is full');
  };
  const sortCard = (bin: string, selected = card) => {
    if (sort[selected]) return;
    const next = { ...sort, [selected]: bin };
    if ((selected.startsWith('c1') ? 'isotope' : 'isobar') !== bin) { setMessage("Let's fix this: compare Z and A"); return; }
    setSort(next); setMessage('');
    const remaining = ['c12', 'c14', 'ca40', 'ar40'].find((id) => !next[id]);
    if (remaining) setCard(remaining);
    if (isotopeSort(next).correct) complete();
  };
  const configuration = [Math.min(2, build.e), Math.min(8, Math.max(0, build.e - 2)), Math.max(0, build.e - 10)];
  const elements = ['No element', 'Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon', 'Sodium', 'Magnesium', 'Aluminium', 'Silicon', 'Phosphorus', 'Sulfur', 'Chlorine', 'Argon'];
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
  const caption = phase === 'branch' || phase === 'done' ? beat.payoff : beat.captions[Math.max(0, Math.min(beat.captions.length - 1, Math.floor(time / 3.5)))]!;

  return <main className="afv-kz" aria-label="Atom Forge" data-afv-episode={beat.id} data-afv-phase={phase} data-afv-playing={playing ? '1' : '0'}
    onPointerDown={(event) => {
      if ((event.target as HTMLElement).closest('button,input,select,a')) return;
      if (episode === 0 && phase === 'act') setHolding(true);
      if (episode === 2 && phase === 'act') dragStart.current = { x: event.clientX, y: event.clientY };
    }} onPointerUp={(event) => {
      setHolding(false);
      if (dragging === 'in') {
        const x = event.clientX / window.innerWidth, y = event.clientY / window.innerHeight;
        const moved = trayStart.current && Math.hypot(event.clientX - trayStart.current.x, event.clientY - trayStart.current.y) > 12;
        if (!moved || (x > 0.2 && x < 0.8 && y > 0.2 && y < 0.7)) setNeutrons((n) => Math.min(10, n + 1));
      }
      else if (episode === 2 && dragStart.current && Math.hypot(event.clientX - dragStart.current.x, event.clientY - dragStart.current.y) > 80 && event.clientY > window.innerHeight * 0.65) setNeutrons((n) => Math.max(0, n - 1));
      setDragging(null); dragStart.current = null;
    }} onPointerCancel={() => { setHolding(false); setDragging(null); }}>
    <AtomForgeScene episode={beat.id} beat={episode} phase={phase} t={time} branchKind={branchKind} reduced={reduced}
      zoom={zoom} protons={episode === 5 ? build.p : episode === 3 ? 11 : 6} neutrons={episode === 5 ? build.n : episode === 2 ? neutrons : episode === 3 ? 12 : 6}
      electrons={episode === 5 ? build.e : episode === 3 ? placed ? 11 : 10 : 6}
      dragElectron={false} targetShell={null} onNucleusTap={() => undefined} onParticleTap={tapParticle} onShellDrop={(target) => shell(target)} onAnchor={project} />
    <div key={episode} className="iris" aria-hidden="true" />
    <div className="hud">
      <div className="chip"><Tag>Atom Forge</Tag><span className="chapter-name">{beat.title}</span></div>
      <Progress current={episode} titles={BEATS.map((item) => item.title)} onSelect={select} />
      <Link className="exit" to="/student/games" aria-label="Back to games">Back to games</Link>
      {episode === 0 && (phase === 'intro' || phase === 'play') && <div className="title"><h1>What is everything<br />made of?</h1><p>{beat.subtitle}</p></div>}
      {episode === 1 && <>
        <div ref={protonLine} className="lead" /><div ref={neutronLine} className="lead" />
        <div ref={protonTag} className="particle-label proton-label"><Tag color="#c4246f">Proton <small>charge +1</small></Tag></div>
        <div ref={neutronTag} className="particle-label neutron-label"><Tag color="#e8540a">Neutron <small>no charge</small></Tag></div>
      </>}
      {episode === 2 && <><Chips protons={6} neutrons={neutrons} /><Meter value={isotopeStability(6, neutrons) === 'radioactive' ? 0.2 : neutrons === 6 ? 1 : 0.65} /></>}
      {episode === 3 && <div className="count"><Tag>K 2</Tag><Tag>L 8</Tag><Tag>M {placed ? '1' : '0 / 1'}</Tag></div>}
      {episode === 4 && [12, 13, 14].map((mass, i) => <div key={mass}>
        <Tag className="panelTag" style={{ left: ((i + 0.5) * 100 / 3) + '%' }}>{['¹²C', '¹³C', '¹⁴C'][i]}</Tag>
        <div className="panelData" style={{ left: ((i + 0.5) * 100 / 3) + '%' }}>6 protons · {mass - 6} neutrons<span>Z = 6 · A = {mass}</span></div>
      </div>)}
      {phase === 'intro' && <button type="button" className="primary begin" data-afv-begin="1" onClick={() => { setPhase('play'); setPlaying(true); }}>Enter the atom</button>}
      {episode === 2 && phase !== 'done' && <div className={'push-arrows' + (neutrons === 6 || neutrons === 7 ? ' stable' : '')} aria-hidden="true"><i /><i /></div>}
      {phase === 'act' && <>{episode !== 0 && <Hint>{beat.hint}</Hint>}<div className="act-controls" data-afv-prompt="1">
        {episode === 0 && <button type="button" className="primary" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setHolding(true); }} onPointerUp={() => setHolding(false)} onPointerCancel={() => setHolding(false)} onKeyDown={(event) => { if ([' ', 'Enter', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setHolding(true); } }} onKeyUp={() => setHolding(false)} onBlur={() => setHolding(false)}>Hold to zoom</button>}
        {episode === 1 && <>{(['p', 'n'] as const).map((kind) => <button type="button" key={kind} data-afv-hotspot={kind} aria-pressed={tapped.includes(kind)} onClick={() => tapParticle(kind)}>Tap {kind === 'p' ? 'proton' : 'neutron'}</button>)}</>}
        {episode === 2 && <><button type="button" data-afv-drop="neutron" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); trayStart.current = { x: event.clientX, y: event.clientY }; setDragging('in'); }} onClick={(event) => { if (event.detail === 0) setNeutrons((n) => Math.min(10, n + 1)); }}>Add neutron</button><button type="button" onClick={() => setNeutrons((n) => Math.max(0, n - 1))}>Remove neutron</button><button type="button" disabled={neutrons !== 6} onClick={complete}>Keep this nucleus</button><span>{neutrons > 6 ? 'Almost there, one too many' : 'Make carbon-12'}</span></>}
        {episode === 3 && <>{['k', 'l', 'm'].map((target) => <button type="button" data-afv-electron={target} className={target === 'm' && message ? 'slot-hint' : ''} key={target} onClick={() => shell(target)}>Shell {target.toUpperCase()}</button>)}</>}
        {episode === 4 && <><div className="sort-cards">{[['c12', 'C-12 · Z 6'], ['c14', 'C-14 · Z 6'], ['ca40', 'Ca-40 · Z 20'], ['ar40', 'Ar-40 · Z 18']].map(([id, label]) => <button type="button" key={id} disabled={!!sort[id!]} aria-pressed={card === id} draggable onDragStart={(event) => { setCard(id!); event.dataTransfer.setData('text/plain', id!); }} onClick={() => setCard(id!)}>{label}{sort[id!] ? ' · placed' : ''}</button>)}</div>{['isotope', 'isobar'].map((bin) => <button type="button" className="sort-bin" key={bin} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); sortCard(bin); }} onClick={() => sortCard(bin)}>{bin === 'isotope' ? 'Isotopes' : 'Isobars'}</button>)}</>}
        {episode === 5 && <><div className="build-controls">{(['p', 'n', 'e'] as const).map((kind) => <div key={kind}><span>{kind === 'p' ? 'Protons' : kind === 'n' ? 'Neutrons' : 'Electrons'} {build[kind]}</span>{[-1, 1].map((step) => <button type="button" key={step} aria-label={(step > 0 ? 'Add ' : 'Remove ') + kind} onClick={() => setBuild((value) => ({ ...value, [kind]: Math.max(kind === 'p' ? 1 : 0, Math.min(18, value[kind] + step)) }))}>{step > 0 ? '+' : '−'}</button>)}</div>)}</div><p>{elements[build.p]} · Z {build.p} · A {build.p + build.n} · {configuration.join(', ')} · {isotopeStability(build.p, build.n)}</p><div className="quiz">{[
          { id: 'q1', text: 'What sets Z?', options: ['protons', 'neutrons', 'electrons'] },
          { id: 'q2', text: '6 protons + 8 neutrons: A?', options: ['six', 'eight', 'fourteen'] },
          { id: 'q3', text: 'Same Z, different A?', options: ['isotopes', 'isobars', 'ions'] },
        ].map((question) => <label key={question.id}>{question.text}<select aria-label={question.text} value={quiz[question.id] ?? ''} onChange={(event) => setQuiz({ ...quiz, [question.id]: event.target.value })}><option value="">Choose</option>{question.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div><button type="button" onClick={() => { const result = conceptQuiz(quiz); if (result.correct) complete(); else setMessage(result.feedback); }}>Check my recall</button></>}
      </div>{message && <p className="action-message" role="status">{message}</p>}</>}
      {phase === 'branch' && <div className="payoff" data-afv-branch={branchKind ?? 'ok'}>Almost there · watch what changes</div>}
      {phase === 'done' && <section className="recap" aria-label="Atom recap"><h1>Your atom recap</h1><div className="recap-grid">{RECAP.map((card) => <article key={card.kind}>
        <div className={'vignette ' + card.kind} aria-hidden="true"><i>+</i><i>0</i><i>−</i></div><h2>{card.title}</h2><p>{card.text}</p>
      </article>)}</div><button type="button" className="primary" onClick={() => select(0)}>Explore again</button></section>}
      {phase !== 'done' && <Caption text={caption} onAdvance={advanceCaption} />}
      {phase !== 'intro' && phase !== 'done' && <div className="transport">
        <button type="button" data-afv-play="1" disabled={phase === 'act'} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
        <input data-afv-scrub="1" aria-label="Cutscene timeline" type="range" min={0} max={beat.actAt} step={0.1} value={time} onChange={(event) => { setTime(Number(event.target.value)); setPhase('play'); setBranchKind(null); }} />
        <span data-afv-time="1">{Math.floor(time)} / {beat.actAt}s</span>
        {phase === 'play' && <button type="button" data-afv-assist="1" onClick={skip}>Your turn</button>}
      </div>}
    </div>
  </main>;
}
