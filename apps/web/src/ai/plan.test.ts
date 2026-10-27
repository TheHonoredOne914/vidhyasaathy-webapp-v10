import { describe, expect, it } from 'vitest';
import { conceptDepth, dueToday, planHref, resumeLabel } from './plan';

describe('study plan links', () => {
  const item = { id: '11111111-1111-4111-8111-111111111111', chapterId: '22222222-2222-4222-8222-222222222222', title: 'Halves', required: true, dueAt: null, resumeAt: 2 };

  it('routes each kind and names the resume point', () => {
    expect(planHref({ ...item, kind: 'session' })).toBe(`/student/sessions/${item.id}`);
    expect(planHref({ ...item, kind: 'assignment' })).toBe(`/student/assignments/${item.id}`);
    expect(planHref({ ...item, kind: 'remediation' })).toBe(`/student/concepts/${item.id}/remediation`);
    expect(planHref({ ...item, kind: 'review' })).toBe(`/student/chapters/${item.chapterId}/concepts/${item.id}`);
    expect(resumeLabel({ ...item, kind: 'session' })).toBe('Resume at slide 3.');
    expect(resumeLabel({ ...item, kind: 'assignment' })).toBe('Resume at question 3.');
  });

  it('treats a later calendar day as not due today', () => {
    const now = Date.UTC(2026, 9, 25, 8);
    expect(dueToday({ ...item, kind: 'assignment', dueAt: now + 3_600_000 }, now)).toBe(true);
    expect(dueToday({ ...item, kind: 'assignment', dueAt: now + 86_400_000 }, now)).toBe(false);
    expect(dueToday({ ...item, kind: 'session' }, now)).toBe(false);
  });

  it('orders a prerequisite above the concept that needs it', () => {
    const depth = conceptDepth([
      { id: 'child', prerequisiteIds: ['parent', 'missing'] },
      { id: 'parent', prerequisiteIds: [] },
    ]);
    expect(depth.get('parent')).toBe(0);
    expect(depth.get('child')).toBe(1);
  });
});
