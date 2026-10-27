import type { ConceptInsight } from '@vidhyasaathy/contracts';
import { evidenceLabel, heatClass } from './format';

export function HeatMap({ concepts }: { concepts: ConceptInsight[] }) {
  if (!concepts.length) return <p>No concept is in this class yet.</p>;
  return (
    <ul className="heat-list" aria-label="Concept checks">
      {concepts.map((concept) => (
        <li key={concept.conceptId} className={heatClass(concept.needingPractice)} data-testid={`concept-${concept.conceptId}`}>
          <p className="heat-title">{concept.title}</p>
          <strong className="heat-rate">{concept.passRate === null ? 'Building evidence' : `${Math.round(concept.passRate * 100)}% mastery`}</strong>
          <p>{evidenceLabel(concept)}</p>
          <p>{concept.needingPractice} need practice. {concept.students} have a saved check.</p>
        </li>
      ))}
    </ul>
  );
}
