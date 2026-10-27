export const MINIMUM_CONCEPT_EVIDENCE = 3;
export const CONCEPT_PASS_THRESHOLD = 0.7;

export interface PrerequisiteEvidence {
  conceptId: string;
  depth: number;
  evidence: number;
  mastery: number;
}

// Depth comes from the prerequisite graph, never from time spent studying.
export function selectPrerequisiteGap(conceptId: string, candidates: readonly PrerequisiteEvidence[]) {
  const weak = candidates.filter((candidate) => candidate.depth > 0 && candidate.evidence >= MINIMUM_CONCEPT_EVIDENCE
    && candidate.mastery < CONCEPT_PASS_THRESHOLD)
    .sort((a, b) => b.depth - a.depth || a.conceptId.localeCompare(b.conceptId))[0];
  const target = weak ?? candidates.find((candidate) => candidate.conceptId === conceptId);
  return { conceptId, targetConceptId: target?.conceptId ?? conceptId, depth: target?.depth ?? 0,
    evidence: target?.evidence ?? 0, minimumEvidence: MINIMUM_CONCEPT_EVIDENCE };
}
