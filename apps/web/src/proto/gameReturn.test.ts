import { describe, expect, it } from 'vitest';
import { planGameRoute, planReturn } from './gameReturn';

describe('game return navigation', () => {
  it('preserves the exact saved session and step', () => {
    const href = planGameRoute('/student/chapters/motion/practice/engine/motion-lab', 'session-1', 3, 'explore', 'motion-lab');
    const params = new URL(href, 'https://notebook.invalid').searchParams;
    expect(planReturn(params)).toBe('/student/learning/sessions/session-1?step=3');
    expect(params.get('moduleId')).toBe('explore');
  });
  it.each(['https://evil.invalid', '//evil.invalid', '/student', '/student/learning/sessions/a?other=1', '/student/learning/sessions/../admin'])('rejects unsafe returns: %s', (returnTo) => {
    expect(planReturn(new URLSearchParams({ returnTo, step: '1' }))).toBeNull();
  });
});
