export function Backdrop() {
  return <div className="vs-backdrop" aria-hidden="true">
    <svg className="vs-doodle" style={{ left: '7%', top: '18%', width: 42 }} viewBox="0 0 42 42"><path d="M7 35 34 8m-6 0 6 0v6M5 37l5-2-3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    <svg className="vs-doodle" style={{ right: '9%', top: '31%', width: 48 }} viewBox="0 0 48 48"><path d="m24 4 4 14 15 1-12 9 4 15-11-8-12 8 5-15L5 19l15-1Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
    <svg className="vs-doodle" style={{ left: '43%', bottom: '10%', width: 52 }} viewBox="0 0 52 52"><path d="M5 27c12-8 22-14 40-18-4 9-8 19-18 36l-7-12Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="m20 33 13-12" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
  </div>;
}
