import { describe, expect, it } from 'vitest';
import { parseSaathyArtifacts } from '../src/ai/saathy-artifacts.ts';

describe('Saathy artifact metadata', () => {
  it('keeps prose and validates supported cards without carrying answer keys', () => {
    const result = parseSaathyArtifacts('Think first.\n```saathy\n'+JSON.stringify({ artifacts: [{ type: 'notes', title: 'Remember', points: ['Distance has a unit.'], answer: 2 }, { type: 'html', title: 'Unsafe', body: '<script />' }] })+'\n```');
    expect(result.text).toBe('Think first.');
    expect(result.artifacts).toEqual([{ type: 'notes', title: 'Remember', points: ['Distance has a unit.'] }]);
  });
  it('strips malformed and interrupted metadata', () => {
    expect(parseSaathyArtifacts('Hello```saathy {"answer":2').text).toBe('Hello');
    expect(parseSaathyArtifacts('Hello```saathy nope```').artifacts).toEqual([]);
  });
});
