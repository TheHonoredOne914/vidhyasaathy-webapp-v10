import { useState } from 'react';
import type { SaathyArtifact } from '../../../../packages/contracts/src/ask';
import { InteractiveArtifact } from './visuals/artifact-card';

// Text is rendered by React, never as provider-supplied markup.
export function MathText({ text }: { text: string }) {
  return <>{text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\))/g).map((part, i) => {
    const math = part.startsWith('$') || part.startsWith('\\(');
    const value = math ? part.replace(/^\$\$?|\$\$?$/g, '').replace(/^\\\(|\\\)$/g, '')
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)').replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\text\{([^{}]+)\}/g, '$1') : part;
    return math ? <span className="saathy-math" role="math" key={i}>{value}</span> : <span key={i}>{value}</span>;
  })}</>;
}

export function ArtifactCard({ artifact }: { artifact: SaathyArtifact }) {
  const [visible, setVisible] = useState(1);
  if (artifact.type === 'chart' || artifact.type === 'demo') return <InteractiveArtifact artifact={artifact} />;
  return <section className="saathy-card" aria-label={artifact.title}>
    <p className="nb-label">{artifact.type === 'worked-example' ? 'Worked example' : artifact.type === 'diagram' ? 'Diagram' : artifact.type === 'notes' ? 'Notebook notes' : 'Explanation'}</p>
    <h3 className="nb-h3">{artifact.title}</h3>
    {artifact.type === 'explanation' ? <p><MathText text={artifact.body} /></p> : null}
    {artifact.type === 'notes' ? <ul>{artifact.points.map((point, i) => <li key={i}><MathText text={point} /></li>)}</ul> : null}
    {artifact.type === 'diagram' ? <ol className="saathy-diagram">{artifact.nodes.map((node, i) => <li key={i}><MathText text={node} /></li>)}</ol> : null}
    {artifact.type === 'worked-example' ? <><ol>{artifact.steps.slice(0, visible).map((step, i) => <li key={i}><MathText text={step} /></li>)}</ol>{visible < artifact.steps.length ? <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={() => setVisible((count) => count + 1)}>Reveal next step</button> : <p className="nb-note">Now try a similar question yourself.</p>}</> : null}
  </section>;
}
