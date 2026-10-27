import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SchoolBackground } from '../components/SchoolBackground';
import { NotebookFooter, NotebookHeader } from './Notebook';
import { SaathyMascot } from '../ui/Saathy';
import './auth.css';

export function AuthBrand() {
  return <Link className="nb-brand" to="/"><img src="/img/logo.webp" width="36" height="36" alt="" /><span>VidhyaSaathy</span><span className="vs-auth-sr-only">Learning, with you</span></Link>;
}

export function AuthLayout({ children, registration = false, withinShell = false }: { children: ReactNode; registration?: boolean; withinShell?: boolean }) {
  const Content = withinShell ? 'div' : 'main';
  return <div className={`vs-notebook school-scene vs-auth-page${registration ? ' vs-auth-page--register' : ''}`}>
    <NotebookHeader auth />
    <Content {...(withinShell ? {} : { id: 'content' })} className="vs-auth-body"><SchoolBackground sky={!withinShell} />{children}</Content>
    <footer className="vs-auth-footer"><NotebookFooter /></footer>
  </div>;
}

export function AuthScene({ registration = false }: { registration?: boolean }) {
  const journey = <ol className="vs-auth-sr-only" aria-label="The learning journey"><li><span>01</span> Learn</li><li><span>02</span> Practice</li><li><span>03</span> Grow</li></ol>;
  if (registration) return <aside className="vs-auth-register-aside" aria-label="Learning with Saathy">
    <div className="vs-auth-sticky"><span className="nb-tape" /><h2>After you register</h2><ol><li>Set up classes, sections and subjects.</li><li>Invite your teachers.</li><li>Import your student roster and print claim sheets.</li></ol></div>
    <p className="vs-auth-under-card">Already registered? <Link to="/signin">Sign in</Link></p>
    {journey}
  </aside>;
  return <aside className="vs-auth-scene" aria-label="Learning with Saathy">
    <div className="vs-auth-alive-panel">
      <svg className="vs-auth-doodles" viewBox="0 0 320 620" aria-hidden="true">
        <path d="M34 102l40-18 18 22-40 18zM42 104l18 22M67 91l18 22" />
        <path d="M238 86h42v18h-42zM250 104v40M268 104v40M242 144h34" />
        <path d="M45 470h76v54H45zM57 484h52M57 498h40M57 512h44" />
        <path d="M240 276l8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2z" />
        <path d="M232 392l38-22-12 32 28 12-54 10 12-19z" />
        <path d="M24 238c38-22 68-28 100-16M25 248c40-20 68-22 92-12" />
      </svg>
      <p className="vs-auth-alive-kicker">the school day continues</p>
      <SaathyMascot className="vs-auth-alive-mascot" mood="wave" size={180} alt="Saathy, your cloud learning companion" />
      <p className="vs-auth-alive-line">Small steps still count after the bell.</p>
      <div className="vs-auth-preview" aria-label="A small preview of today's learning">
        <span className="vs-auth-preview-label">TONIGHT&apos;S TINY WIN</span>
        <strong>3 questions, one brave try.</strong>
        <span className="vs-auth-preview-rule" />
        <span>Saathy is keeping your place.</span>
      </div>
    </div>
    {journey}
  </aside>;
}
