import type { Concept } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import type { Audience } from '../content/audience';
import { conceptDepth } from './plan';

export function ConceptMap({ concepts, audience, chapterId }: { concepts: Concept[]; audience: Audience; chapterId: string }) {
  if (concepts.length === 0) return null;
  const names = new Map(concepts.map((concept) => [concept.id, concept.title]));
  const depth = conceptDepth(concepts);
  const rows = [...concepts].sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || a.title.localeCompare(b.title));
  return (
    <ol className="concept-map" aria-label="Concept map">
      {rows.map((concept) => {
        const linked = concept.prerequisiteIds.filter((id) => names.has(id));
        const outside = concept.prerequisiteIds.length - linked.length;
        const needs = [
          ...linked.map((id) => names.get(id) ?? ''),
          outside === 1 ? 'a concept from another chapter' : outside > 1 ? `${outside} concepts from other chapters` : '',
        ].filter(Boolean);
        return (
          <li key={concept.id} className={`d${Math.min(depth.get(concept.id) ?? 0, 4)}`}>
            <Link className="text-link" to={`/${audience}/chapters/${chapterId}/concepts/${concept.id}`}>{concept.title}</Link>
            {needs.length ? <span>Needs {needs.join(', ')}.</span> : <span>No prerequisite in this chapter.</span>}
          </li>
        );
      })}
    </ol>
  );
}
