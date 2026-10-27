import '@fontsource/patrick-hand';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AtomForgeScene, type SceneEpisode, type SceneApi } from './AtomForgeScene';
import './atom-forge-video.css';

type Episode = {
  id: SceneEpisode;
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
    id: 'zoom',
    title: '1 · From salt to atoms',
    blurb: 'Zoom into matter',
    durationMs: 11000,
    captions: [
      'A tiny grain of salt sits in your hand.',
      'Zoom closer… crystals are stacks of atoms.',
      'Closer still — each atom has a busy heart.',
      'Tap the glowing nucleus when you see it.',
    ],
    actAt: 7000,
    actPrompt: 'Tap the glowing nucleus',
    actKind: 'tap-nucleus',
    wrongClip: 'Missed it — the nucleus is the bright clustered centre.',
    rightClip: 'Yes! That dense cluster is the nucleus.',
    concept: 'Everyday matter is atoms packed into patterns.',
  },
  {
    id: 'nucleus',
    title: '2 · Nucleus up close',
    blurb: 'Protons + neutrons',
    durationMs: 10000,
    captions: [
      'Protons (coral) and neutrons (gold) huddle together.',
      'This packed core is almost all the atom’s mass.',
      'Electrons live much farther out.',
      'Tap the nucleus again to lock the idea.',
    ],
    actAt: 6500,
    actPrompt: 'Tap the nucleus cluster',
    actKind: 'tap-nucleus',
    wrongClip: 'Aim for the clustered spheres in the middle.',
    rightClip: 'Locked in — protons and neutrons make the nucleus.',
    concept: 'Nucleus = protons + neutrons. Tiny, heavy, central.',
  },
  {
    id: 'shells',
    title: '3 · Electrons fill shells',
    blurb: 'K then L',
    durationMs: 12000,
    captions: [
      'Electrons race on tilted orbital rings.',
      'They fill from the inside: K shell first.',
      'K only holds two glowing electrons.',
      'Drag the free electron onto the inner K ring.',
    ],
    actAt: 7500,
    actPrompt: 'Drag the electron onto the K shell',
    actKind: 'drag-electron-k',
    wrongClip: 'K is the smallest ring hugging the nucleus. Try again.',
    rightClip: 'K lights up — two electrons make it full.',
    concept: 'Bohr shells fill inside-out. K = 2.',
  },
  {
    id: 'sodium',
    title: '4 · Build sodium',
    blurb: 'Na · 2, 8, 1',
    durationMs: 13000,
    captions: [
      'Sodium has 11 protons — atomic number 11.',
      'Shells fill 2, then 8… one electron left over.',
      'That lonely outer electron wants company.',
      'Drag it onto the outer M shell.',
    ],
    actAt: 8000,
    actPrompt: 'Drag the electron onto the M shell',
    actKind: 'drag-electron-m',
    wrongClip: 'M is the wide outer ring. Drop it there.',
    rightClip: 'Sodium stands: 2, 8, 1 — ready to bond.',
    concept: 'Na electron config is 2,8,1. Valency 1.',
  },
  {
    id: 'bond',
    title: '5 · Why atoms bond',
    blurb: 'Salt is born',
    durationMs: 14000,
    captions: [
      'Chlorine needs one more electron for a full outer shell.',
      'Sodium can give its lonely electron away.',
      'Watch the electron leap with a light trail…',
      'Drag Na’s electron toward Cl to finish the bond.',
    ],
    actAt: 8500,
    actPrompt: 'Drag the electron from Na toward Cl',
    actKind: 'drag-bond',
    wrongClip: 'Pull it across toward the chlorine atom on the right.',
    rightClip: 'Bonded! Charges pull them into a salt crystal.',
    concept: 'Electron transfer → ions → ionic crystal (salt).',
  },
];

type Phase = 'intro' | 'play' | 'act' | 'branch' | 'done';

