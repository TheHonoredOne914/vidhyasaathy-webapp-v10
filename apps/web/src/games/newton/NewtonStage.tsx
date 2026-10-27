import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArenaApi } from '../engine/types';
import { validateFma, validateInertia, validateMomentum, validateReaction } from './validators';

type DragKind = 'pull' | 'force' | 'pair' | 'cart' | null;

export function NewtonStage({ api }: { api: ArenaApi }) {
  const level = api.round;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [speed, setSpeed] = useState(4);
  const [force, setForce] = useState(8);
  const [mass, setMass] = useState(3);
  const [reaction, setReaction] = useState<'balloon-air' | 'balloon-wall' | null>(null);
  const [collided, setCollided] = useState(false);
  const [drag, setDrag] = useState<DragKind>(null);
  const [pullX, setPullX] = useState(275);
  const [ballX, setBallX] = useState(320);
  const [shake, setShake] = useState(false);
  const [glow, setGlow] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; life: number }[]>([]);
  const [tick, setTick] = useState(0);
  const [combo, setCombo] = useState(0);
  const nextId = useRef(1);
  const lastReadout = useRef('');
  const acceleration = Number((force / mass).toFixed(1));
  const before = 8;
  const after = collided ? 8 : 0;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (now - last > 32) {
        setTick((t) => (t + 1) % 3600);
        setParticles((list) =>
          list.map((p) => ({ ...p, life: p.life - 1, y: p.y - 1 })).filter((p) => p.life > 0),
        );
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const burst = useCallback((x: number, y: number) => {
    const base = nextId.current;
    nextId.current += 10;
    setParticles((list) => [
      ...list,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: base + i,
        x: x + Math.cos((i / 10) * Math.PI * 2) * 10,
        y: y + Math.sin((i / 10) * Math.PI * 2) * 10,
        life: 22,
      })),
    ]);
  }, []);

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const onPointerDown = (kind: DragKind) => (event: React.PointerEvent) => {
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    setDrag(kind);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag) return;
    const p = toSvg(event.clientX, event.clientY);
    if (drag === 'pull') {
      const nx = Math.max(245, Math.min(455, p.x));
      setPullX(nx);
      const v = Math.round(((nx - 245) / 210) * 9) + 1;
      setSpeed(v);
    }
    if (drag === 'force') {
      const f = Math.max(2, Math.min(20, Math.round((p.x - 300) / 12)));
      setForce(f);
      setBallX(Math.max(280, Math.min(520, 280 + f * 8)));
    }
    if (drag === 'cart' && p.x > 420) {
      setCollided(true);
      burst(430, 350);
      setGlow(true);
      setCombo((c) => c + 1);
      setDrag(null);
    }
  };

  const onPointerUp = () => {
    if (drag === 'pull') {
      if (speed >= 7) {
        burst(351, 270);
        setGlow(true);
        setCombo((c) => c + 1);
      } else {
        setShake(true);
        window.setTimeout(() => setShake(false), 280);
      }
    }
    if (drag === 'force') {
      burst(ballX, 360);
      setCombo((c) => c + 1);
      setGlow(true);
      window.setTimeout(() => setGlow(false), 400);
    }
    setDrag(null);
  };

  const dropPair = (pair: 'balloon-air' | 'balloon-wall') => {
    setReaction(pair);
    if (pair === 'balloon-air') {
      burst(360, 270);
      setGlow(true);
      setCombo((c) => c + 1);
    } else {
      setShake(true);
      window.setTimeout(() => setShake(false), 280);
    }
    setDrag(null);
  };

  useEffect(() => {
    const payload = JSON.stringify({ level, speed, force, mass, acceleration, reaction, collided, after });
    if (payload === lastReadout.current) return;
    lastReadout.current = payload;
    if (level === 1) {
      api.setStats({ label: 'Pull speed', value: `${speed} m/s` });
      api.setReadout({ speed: String(speed), inertia: speed >= 7 ? 'coin stays' : 'coin moves' });
    } else if (level === 2) {
      api.setStats({ label: 'Acceleration', value: `${acceleration} m/s²` });
      api.setReadout({
        force: `${force} N`,
        mass: `${mass} kg`,
        acceleration: `${acceleration} m/s²`,
      });
    } else if (level === 3) {
      api.setStats({
        label: 'Rocket thrust',
        value: reaction === 'balloon-air' ? 'balanced pair' : 'choose pair',
      });
      api.setReadout({
        pair:
          reaction === 'balloon-air'
            ? 'Balloon → Air'
            : reaction === 'balloon-wall'
              ? 'Balloon → Wall'
              : '—',
      });
    } else {
      api.setStats({ label: 'Momentum', value: `${after} kg·m/s` });
      api.setReadout({
        before: '8 kg·m/s',
        after: `${after} kg·m/s`,
        collision: collided ? 'complete' : 'ready',
      });
    }
  }, [acceleration, after, api, collided, force, level, mass, reaction, speed]);

  useEffect(() => {
    api.registerPrimary(() => {
      let ok = false;
      if (level === 1) ok = validateInertia(speed).correct;
      else if (level === 2) ok = validateFma({ force, mass, acceleration }).correct;
      else if (level === 3) ok = validateReaction(reaction ?? 'balloon-wall').correct;
      else ok = validateMomentum({ before, after }).correct;
      if (ok) {
        setGlow(true);
        burst(390, 300);
      } else {
        setShake(true);
        window.setTimeout(() => setShake(false), 280);
      }
      api.reportResult(ok);
    });
  }, [acceleration, after, api, before, burst, force, level, mass, reaction, speed]);

  const reset = () => {
    setSpeed(4);
    setForce(8);
    setMass(3);
    setReaction(null);
    setCollided(false);
    setPullX(275);
    setBallX(320);
    setCombo(0);
    setParticles([]);
  };

  const narrate =
    level === 1
      ? 'Drag the cloth fast under the coin. Inertia keeps the coin nearly still.'
      : level === 2
        ? 'Drag the red force handle. Watch live a = F ÷ m on the cricket cart.'
        : level === 3
          ? 'Drag the action arrow onto Air (not Wall) to match the force pair.'
          : 'Drag the red trolley into the blue one. Momentum before equals momentum after.';

  const bob = Math.sin(tick * 0.08) * 3;

  return (
    <div
      className={`newton-stage${shake ? ' is-shake' : ''}${glow ? ' is-glow' : ''}`}
      data-testid="newton-stage"
    >
      <p className="newton-narrate" data-testid="newton-narrate">
        {narrate}
      </p>
      <svg
        ref={svgRef}
        viewBox="0 0 780 540"
        role="img"
        aria-label="Interactive Cricket Lab"
        className="newton-svg"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        <defs>
          <linearGradient id="newton-track" x1="0" x2="1">
            <stop stopColor="#dce8f3" />
            <stop offset="1" stopColor="#9db5cc" />
          </linearGradient>
          <linearGradient id="newton-cart" x1="0" x2="1">
            <stop stopColor="#4c78a4" />
            <stop offset="1" stopColor="#193e69" />
          </linearGradient>
          <radialGradient id="newton-ball" cx="30%" cy="25%">
            <stop stopColor="#ffe47c" />
            <stop offset="1" stopColor="#c58c06" />
          </radialGradient>
          <marker id="newton-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="currentColor" />
          </marker>
          <filter id="n-glow">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="780" height="540" fill="#f4f7fc" />
        <path d="M88 390H700" stroke="url(#newton-track)" strokeWidth="24" />
        <path d="M88 390H700" stroke="#28517c" strokeWidth="4" />
        <path
          d="M88 396H700"
          stroke="#d4a017"
          strokeWidth="3"
          strokeDasharray="8 8"
          className="newton-dash"
        />

        {level === 1 && (
          <g>
            <text x="110" y="75" className="newton-svg-title">
              INERTIA LAB
            </text>
            <text x="110" y="98" className="newton-svg-copy">
              Drag cloth fast — coin resists the change
            </text>
            <rect
              x={pullX}
              y="325"
              width="210"
              height="28"
              rx="6"
              fill="#d4a017"
              data-testid="inertia-cloth"
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={onPointerDown('pull')}
            />
            <rect x="322" y="278" width="58" height="48" rx="5" fill="#e9edf2" stroke="#28517c" />
            <circle
              cx="351"
              cy={speed >= 7 ? 270 : 270 + bob}
              r="18"
              fill="url(#newton-ball)"
              filter={glow ? 'url(#n-glow)' : undefined}
              data-testid="inertia-coin"
            />
            <path
              d={`M275 338 H${275 + speed * 28}`}
              stroke="#d94f43"
              strokeWidth="5"
              markerEnd="url(#newton-arrow)"
            />
            <text x="300" y="438" className="newton-svg-label">
              cloth · {speed} m/s
            </text>
            <text x="335" y="190" className="newton-svg-label">
              {speed >= 7 ? 'coin nearly at rest ✓' : 'pull faster…'}
            </text>
          </g>
        )}

        {level === 2 && (
          <g>
            <text x="110" y="75" className="newton-svg-title">
              CRICKET F = ma
            </text>
            <text x="110" y="98" className="newton-svg-copy">
              Drag the force handle — cart accelerates live
            </text>
            <rect
              x={ballX - 65}
              y={335 + bob * 0.3}
              width="130"
              height="52"
              rx="10"
              fill="url(#newton-cart)"
              data-testid="fma-cart"
            />
            <circle cx={ballX - 35} cy="395" r="18" fill="#193e69" />
            <circle cx={ballX + 35} cy="395" r="18" fill="#193e69" />
            <text x={ballX - 20} y="365" fill="white" fontSize="14" fontWeight="800">
              {mass} kg
            </text>
            <circle
              cx={ballX + 120}
              cy="360"
              r="22"
              fill="#d94f43"
              stroke="#fff"
              strokeWidth="3"
              data-testid="force-handle"
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={onPointerDown('force')}
              filter={glow ? 'url(#n-glow)' : undefined}
            />
            <text x={ballX + 100} y="330" className="newton-svg-label">
              {force} N
            </text>
            <rect x="540" y="140" width="160" height="110" rx="12" fill="white" stroke="#d8e1ec" />
            <text x="560" y="170" className="newton-svg-label">
              a = F ÷ m
            </text>
            <text
              x="560"
              y="210"
              fontSize="28"
              fill="#193e69"
              fontWeight="800"
              data-testid="accel-readout"
            >
              {acceleration} m/s²
            </text>
            <text x="560" y="235" className="newton-svg-label">
              target 4.0 · combo {combo}
            </text>
            <g transform="translate(40 440)">
              <text x="0" y="0" className="newton-svg-label">
                Mass
              </text>
              {[1, 2, 3, 4, 5, 6].map((m) => (
                <circle
                  key={m}
                  cx={m * 36}
                  cy="24"
                  r="14"
                  fill={mass === m ? '#193e69' : '#9db5cc'}
                  data-testid={`mass-${m}`}
                  style={{ cursor: 'pointer' }}
                  onPointerDown={() => setMass(m)}
                />
              ))}
            </g>
          </g>
        )}

        {level === 3 && (
          <g>
            <text x="110" y="75" className="newton-svg-title">
              ACTION → REACTION
            </text>
            <text x="110" y="98" className="newton-svg-copy">
              Drag the red arrow onto Air
            </text>
            <ellipse cx="360" cy={270 + bob * 0.4} rx="72" ry="58" fill="#df4d38" />
            <path d="M300 300 Q360 340 420 300" fill="#bd332c" />
            <circle
              cx="430"
              cy="270"
              r="18"
              fill="#d94f43"
              data-testid="pair-handle"
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={onPointerDown('pair')}
            />
            <rect
              x="520"
              y="230"
              width="100"
              height="80"
              rx="12"
              fill="#edf4fb"
              stroke="#28517c"
              strokeWidth="2"
              data-testid="drop-air"
              onPointerUp={() => drag === 'pair' && dropPair('balloon-air')}
            />
            <text x="570" y="275" textAnchor="middle" fill="#28517c" fontSize="14" fontWeight="800">
              AIR
            </text>
            <rect
              x="120"
              y="230"
              width="100"
              height="80"
              rx="12"
              fill="#fbf6ea"
              stroke="#d7d2c8"
              strokeWidth="2"
              data-testid="drop-wall"
              onPointerUp={() => drag === 'pair' && dropPair('balloon-wall')}
            />
            <text x="170" y="275" textAnchor="middle" fill="#697386" fontSize="14" fontWeight="800">
              WALL
            </text>
            {reaction && (
              <text x="300" y="400" className="newton-svg-label">
                Pair: {reaction === 'balloon-air' ? 'Balloon → Air ✓' : 'Balloon → Wall'}
              </text>
            )}
          </g>
        )}

        {level === 4 && (
          <g>
            <text x="110" y="75" className="newton-svg-title">
              MOMENTUM COLLISION
            </text>
            <text x="110" y="98" className="newton-svg-copy">
              Drag red trolley into blue
            </text>
            <rect
              x={collided ? 355 : 190}
              y="330"
              width="100"
              height="50"
              rx="8"
              fill="#d94f43"
              data-testid="cart-red"
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={onPointerDown('cart')}
            />
            <rect
              x={collided ? 465 : 560}
              y="330"
              width="100"
              height="50"
              rx="8"
              fill="#4c78a4"
              data-testid="cart-blue"
            />
            <text x="300" y="210" className="newton-svg-label">
              before: 3×4 + 2×(−2) = 8
            </text>
            <text x="300" y="240" className="newton-svg-label" data-testid="momentum-after">
              after: {after} kg·m/s
            </text>
          </g>
        )}

        {particles.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r="4" fill="#d4a017" opacity={p.life / 22} />
        ))}
        <path d="M95 465H685" stroke="#b4c5d7" strokeDasharray="5 6" />
        <text x="105" y="490" className="newton-svg-label">
          Cricket Lab · NCERT Class 9 · combo {combo}
        </text>
      </svg>
      <div className="newton-controls">
        <button type="button" onClick={reset} data-testid="newton-reset">
          Reset experiment
        </button>
      </div>
      <div className="newton-legend">
        <span className="force-dot" /> Force <span className="mass-dot" /> Mass{' '}
        <span className="guide-dot" /> Guide
      </div>
    </div>
  );
}
