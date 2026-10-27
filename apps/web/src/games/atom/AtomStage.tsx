import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArenaApi } from '../engine/types';

type Particle = { id: number; x: number; y: number; kind: 'n' | 'e' | 'burst'; life: number };
type DragState = { kind: 'n' | 'e'; id: number; x: number; y: number } | null;

const CX = 390;
const CY = 280;

function shellRadius(shell: 'K' | 'L') {
  return shell === 'K' ? 88 : 196;
}

function pointInCircle(x: number, y: number, cx: number, cy: number, r: number) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function targetsForLevel(level: number) {
  if (level === 1) return { protons: 1, electrons: 1, neutrons: 0, label: 'H' };
  if (level === 2) return { protons: 6, electrons: 6, neutrons: 6, label: 'C' };
  if (level === 3) return { protons: 6, electrons: 6, neutrons: 8, label: 'C' };
  return { protons: 6, electrons: 6, neutrons: 7, label: 'C' };
}

export function AtomStage({ api }: { api: ArenaApi }) {
  const level = api.round;
  const target = targetsForLevel(level);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [neutrons, setNeutrons] = useState(level === 1 ? 0 : 6);
  const [electrons, setElectrons] = useState(level === 1 || level === 2 ? 0 : 6);
  const [drag, setDrag] = useState<DragState>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false);
  const [glow, setGlow] = useState(false);
  const [combo, setCombo] = useState(0);
  const [tick, setTick] = useState(0);
  const nextId = useRef(1);
  const lastReadout = useRef('');

  const protons = target.protons;
  const mass = protons + neutrons;
  const symbol = target.label;
  const kFilled = Math.min(electrons, 2);
  const lFilled = Math.max(0, electrons - 2);
  const stable =
    electrons === target.electrons &&
    neutrons === target.neutrons &&
    (level !== 2 || (kFilled === 2 && lFilled === 4));

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (now - last > 32) {
        setTick((t) => (t + 1) % 3600);
        setParticles((list) =>
          list
            .map((p) => ({ ...p, life: p.life - 1, y: p.y - 1.2 }))
            .filter((p) => p.life > 0),
        );
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const burst = useCallback((x: number, y: number) => {
    const idBase = nextId.current;
    nextId.current += 12;
    setParticles((list) => [
      ...list,
      ...Array.from({ length: 12 }, (_, i) => ({
        id: idBase + i,
        x: x + Math.cos((i / 12) * Math.PI * 2) * 8,
        y: y + Math.sin((i / 12) * Math.PI * 2) * 8,
        kind: 'burst' as const,
        life: 24 + (i % 6),
      })),
    ]);
  }, []);

  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: CX, y: CY };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const onPointerDownTray = (kind: 'n' | 'e') => (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = toSvgPoint(event.clientX, event.clientY);
    setDrag({ kind, id: nextId.current++, x: p.x, y: p.y });
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag) return;
    const p = toSvgPoint(event.clientX, event.clientY);
    setDrag({ ...drag, x: p.x, y: p.y });
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (!drag) return;
    const p = toSvgPoint(event.clientX, event.clientY);
    let accepted = false;
    if (drag.kind === 'n' && pointInCircle(p.x, p.y, CX, CY, 70)) {
      setNeutrons((n) => Math.min(12, n + 1));
      burst(CX, CY);
      accepted = true;
    }
    if (drag.kind === 'e') {
      const inK =
        pointInCircle(p.x, p.y, CX, CY, shellRadius('K') + 24) &&
        !pointInCircle(p.x, p.y, CX, CY, 55);
      const inL =
        pointInCircle(p.x, p.y, CX, CY, shellRadius('L') + 28) &&
        !pointInCircle(p.x, p.y, CX, CY, shellRadius('K') + 20);
      if ((inK && electrons < 2) || (inL && electrons >= 2 && electrons < 10) || (level === 1 && inK)) {
        setElectrons((e) => Math.min(10, e + 1));
        burst(p.x, p.y);
        accepted = true;
      }
    }
    if (accepted) {
      setCombo((c) => c + 1);
      setGlow(true);
      window.setTimeout(() => setGlow(false), 420);
    } else {
      setShake(true);
      window.setTimeout(() => setShake(false), 320);
    }
    setDrag(null);
  };

  useEffect(() => {
    const payload = JSON.stringify({
      protons,
      neutrons,
      mass,
      electrons,
      isotope: `${symbol}-${mass}`,
    });
    if (payload === lastReadout.current) return;
    lastReadout.current = payload;
    api.setStats({
      label: level === 4 ? 'Stability' : 'Particles',
      value:
        level === 4
          ? stable
            ? 'Stable'
            : 'Tuning'
          : String(protons + neutrons + electrons),
    });
    api.setReadout({
      protons: String(protons),
      neutrons: String(neutrons),
      mass: String(mass),
      isotope: `${symbol}-${mass}`,
      electrons: String(electrons),
    });
  }, [api, electrons, level, mass, neutrons, protons, stable, symbol]);

  useEffect(() => {
    api.registerPrimary(() => {
      if (stable) {
        setGlow(true);
        burst(CX, CY);
        api.reportResult(true);
      } else {
        setShake(true);
        window.setTimeout(() => setShake(false), 320);
        api.reportResult(false);
      }
    });
  }, [api, burst, stable]);

  const electronPositions = useMemo(() => {
    const angle0 = tick * 0.02;
    return Array.from({ length: electrons }, (_, i) => {
      const shell = i < 2 ? 'K' : 'L';
      const r = shellRadius(shell);
      const count = shell === 'K' ? Math.min(electrons, 2) : Math.max(0, electrons - 2);
      const idx = shell === 'K' ? i : i - 2;
      const angle = angle0 + (idx / Math.max(1, count)) * Math.PI * 2;
      return {
        x: CX + Math.cos(angle) * r,
        y: CY + Math.sin(angle) * (r * 0.48),
        shell,
      };
    });
  }, [electrons, tick]);

  const nucleusDots = useMemo(() => {
    const dots: { x: number; y: number; type: 'p' | 'n' }[] = [];
    for (let i = 0; i < protons; i++) {
      const a = (i / Math.max(1, protons)) * Math.PI * 2;
      dots.push({ x: CX + Math.cos(a) * 18, y: CY + Math.sin(a) * 14, type: 'p' });
    }
    for (let i = 0; i < neutrons; i++) {
      const a = (i / Math.max(1, neutrons)) * Math.PI * 2 + 0.4;
      dots.push({ x: CX + Math.cos(a) * 28, y: CY + Math.sin(a) * 22, type: 'n' });
    }
    return dots;
  }, [neutrons, protons]);

  const reset = () => {
    setNeutrons(level === 1 ? 0 : 6);
    setElectrons(level === 1 || level === 2 ? 0 : 6);
    setCombo(0);
    setParticles([]);
  };

  const narrate =
    level === 1
      ? 'Drag a gold electron onto the K shell. Match + and - to make hydrogen neutral.'
      : level === 2
        ? 'Fill K shell first (2e), then drop four more into L shell for carbon.'
        : level === 3
          ? 'Drag neutrons into the nucleus until mass number A = 14 (6p + 8n).'
          : 'Tune neutrons to 7. Watch the stability glow when Carbon-13 settles.';

  return (
    <div
      className={`atom-stage${shake ? ' is-shake' : ''}${glow || stable ? ' is-glow' : ''}`}
      data-testid="atom-stage"
    >
      <p className="atom-narrate" data-testid="atom-narrate">
        {narrate}
      </p>
      <svg
        ref={svgRef}
        viewBox="0 0 780 540"
        role="img"
        aria-label="Interactive atom forge"
        className="atom-svg"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        <defs>
          <radialGradient id="atom-red" cx="32%" cy="28%">
            <stop stopColor="#ff9a80" />
            <stop offset=".45" stopColor="#df4d38" />
            <stop offset="1" stopColor="#9d2f28" />
          </radialGradient>
          <radialGradient id="atom-blue" cx="30%" cy="25%">
            <stop stopColor="#d7e5f0" />
            <stop offset=".55" stopColor="#7590aa" />
            <stop offset="1" stopColor="#304a68" />
          </radialGradient>
          <radialGradient id="atom-gold" cx="30%" cy="25%">
            <stop stopColor="#ffe37b" />
            <stop offset=".55" stopColor="#d7a116" />
            <stop offset="1" stopColor="#8f6500" />
          </radialGradient>
          <filter id="atom-blur">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="atom-glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="390" cy="463" rx="210" ry="18" fill="#b9c6d1" opacity=".35" filter="url(#atom-blur)" />
        <ellipse
          cx={CX}
          cy={CY}
          rx="285"
          ry="130"
          fill="none"
          stroke="#173f70"
          strokeWidth="2"
          opacity=".55"
          className="atom-orbit"
        />
        <ellipse
          cx={CX}
          cy={CY}
          rx="126"
          ry="52"
          fill="none"
          stroke="#8cabca"
          strokeDasharray="4 5"
          strokeWidth="1.5"
          className="atom-orbit"
        />
        <circle
          cx={CX}
          cy={CY}
          r="70"
          fill="transparent"
          stroke={stable ? '#d4a017' : '#28517c'}
          strokeWidth="2"
          strokeDasharray="6 4"
          data-testid="nucleus-drop"
        />
        <text x="525" y="421" fill="#27486d" fontSize="11" fontWeight="700">
          L shell · max 8e
        </text>
        <text x="445" y="205" fill="#27486d" fontSize="11" fontWeight="700">
          K shell · max 2e
        </text>
        {nucleusDots.map((p, i) => (
          <circle
            key={`n-${i}`}
            cx={p.x}
            cy={p.y}
            r="15"
            fill={p.type === 'n' ? 'url(#atom-blue)' : 'url(#atom-red)'}
            stroke="#fff"
            strokeOpacity=".25"
            filter={glow ? 'url(#atom-glow)' : undefined}
          />
        ))}
        <text x="330" y="352" fill="#244465" fontSize="11" fontWeight="700">
          Nucleus · {protons}p + {neutrons}n
        </text>
        {electronPositions.map((p, i) => (
          <circle
            key={`e-${i}`}
            cx={p.x}
            cy={p.y}
            r="9"
            fill="url(#atom-gold)"
            stroke="#8f6500"
            data-testid={`electron-${i}`}
          />
        ))}
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.kind === 'burst' ? 3 : 6}
            fill={p.kind === 'burst' ? '#d4a017' : '#7590aa'}
            opacity={p.life / 24}
          />
        ))}
        {drag && (
          <circle
            cx={drag.x}
            cy={drag.y}
            r="16"
            fill={drag.kind === 'n' ? 'url(#atom-blue)' : 'url(#atom-gold)'}
            stroke="#18385d"
            strokeWidth="2"
            data-testid="drag-ghost"
            style={{ pointerEvents: 'none' }}
          />
        )}
        <g data-testid="neutron-tray">
          <rect x="40" y="430" width="120" height="70" rx="12" fill="#fff" stroke="#294d73" />
          <text x="100" y="452" textAnchor="middle" fill="#294d73" fontSize="10" fontWeight="800">
            Neutron tray
          </text>
          <circle
            cx="70"
            cy="478"
            r="14"
            fill="url(#atom-blue)"
            data-testid="tray-neutron"
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={onPointerDownTray('n')}
          />
          <circle cx="100" cy="478" r="14" fill="url(#atom-blue)" opacity=".7" style={{ pointerEvents: 'none' }} />
          <circle cx="130" cy="478" r="14" fill="url(#atom-blue)" opacity=".45" style={{ pointerEvents: 'none' }} />
        </g>
        <g data-testid="electron-tray">
          <rect x="180" y="430" width="120" height="70" rx="12" fill="#fff" stroke="#8f6500" />
          <text x="240" y="452" textAnchor="middle" fill="#8f6500" fontSize="10" fontWeight="800">
            Electron tray
          </text>
          <circle
            cx="210"
            cy="478"
            r="12"
            fill="url(#atom-gold)"
            data-testid="tray-electron"
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={onPointerDownTray('e')}
          />
          <circle cx="240" cy="478" r="12" fill="url(#atom-gold)" opacity=".7" style={{ pointerEvents: 'none' }} />
          <circle cx="270" cy="478" r="12" fill="url(#atom-gold)" opacity=".45" style={{ pointerEvents: 'none' }} />
        </g>
        <g transform="translate(620 40)">
          <rect width="130" height="86" rx="10" fill="#fff" stroke="#e6e1d9" />
          <text x="12" y="22" fill="#7d8490" fontSize="9" fontWeight="700">
            LIVE READOUT
          </text>
          <text x="12" y="44" fill="#193e69" fontSize="16" fontWeight="800">
            {symbol}-{mass}
          </text>
          <text x="12" y="66" fill="#52667f" fontSize="11">
            {electrons}e · combo {combo}
          </text>
        </g>
      </svg>
      <div className="atom-controls">
        <button type="button" onClick={reset} data-testid="atom-reset">
          Reset atom
        </button>
        <button
          type="button"
          onClick={() => {
            setNeutrons((n) => Math.max(0, n - 1));
          }}
          data-testid="atom-remove-n"
        >
          Remove neutron
        </button>
      </div>
      <div className="atom-notation" data-testid="atom-notation">
        <small>NOTATION</small>
        <b>{mass}</b>
        <i>{symbol}</i>
        <b>{protons}</b>
        <small>A on top · Z below</small>
      </div>
      <div className="atom-legend">
        <span className="proton" /> Proton (+) <span className="neutron" /> Neutron (0){' '}
        <span className="electron" /> Electron (-)
      </div>
    </div>
  );
}