export function AtomForgeVideo() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [epIndex, setEpIndex] = useState(0);
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [frontier, setFrontier] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [xp, setXp] = useState(0);
  const [branch, setBranch] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);

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
  const captionIndex = Math.min(
    episode.captions.length - 1,
    Math.floor((ms / Math.max(1, episode.durationMs)) * episode.captions.length),
  );
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
    setXp((x) => x + 25);
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
    }, 1700);
  }, [episode, epIndex, totalMs]);

  const fail = useCallback(() => {
    setBranch({ kind: 'bad', text: episode.wrongClip });
    setPhase('branch');
    window.setTimeout(() => {
      setBranch(null);
      setMs(Math.max(0, episode.actAt - 2200));
      setPhase('play');
      setPlaying(true);
    }, 2000);
  }, [episode]);

  const targetShell =
    inAct || phase === 'branch'
      ? episode.actKind === 'drag-electron-k'
        ? 'k'
        : episode.actKind === 'drag-electron-m'
          ? 'm'
          : episode.actKind === 'drag-bond'
            ? 'cl'
            : null
      : null;

  const api: SceneApi = {
    episode: episode.id,
    phase,
    t: phase === 'done' ? 1 : t,
    branchKind: branch?.kind ?? null,
    dragElectron: episode.actKind !== 'tap-nucleus',
    targetShell,
    onNucleusTap: () => {
      if (!inAct || episode.actKind !== 'tap-nucleus') return;
      succeed();
    },
    onShellDrop: (shell, ok) => {
      if (!inAct) return;
      if (ok) succeed();
      else fail();
    },
  };

  const seekEpisode = (index: number) => {
    if (index > unlocked) return;
    setPlaying(false);
    setBranch(null);
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
          <span className="afv-xp">3D interactive video</span>
        </div>
        <p className="afv-lede">
          A Kurzgesagt-style silent short: camera zooms from salt into atoms, then you grab electrons in 3D.
          No quiz screens — only act-in-scene.
        </p>
        <nav className="afv-chapters" aria-label="Episode chapters">
          {EPISODES.map((ep) => (
            <button key={ep.id} type="button" disabled>
              <strong>{ep.title}</strong>
              <small>{ep.blurb}</small>
            </button>
          ))}
        </nav>
        <div className="afv-controls">
          <button
            type="button"
            className="primary"
            data-afv-begin="1"
            onClick={() => {
              setPhase('play');
              setPlaying(true);
            }}
          >
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
            <h1>Salt forged from atoms</h1>
          </div>
          <span className="afv-xp">+{xp} XP</span>
        </div>
        <p className="afv-lede">You zoomed into matter, built sodium, and watched an ionic bond bloom into a crystal.</p>
        <div className="afv-stage-wrap afv-stage-wrap--static">
          <AtomForgeScene
            api={{
              episode: 'bond',
              phase: 'done',
              t: 1,
              branchKind: 'ok',
              dragElectron: false,
              targetShell: null,
              onNucleusTap: () => {},
              onShellDrop: () => {},
            }}
          />
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => {
            setEpIndex(0);
            setMs(0);
            setUnlocked(0);
            setFrontier(0);
            setXp(0);
            setPhase('play');
            setPlaying(true);
          }}
        >
          Watch again
        </button>
      </section>
    );
  }

  return (
    <section
      className="afv"
      aria-label="Atom Forge interactive video"
      data-afv-playing={playing ? '1' : '0'}
      data-afv-phase={phase}
      data-afv-episode={episode.id}
    >
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
        <AtomForgeScene api={api} />

        {inAct && episode.actKind === 'tap-nucleus' && (
          <button
            type="button"
            className="afv-hotspot afv-hotspot--nucleus"
            data-afv-hotspot="nucleus"
            aria-label="Nucleus"
            onClick={() => succeed()}
          />
        )}
        {inAct && episode.actKind === 'drag-electron-k' && (
          <>
            <div className="afv-hotspot afv-hotspot--electron" data-afv-electron="1" />
            <div className="afv-hotspot afv-hotspot--k" data-afv-drop="k" />
            <button type="button" className="afv-assist" data-afv-assist="k" onClick={() => succeed()}>
              Snap to K shell
            </button>
          </>
        )}
        {inAct && episode.actKind === 'drag-electron-m' && (
          <>
            <div className="afv-hotspot afv-hotspot--electron" data-afv-electron="1" />
            <div className="afv-hotspot afv-hotspot--m" data-afv-drop="m" />
            <button type="button" className="afv-assist" data-afv-assist="m" onClick={() => succeed()}>
              Snap to M shell
            </button>
          </>
        )}
        {inAct && episode.actKind === 'drag-bond' && (
          <>
            <div className="afv-hotspot afv-hotspot--electron" data-afv-electron="1" />
            <div className="afv-hotspot afv-hotspot--cl" data-afv-drop="cl" />
            <button type="button" className="afv-assist" data-afv-assist="cl" onClick={() => succeed()}>
              Transfer to Cl
            </button>
          </>
        )}

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
            <span>{inAct ? episode.actPrompt : branch ? branch.text : caption}</span>
          </div>
        </div>
      </div>

      <div className="afv-controls">
        <button type="button" data-afv-play="1" disabled={inAct || Boolean(branch)} onClick={() => setPlaying((p) => !p)}>
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
          <small>
            {Math.floor(globalMs / 1000)}s / {Math.floor(Math.max(frontier, 1) / 1000)}s watched · episode {epIndex + 1}/
            {EPISODES.length}
          </small>
        </label>
      </div>

      <footer className="afv-footer">
        <span>{episode.concept}</span>
        <span>Silent · act-in-scene · no quiz</span>
      </footer>
    </section>
  );
}

export default AtomForgeVideo;
