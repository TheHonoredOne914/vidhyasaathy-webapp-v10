import { describe, expect, it } from 'vitest';
import ts from 'typescript';
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

  it('keeps comparison labels and numeric levels out of student workspace copy', () => {
    const sources = import.meta.glob('./student/**/*.tsx', { query: '?raw', import: 'default', eager: true });
    const forbidden = /band|rank|leaderboard|LV\s?\d/i;
    const copyAttributes = new Set(['title', 'placeholder', 'alt', 'aria-label']);
    for (const [path, source] of Object.entries(sources)) {
      // This is a public sign-in screen, not authenticated student workspace copy.
      if (path.endsWith('/NotebookSignIn.tsx')) continue;
      const file = ts.createSourceFile(path, String(source), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node)) expect(node.text, path).not.toMatch(forbidden);
        if (ts.isJsxAttribute(node) && copyAttributes.has(node.name.getText(file)) && node.initializer && ts.isStringLiteral(node.initializer)) {
          expect(node.initializer.text, path).not.toMatch(forbidden);
        }
        if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression)) {
          const attribute = node.parent;
          if (!ts.isJsxAttribute(attribute) || copyAttributes.has(attribute.name.getText(file))) {
            expect(node.expression.text, path).not.toMatch(forbidden);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
  });
});
