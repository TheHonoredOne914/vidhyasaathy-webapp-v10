import { describe, expect, it } from 'vitest';
import { selectPrerequisiteGap } from './remediation.ts';

describe('prerequisite remediation', () => {
  const root = { conceptId: 'root', depth: 0, evidence: 1, mastery: 0 };
  it('selects the earliest evidenced weak prerequisite, not the closest or sparsest', () => {
    expect(selectPrerequisiteGap('root', [root,
      { conceptId: 'closest', depth: 1, evidence: 4, mastery: 0.5 },
      { conceptId: 'earliest', depth: 3, evidence: 3, mastery: 0.6 },
      { conceptId: 'sparse', depth: 5, evidence: 2, mastery: 0 },
      { conceptId: 'passed', depth: 6, evidence: 3, mastery: 0.7 },
    ])).toEqual({ conceptId: 'root', targetConceptId: 'earliest', depth: 3, evidence: 3, minimumEvidence: 3 });
  });
  it('falls back to the failed concept when there is insufficient prerequisite evidence', () => {
    expect(selectPrerequisiteGap('root', [root])).toMatchObject({ targetConceptId: 'root', depth: 0, evidence: 1 });
    expect(selectPrerequisiteGap('root', [])).toMatchObject({ targetConceptId: 'root', evidence: 0 });
  });
  it('breaks equal-depth ties deterministically without mutating evidence', () => {
    const input = [{ conceptId: 'b', depth: 2, evidence: 3, mastery: 0.2 }, { conceptId: 'a', depth: 2, evidence: 3, mastery: 0.2 }];
    expect(selectPrerequisiteGap('root', input).targetConceptId).toBe('a');
    expect(input[0]?.conceptId).toBe('b');
  });
});
