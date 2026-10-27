import { useCallback, useEffect, useMemo, useState } from 'react';
import './atom-forge-video.css';

type Episode = {
  id: string;
  title: string;
  blurb: string;
  durationMs: number;
  captions: string[];
  actAt: number;
  actPrompt: string;
  actKind: 'tap-nucleus' | 'drag-electron-k' | 'drag-electron-m' | 'drag-bond';
  wrongClip: string;
  rightClip: string;
  concept: string;
};

const EPISODES: Episode[] = [
  {
    id: 'inside',
    title: '1 · What is inside an atom',
    blurb: 'Nucleus + electrons',
    durationMs: 12000,
    captions: [
      'Every atom has a tiny dense centre.',
      'We call that centre the nucleus.',
      'Electrons move around it in shells.',
      'Tap the nucleus to prove you see it.',
    ],
    actAt: 7500,
    actPrompt: 'Tap the glowing nucleus',
    actKind: 'tap-nucleus',
    wrongClip: 'That was a shell, not the centre. The nucleus sits in the middle.',
    rightClip: 'Yes! The nucleus is the tiny dense centre.',
    concept: 'Nucleus = protons + neutrons. Electrons orbit outside.',
  },
  {
    id: 'shells',
    title: '2 · Electrons fill shells',
    blurb: 'K then L',
    durationMs: 13000,
    captions: [
      'Electrons do not float randomly.',
      'They fill shells: K first, then L.',
      'K shell holds only 2 electrons.',
      'Drag an electron into the K shell.',
    ],
    actAt: 8000,
    actPrompt: 'Drag the electron into the inner K shell',
    actKind: 'drag-electron-k',
    wrongClip: 'K is the small ring closest to the nucleus. Try again.',
    rightClip: 'Perfect. K fills first — only 2 electrons fit.',
    concept: 'Bohr shells: K=2, L=8. Fill from the inside out.',
  },
  {
    id: 'sodium',
    title: '3 · Build sodium',
    blurb: 'Na · 2, 8, 1',
    durationMs: 14000,
    captions: [
      'Sodium has 11 protons — so Z = 11.',
      'Electrons: 2 in K, 8 in L, 1 in M.',
      'That lonely outer electron is special.',
      'Drag the outer electron onto the M shell.',
    ],
    actAt: 8500,
    actPrompt: 'Drag the outer electron onto the M shell',
    actKind: 'drag-electron-m',
    wrongClip: 'M is the outer ring. Sodium keeps one electron there.',
    rightClip: 'Sodium is ready: 2, 8, 1. Valency is 1.',
    concept: 'Atomic number Z = protons. Na electron config is 2,8,1.',
  },
  {
    id: 'bond',
    title: '4 · Why atoms bond',
    blurb: 'Share to be stable',
    durationMs: 13000,
    captions: [
      'Atoms want a full outer shell.',
      'Sodium has 1; chlorine needs 1.',
      'They can transfer that electron.',
      'Drag Na’s electron toward Cl to bond.',
    ],
    actAt: 8000,
    actPrompt: 'Drag the electron from Na toward Cl',
    actKind: 'drag-bond',
    wrongClip: 'Move the electron from sodium toward chlorine.',
    rightClip: 'Bond formed! Na⁺ and Cl⁻ both feel stable.',
    concept: 'Atoms bond to complete outer shells (octet idea).',
  },
];

type Phase = 'intro' | 'play' | 'act' | 'branch' | 'done';


