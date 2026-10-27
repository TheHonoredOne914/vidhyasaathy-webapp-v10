import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellButton } from '../components/SchoolBackground';
import '../landing/landing.css';
import { Saathy } from '../ui/Saathy';

export function NotebookHeader({ auth = false }: { auth?: boolean }) {
  const [open, setOpen] = useState(false);
  return <header className="nb-header">
    <Link className="nb-brand" to="/"><img src="/img/logo.webp" width="36" height="36" alt="" /><span>VidhyaSaathy</span>{auth ? <span className="vs-auth-sr-only">Learning, with you</span> : null}</Link>
    <button className="nb-menu" type="button" aria-expanded={open} aria-controls="primary-sections" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => { setOpen(!open); }}>
      <svg viewBox="0 0 28 28" aria-hidden="true"><path d={open ? 'M6 6 L22 22 M6 22 L22 6' : 'M4 7 L24 7 M4 14 L24 14 M4 21 L24 21'} /></svg>
    </button>
    <nav id="primary-sections" className={`nb-links${open ? ' is-open' : ''}`} aria-label="Primary" onClick={() => { setOpen(false); }}>
      <a href={auth ? '/#day' : '#day'}>How it works</a><a href={auth ? '/#learn' : '#learn'}>For parents</a><a href={auth ? '/#safety' : '#safety'}>Safety</a>
    </nav>
    <BellButton />
    <div className="nb-header-actions"><Link className="nb-signin" to="/signin">Sign in</Link><Link className="nb-register" to="/register-school">Register your school</Link></div>
  </header>;
}

export function NotebookLamp() {
  return <svg className="nb-lamp" viewBox="0 0 110 120" fill="none" stroke="#517DAB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M24 112 L86 112 M54 112 L46 70 L74 40 M64 30 C70 14,96 14,104 32 Z" /><path d="M90 46 l2 8 M78 48 l-3 8" opacity=".7" /></svg>;
}

export function NotebookNight({ auth = false }: { auth?: boolean }) {
  return <div className={`nb-night${auth ? ' nb-night--auth' : ''}`} aria-hidden="true">
    <div className="nb-night-frame" /><NotebookLamp />
    {[['30%', '18%', 'M7 1 L7.4 12.6 M1.2 7.2 L12.8 6.6'], ['62%', '44%', 'M7 1 L7 13 M1 7 L13 7.4 M3 3 L11 11'], ['86%', '56%', 'M7 1 L7.3 13 M1 7.3 L13 6.8']].map(([left, top, path]) => <svg key={left} className="nb-star" style={{ left, top }} viewBox="0 0 14 14"><path d={path} /></svg>)}
    {auth ? <><div className="nb-desk" /><Saathy mood="sleep" size={190} alt="" /><p className="nb-night-says">9:00 pm. Saathy kept your place.<small>it answers from your teacher&apos;s notes, nothing else.</small></p></> : <p className="nb-time">9:00 pm<br />still here.</p>}
  </div>;
}

export function NotebookCircle() {
  return <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"><path d="M8 28 C4 8,70 2,92 18 C104 30,70 48,34 46 C10 44,2 34,14 20" /></svg>;
}

export function NotebookFooter() {
  return <div className="nb-footer-bottom">
    <span>(c) 2026 VidhyaSaathy. All rights reserved.</span>
    <nav className="nb-footer-links" aria-label="Footer"><Link to="/#vision">About</Link><Link to="/#day">How it works</Link><Link to="/privacy">Privacy</Link><Link to="/recover">Contact</Link></nav>
    <span>Learning with you</span>
  </div>;
}
