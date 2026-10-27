import { describe, expect, it } from 'vitest';
import { PAGE } from './pages';

describe('page meta', () => {
  it('gives every route its own title and description', () => {
    const pages = Object.values(PAGE);
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    for (const page of pages) {
      expect(page.title.length).toBeGreaterThan(3);
      expect(page.description.length).toBeGreaterThan(20);
    }
  });
});
