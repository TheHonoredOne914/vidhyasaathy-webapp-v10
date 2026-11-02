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
  it('accepts bounded visual specifications and drops executable or oversized input', () => {
    const parse = (artifacts: unknown[]) => parseSaathyArtifacts('Explore.```saathy ' + JSON.stringify({ artifacts }) + '```').artifacts;
    expect(parse([{ type: 'demo', title: 'Motion', demo: { widget: 'motion', params: { v: 5, a: 2 }, script: 'alert(1)' } }])).toEqual([
      { type: 'demo', title: 'Motion', demo: { widget: 'motion', params: { v: 5, a: 2 } } },
    ]);
    expect(parse([{ type: 'demo', title: 'Unsafe', demo: { widget: 'javascript', params: {} } }])).toEqual([]);
    expect(parse([{ type: 'chart', title: 'Too large', chart: { kind: 'line', xLabel: 't', yLabel: 's', series: [{ name: 'Path', points: Array.from({ length: 51 }, (_, x) => ({ x, y: x })) }] } }])).toEqual([]);
    expect(parse([{ type: 'chart', title: 'Distance', chart: { kind: 'line', xLabel: 'Time (s)', yLabel: 'Distance (m)', series: [{ name: 'Walk', points: [{ x: 0, y: 0 }, { x: 1, y: 2 }] }] } }])).toHaveLength(1);
  });
});