function Stage({
  episode,
  t,
  act,
  drag,
  onTapNucleus,
  onDragMove,
  onDragEnd,
  onDragStart,
}: {
  episode: Episode;
  t: number;
  act: boolean;
  drag: { x: number; y: number } | null;
  onTapNucleus: () => void;
  onDragStart: (x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const spin = t * Math.PI * 2;
  const glow = 0.55 + Math.sin(t * Math.PI * 4) * 0.25;
  const kR = 70;
  const lR = 120;
  const mR = 170;
  const e1 = { x: 400 + kR * Math.cos(spin), y: 230 + kR * Math.sin(spin) };
  const e2 = { x: 400 + kR * Math.cos(spin + Math.PI), y: 230 + kR * Math.sin(spin + Math.PI) };
  const tray = { x: 120, y: 320 };
  const electron = drag ?? (act ? tray : null);
  const showCl = episode.id === 'bond';
  const naX = showCl ? 300 : 400;
  const clX = 520;

  return (
    <svg viewBox="0 0 800 420" role="img" aria-label={episode.title} data-afv-stage="1">
      <defs>
        <radialGradient id="afv-nuc" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffd9c2" />
          <stop offset="100%" stopColor="#e8b84a" />
        </radialGradient>
        <filter id="afv-soft"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <rect width="800" height="420" fill="#0b1a33" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={80 + i * 120} cy={40 + (i % 2) * 30} r={1.6 + (i % 3)} fill="#d6e2e6" opacity={0.35 + (Math.sin(spin + i) + 1) * 0.15} />
      ))}

      {!showCl && (
        <>
          <circle cx="400" cy="230" r={mR} fill="none" stroke="#517dab" strokeWidth="2" strokeDasharray="6 8" opacity={episode.id === 'sodium' || episode.id === 'shells' ? 0.55 : 0.2} />
          <circle cx="400" cy="230" r={lR} fill="none" stroke="#bfe3f5" strokeWidth="2.5" opacity={0.7} />
          <circle cx="400" cy="230" r={kR} fill="none" stroke="#ffd9c2" strokeWidth="3" opacity={0.9} data-afv-shell="k" />
          <g
            data-afv-nucleus="1"
            style={{ cursor: act && episode.actKind === 'tap-nucleus' ? 'pointer' : 'default' }}
            onClick={() => { if (act && episode.actKind === 'tap-nucleus') onTapNucleus(); }}
          >
            <circle cx="400" cy="230" r={28 + glow * 4} fill="url(#afv-nuc)" opacity={glow} filter="url(#afv-soft)" />
            <circle cx="400" cy="230" r="22" fill="url(#afv-nuc)" stroke="#041d3d" strokeWidth="3" />
            <text x="400" y="236" textAnchor="middle" fill="#041d3d" fontSize="14" fontWeight="700">
              {episode.id === 'sodium' ? 'Na' : 'N'}
            </text>
          </g>
          <circle cx={e1.x} cy={e1.y} r="10" fill="#d6e2e6" stroke="#041d3d" strokeWidth="2" />
          <circle cx={e2.x} cy={e2.y} r="10" fill="#d6e2e6" stroke="#041d3d" strokeWidth="2" opacity={episode.id === 'inside' ? 0.35 : 1} />
          {(episode.id === 'shells' || episode.id === 'sodium') && (
            <>
              <circle cx={400 + lR * Math.cos(-spin * 0.6)} cy={230 + lR * Math.sin(-spin * 0.6)} r="9" fill="#bfe3f5" stroke="#041d3d" strokeWidth="2" />
              <circle cx={400 + lR * Math.cos(-spin * 0.6 + 1.2)} cy={230 + lR * Math.sin(-spin * 0.6 + 1.2)} r="9" fill="#bfe3f5" stroke="#041d3d" strokeWidth="2" />
            </>
          )}
        </>
      )}

      {showCl && (
        <>
          <circle cx={naX} cy="230" r={kR} fill="none" stroke="#ffd9c2" strokeWidth="2.5" />
          <circle cx={naX} cy="230" r="22" fill="url(#afv-nuc)" stroke="#041d3d" strokeWidth="3" />
          <text x={naX} y="236" textAnchor="middle" fill="#041d3d" fontSize="14" fontWeight="700">Na</text>
          <circle cx={clX} cy="230" r={kR + 20} fill="none" stroke="#bfe3f5" strokeWidth="2.5" />
          <circle cx={clX} cy="230" r="22" fill="#bfe3f5" stroke="#041d3d" strokeWidth="3" />
          <text x={clX} y="236" textAnchor="middle" fill="#041d3d" fontSize="14" fontWeight="700">Cl</text>
          <path d={`M ${naX + 30} 230 Q 400 ${200 + Math.sin(spin) * 20} ${clX - 30} 230`} fill="none" stroke="#e8b84a" strokeWidth="3" strokeDasharray="5 6" opacity={0.7} />
        </>
      )}

      {electron && (
        <g
          data-afv-electron="1"
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const local = pt.matrixTransform(ctm.inverse());
            (e.target as Element).setPointerCapture?.(e.pointerId);
            onDragStart(local.x, local.y);
          }}
          onPointerMove={(e) => {
            if (!drag) return;
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const local = pt.matrixTransform(ctm.inverse());
            onDragMove(local.x, local.y);
          }}
          onPointerUp={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const local = pt.matrixTransform(ctm.inverse());
            onDragEnd(local.x, local.y);
          }}
        >
          <circle cx={electron.x} cy={electron.y} r="16" fill="#ffd9c2" opacity="0.35" />
          <circle cx={electron.x} cy={electron.y} r="12" fill="#d6e2e6" stroke="#e8b84a" strokeWidth="3" />
          <text x={electron.x} y={electron.y + 4} textAnchor="middle" fill="#041d3d" fontSize="12" fontWeight="700">e⁻</text>
        </g>
      )}

      {act && episode.actKind === 'tap-nucleus' && (
        <circle cx="400" cy="230" r="34" fill="none" stroke="#e8b84a" strokeWidth="3" strokeDasharray="4 4">
          <animate attributeName="r" values="30;40;30" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      {act && episode.actKind === 'drag-electron-k' && (
        <circle cx="400" cy="230" r={kR} fill="none" stroke="#e8b84a" strokeWidth="4" opacity="0.8" data-afv-drop="k" />
      )}
      {act && episode.actKind === 'drag-electron-m' && (
        <circle cx="400" cy="230" r={mR} fill="none" stroke="#e8b84a" strokeWidth="4" opacity="0.8" data-afv-drop="m" />
      )}
      {act && episode.actKind === 'drag-bond' && (
        <circle cx={clX} cy="230" r="50" fill="none" stroke="#e8b84a" strokeWidth="4" opacity="0.85" data-afv-drop="cl" />
      )}

      <text x="24" y="36" fill="#d6e2e6" fontSize="16" fontWeight="700">{episode.title}</text>
      <text x="24" y="58" fill="#bfe3f5" fontSize="13">{episode.concept}</text>
    </svg>
  );
}

