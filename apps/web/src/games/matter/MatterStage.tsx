import { useEffect, useMemo, useState } from 'react';
import type { ArenaApi } from '../engine/types';
import { validateDiffusion, validateEvaporation, validateHeatingCurve, validateState } from './validators';

const seed = Array.from({ length: 22 }, (_, i) => ({ x: 82 + ((i * 67) % 440), y: 96 + ((i * 43) % 190), vx: i % 2 ? 1 : -1 }));

export function MatterStage({ api }: { api: ArenaApi }) {
  const level = api.round;
  const [temperature, setTemperature] = useState(level === 1 ? 50 : level === 3 ? 0 : 72);
  const [pressure, setPressure] = useState(46);
  const [choice, setChoice] = useState('hot');
  const [heat, setHeat] = useState(true);
  const [surface, setSurface] = useState(true);
  const [wind, setWind] = useState(true);
  const phase = temperature <= 0 ? 'solid' : temperature < 100 ? 'liquid' : 'gas';
  const speed = Math.max(.25, temperature / 85);
  const particles = useMemo(() => seed.map((p, i) => ({ ...p, x: p.x + (level === 1 ? (i % 4) * 7 : 0), y: phase === 'solid' ? 180 + (i % 5) * 25 : phase === 'gas' ? 65 + (i * 31) % 240 : p.y })), [level, phase]);
  useEffect(() => {
    const result = level === 1 ? validateState({ phase, temperature }) : level === 2 ? validateDiffusion(choice) : level === 3 ? validateHeatingCurve(temperature) : validateEvaporation({ heat, surface, wind });
    api.setStats({ label: level === 3 ? 'Temperature' : 'Kinetic energy', value: level === 3 ? `${temperature}°C` : `${Math.round(speed * 100)}%` });
    api.setReadout({ phase: phase[0].toUpperCase() + phase.slice(1), temperature: `${temperature}°C`, pressure: `${pressure}%`, energy: `${Math.round(speed * 100)}%` });
    api.registerPrimary(() => api.reportResult(result.correct));
  }, [api, choice, heat, level, phase, pressure, speed, surface, temperature, wind]);
  const adjustTemp = (value: number) => setTemperature(Math.max(-20, Math.min(140, value)));
  return <div className="matter-stage">
    <div className="matter-controls"><span>CONTROL DECK</span><button type="button" onClick={() => adjustTemp(temperature + 10)}>+ Heat</button><button type="button" onClick={() => adjustTemp(temperature - 10)}>− Cool</button><label className="pressure-control">Pressure <b>{pressure}%</b><input aria-label="Pressure piston" type="range" min="10" max="90" value={pressure} onChange={(e) => setPressure(Number(e.target.value))} /></label><button type="button" onClick={() => { setTemperature(50); setPressure(46); }}>Reset lab</button></div>
    <svg className="matter-svg" viewBox="0 0 620 390" role="img" aria-label="Interactive particle box showing states of matter">
      <defs><linearGradient id="matter-bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eef5fb" /><stop offset="1" stopColor="#fdf8ea" /></linearGradient><linearGradient id="matter-box" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dcecf5" stopOpacity=".65" /><stop offset="1" stopColor="#fffdf7" stopOpacity=".8" /></linearGradient><radialGradient id="matter-particle"><stop stopColor="#f4c54d" /><stop offset=".7" stopColor="#d79813" /><stop offset="1" stopColor="#9a6800" /></radialGradient></defs>
      <rect width="620" height="390" fill="url(#matter-bg)" /><path d="M36 54H584M36 326H584" stroke="#b4c9d9" strokeDasharray="5 6" /><text x="36" y="34" className="matter-label">PARTICLE CHAMBER · {phase.toUpperCase()}</text><text x="490" y="34" className="matter-label">T = {temperature}°C</text>
      <rect x="55" y="62" width="510" height="258" rx="14" fill="url(#matter-box)" stroke="#7b9bb7" strokeWidth="2" /><path d="M55 62h510" stroke="#28517c" strokeWidth="9" /><rect x="252" y="41" width="116" height="26" rx="6" fill="#28517c" /><text x="270" y="58" className="matter-piston">PRESSURE PISTON</text><path d={`M310 68v${pressure * 1.9}`} stroke="#28517c" strokeWidth="3" strokeDasharray="5 5" /><circle cx="310" cy={68 + pressure * 1.9} r="5" fill="#d4a017" />
      {particles.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={phase === 'solid' ? 9 : 7} fill="url(#matter-particle)" opacity={phase === 'gas' ? .78 : 1}><animate attributeName="cx" values={`${p.x};${p.x + p.vx * 16};${p.x}`} dur={`${Math.max(.7, 2.5 / speed)}s`} repeatCount="indefinite" /></circle>)}
      <path d={phase === 'solid' ? 'M80 282h460' : phase === 'liquid' ? 'M80 280 Q310 300 540 280' : 'M90 120 Q300 85 530 150'} fill="none" stroke="#8fb4cf" strokeDasharray="3 5" />
      {level === 3 && <g className="matter-graph"><path d="M392 295V218H560M402 278h48v-34h42v34h58" fill="none" stroke="#d4a017" strokeWidth="3" /><text x="397" y="214">temperature</text><text x="492" y="311">heat supplied</text><text x="420" y="238">0°C plateau</text></g>}
      <text x="72" y="350" className="matter-note">Particles are always moving · speed rises with temperature</text><g className="matter-legend"><circle cx="390" cy="350" r="6" fill="#d79813" /><text x="402" y="353">particle</text><line x1="460" y1="350" x2="480" y2="350" stroke="#8fb4cf" strokeDasharray="3 3" /><text x="488" y="353">boundary guide</text></g>
    </svg>
    <div className="matter-slider"><label>Temperature <b>{temperature}°C</b></label><input aria-label="Temperature" type="range" min="-20" max="140" value={temperature} onChange={(e) => adjustTemp(Number(e.target.value))} /></div>
    {level === 2 && <div className="matter-choice"><span>DIFFUSION RACE</span><button className={choice === 'hot' ? 'selected' : ''} onClick={() => setChoice('hot')} type="button">Hot water</button><button className={choice === 'cold' ? 'selected' : ''} onClick={() => setChoice('cold')} type="button">Cold water</button></div>}
    {level === 4 && <div className="matter-factors"><span>EVAPORATION FACTORS</span><button className={heat ? 'on' : ''} onClick={() => setHeat(!heat)} type="button">☀ Heat</button><button className={surface ? 'on' : ''} onClick={() => setSurface(!surface)} type="button">▱ Large surface</button><button className={wind ? 'on' : ''} onClick={() => setWind(!wind)} type="button">↝ Fan</button></div>}
  </div>;
}
