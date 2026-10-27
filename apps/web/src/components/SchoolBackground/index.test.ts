import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SchoolBackground } from './index';

describe('SchoolBackground', () => {
  it('keeps the decorative scene small and outside the accessibility tree', () => {
    const markup = renderToStaticMarkup(createElement(SchoolBackground));
    expect(markup).toContain('aria-hidden="true"');
    expect(markup.match(/class="school-background-cloud"/g)).toHaveLength(3);
    expect(markup.match(/class="school-background-doodle"/g)).toHaveLength(8);
    expect(markup.match(/focusable="false"/g)).toHaveLength(11);
    expect(markup).not.toContain('school-background--faint');
  });

  it('supports a quieter scene for the app shell', () => {
    const markup = renderToStaticMarkup(createElement(SchoolBackground, { faint: true }));
    expect(markup).toContain('class="school-background school-background--faint"');
  });

  it('keeps the auth sky to clouds, outside the form card', () => {
    const markup = renderToStaticMarkup(createElement(SchoolBackground, { sky: true }));
    expect(markup).toContain('class="school-background school-background--sky"');
    expect(markup).not.toContain('school-background-doodle');
    expect(markup.match(/class="school-background-cloud"/g)).toHaveLength(2);
  });
});