export function AtomForgeVideo() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [epIndex, setEpIndex] = useState(0);
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [frontier, setFrontier] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [xp, setXp] = useState(0);
  const [branch, setBranch] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const episode = EPISODES[epIndex]!;
  const offsets = useMemo(() => {
    let o = 0;
    return EPISODES.map((ep) => {
      const start = o;
      o += ep.durationMs;
      return start;
    });
  }, []);
  const totalMs = offsets[offsets.length - 1]! + EPISODES[EPISODES.length - 1]!.durationMs;
  const globalMs = (offsets[epIndex] ?? 0) + ms;
  const captionIndex = Math.min(episode.captions.length - 1, Math.floor((ms / episode.durationMs) * episode.captions.length));
  const caption = episode.captions[captionIndex] ?? '';
  const t = episode.durationMs <= 0 ? 0 : ms / episode.durationMs;
  const inAct = phase === 'act';


  useEffect(() => {
    if (!playing || phase !== 'play') return;
    let frame = 0;
    let prev: number | null = null;
    let local = ms;
    const stopAt = episode.actAt;
    const tick = (now: number) => {
      const delta = prev == null ? 0 : now - prev;
      prev = now;
      local = Math.min(stopAt, local + delta);
      setMs(local);
      setFrontier((f) => Math.max(f, (offsets[epIndex] ?? 0) + local));
      if (local >= stopAt) {
        setPlaying(false);
        setPhase('act');
        setDrag(
          episode.actKind === 'tap-nucleus'
            ? null
            : episode.actKind === 'drag-bond'
              ? { x: 300, y: 230 }
              : { x: 120, y: 320 },
        );
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, phase, episode, epIndex, offsets]); // eslint-disable-line react-hooks/exhaustive-deps

  const succeed = useCallback(() => {
    setBranch({ kind: 'ok', text: episode.rightClip });
    setPhase('branch');
    setDrag(null);
    setXp((x) => x + 20);
    window.setTimeout(() => {
      setBranch(null);
      if (epIndex >= EPISODES.length - 1) {
        setPhase('done');
        setMs(episode.durationMs);
        setFrontier(totalMs);
        return;
      }
      const next = epIndex + 1;
      setUnlocked((u) => Math.max(u, next));
      setEpIndex(next);
      setMs(0);
      setPhase('play');
      setPlaying(true);
    }, 1600);
  }, [episode, epIndex, totalMs]);

  const fail = useCallback(() => {
    setBranch({ kind: 'bad', text: episode.wrongClip });
    setPhase('branch');
    setDrag(null);
    window.setTimeout(() => {
      setBranch(null);
      setMs(Math.max(0, episode.actAt - 2500));
      setPhase('play');
      setPlaying(true);
    }, 2200);
  }, [episode]);

  const onTapNucleus = () => {
    if (!inAct || episode.actKind !== 'tap-nucleus') return;
    succeed();
  };

  const judgeDrop = (x: number, y: number) => {
    if (!inAct) return;
    const dist = (cx: number, cy: number) => Math.hypot(x - cx, y - cy);
    if (episode.actKind === 'drag-electron-k') {
      if (dist(400, 230) < 95) succeed();
      else fail();
      return;
    }
    if (episode.actKind === 'drag-electron-m') {
      const d = dist(400, 230);
      if (d > 145 && d < 200) succeed();
      else fail();
      return;
    }
    if (episode.actKind === 'drag-bond') {
      if (dist(520, 230) < 60) succeed();
      else fail();
    }
  };

  const seekEpisode = (index: number) => {
    if (index > unlocked) return;
    setPlaying(false);
    setBranch(null);
    setDrag(null);
    setEpIndex(index);
    setMs(0);
    setPhase('play');
  };

  const scrub = (value: number) => {
    const target = Math.max(0, Math.min(frontier, value));
    let index = 0;
    for (let i = 1; i <= unlocked; i += 1) {
      if ((offsets[i] ?? Infinity) <= target) index = i;
    }
    setPlaying(false);
    setBranch(null);
    setDrag(null);
    setEpIndex(index);
    setMs(Math.min(EPISODES[index]!.durationMs, target - (offsets[index] ?? 0)));
    setPhase('play');
  };

  if (phase === 'intro') {
    return (
      <section className="afv" aria-label="Atom Forge interactive video">
        <div className="afv-top">
          <div>
            <p>NCERT · Class 9 · Ch 4 Structure of the Atom</p>
            <h1>Atom Forge</h1>
          </div>
          <span className="afv-xp">Interactive video</span>
        </div>
        <p>An animated story that pauses for you to act in the scene — tap, drag, then keep watching. No quiz screens.</p>
        <nav className="afv-chapters" aria-label="Episode chapters">
          {EPISODES.map((ep) => (
            <button key={ep.id} type="button" disabled>
              <strong>{ep.title}</strong>
              <small>{ep.blurb}</small>
            </button>
          ))}
        </nav>
        <div className="afv-controls">
          <button type="button" className="primary" data-afv-begin="1" onClick={() => { setPhase('play'); setPlaying(true); }}>
            Begin episode 1
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'done') {
    return (
      <section className="afv" aria-label="Atom Forge complete">
        <div className="afv-top">
          <div>
            <p>Episode complete</p>
            <h1>You forged the atom story</h1>
          </div>
          <span className="afv-xp">+{xp} XP</span>
        </div>
        <p>Nucleus, shells, sodium’s 2,8,1, and why atoms bond — all from acting in the scene.</p>
        <button type="button" className="primary" onClick={() => { setEpIndex(0); setMs(0); setUnlocked(0); setFrontier(0); setXp(0); setPhase('play'); setPlaying(true); }}>
          Watch again
        </button>
      </section>
    );
  }

  return (
    <section className="afv" aria-label="Atom Forge interactive video" data-afv-playing={playing ? '1' : '0'} data-afv-phase={phase} data-afv-episode={episode.id}>
      <div className="afv-top">
        <div>
          <p>NCERT · Class 9 · Ch 4 Structure of the Atom</p>
          <h1>Atom Forge</h1>
        </div>
        <span className="afv-xp">{xp} XP</span>
      </div>

      <nav className="afv-chapters" aria-label="Episode chapters">
        {EPISODES.map((ep, index) => (
          <button
            key={ep.id}
            type="button"
            disabled={index > unlocked}
            aria-current={index === epIndex ? 'step' : undefined}
            onClick={() => seekEpisode(index)}
          >
            <strong>{ep.title}</strong>
            <small>{ep.blurb}</small>
          </button>
        ))}
      </nav>

      <div className="afv-stage-wrap">
        <Stage
          episode={episode}
          t={t}
          act={inAct}
          drag={drag}
          onTapNucleus={onTapNucleus}
          onDragStart={(x, y) => setDrag({ x, y })}
          onDragMove={(x, y) => setDrag({ x, y })}
          onDragEnd={(x, y) => { setDrag({ x, y }); judgeDrop(x, y); }}
        />
        {inAct && episode.actKind === 'tap-nucleus' && (
          <button type="button" className="afv-hotspot afv-hotspot--nucleus" data-afv-hotspot="nucleus" aria-label="Nucleus" onClick={onTapNucleus} />
        )}
        {inAct && episode.actKind === 'drag-electron-k' && <div className="afv-hotspot afv-hotspot--k" data-afv-drop="k" data-afv-hotspot="k" />}
        {inAct && episode.actKind === 'drag-electron-m' && <div className="afv-hotspot afv-hotspot--m" data-afv-drop="m" data-afv-hotspot="m" />}
        {inAct && episode.actKind === 'drag-bond' && <div className="afv-hotspot afv-hotspot--cl" data-afv-drop="cl" data-afv-hotspot="cl" />}
        {inAct && <div className="afv-prompt" data-afv-prompt="1">{episode.actPrompt}</div>}
        {branch && (
          <div className="afv-branch" data-kind={branch.kind} data-afv-branch={branch.kind}>
            <h2>{branch.kind === 'ok' ? 'Nice!' : 'Watch again'}</h2>
            <p>{branch.text}</p>
          </div>
        )}
        <div className="afv-caption" aria-live="polite">
          <div>
            <strong>Saathy</strong>
            <span>{inAct ? episode.actPrompt : caption}</span>
          </div>
        </div>
      </div>

      <div className="afv-controls">
        <button
          type="button"
          data-afv-play="1"
          disabled={inAct || Boolean(branch)}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <label className="afv-scrub">
          <input
            type="range"
            min={0}
            max={Math.max(1, frontier)}
            step={1}
            value={Math.min(frontier, globalMs)}
            aria-label="Progress scrubber"
            data-afv-scrub="1"
            disabled={frontier === 0 || Boolean(branch)}
            onChange={(e) => scrub(Number(e.target.value))}
          />
          <small>{Math.floor(globalMs / 1000)}s / {Math.floor(Math.max(frontier, 1) / 1000)}s watched · episode {epIndex + 1}/4</small>
        </label>
      </div>

      <footer className="afv-footer">
        <span>{episode.concept}</span>
        <span>Act-in-scene · no quiz</span>
      </footer>
    </section>
  );
}

export default AtomForgeVideo;
