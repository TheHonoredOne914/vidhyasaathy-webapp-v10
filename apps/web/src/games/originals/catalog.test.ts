import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { embedGame, gameSaveKey, originalGames, readGameSave } from './catalog';

describe('Original games integration', () => {
  it('packages all four complete originals and installs the bridge before game scripts', () => {
    for (const game of originalGames) {
      const html = readFileSync(new URL(`../../../public/original-games/${game.file}`, import.meta.url), 'utf8');
      const document = embedGame(html, game.id, { progress: '</script><script>evil()</script>' });
      expect(html.length).toBeGreaterThan(100_000);
      expect(document.indexOf('vs-game-save')).toBeLessThan(document.indexOf('<script', document.indexOf('vs-game-ready')));
      expect(document).toContain("connect-src 'none'");
      expect(document).not.toContain('progress":"</script>');
      expect(document).toContain('window.AudioContext=window.webkitAudioContext=undefined');
      for (const script of document.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
        expect(() => new Script(script[1]!)).not.toThrow();
      }
    }
  });
  it('keeps profile saves separate and rejects corrupt or oversized values', () => {
    expect(gameSaveKey('school:one', 'tinker')).not.toBe(gameSaveKey('school:two', 'tinker'));
    expect(readGameSave({ getItem: () => '{broken' }, 'key')).toEqual({});
    expect(readGameSave({ getItem: () => JSON.stringify({ valid: 'ok', bad: 10, large: 'x'.repeat(200_001) }) }, 'key')).toEqual({ valid: 'ok' });
  });
});
