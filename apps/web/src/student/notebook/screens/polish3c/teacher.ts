export function sectionConcepts<T extends { conceptId: string; needingPractice: number }>(classes: { concepts: T[] }[]) {
  const concepts = new Map<string, T>();
  for (const group of classes) for (const row of group.concepts) {
    const previous = concepts.get(row.conceptId);
    concepts.set(row.conceptId, { ...row, needingPractice: row.needingPractice + (previous?.needingPractice ?? 0) });
  }
  return [...concepts.values()];
}
