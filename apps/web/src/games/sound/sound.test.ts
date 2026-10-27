import { describe, expect, it } from 'vitest';
import { game } from './index';
import { echoSonarCheck, longitudinalCheck, loudnessCheck, pitchCheck } from './validators';

describe('Echo Canyon arena', () => {
  it('defines four Class 9 sound levels', () => {
    expect(game.chapterRef).toContain('Class 9 · Ch 12 · Sound');
    expect(game.arena?.levels.map((level) => level.title)).toHaveLength(4);
    expect(game.arena?.name).toBe('ECHO CANYON');
  });
  it('validates longitudinal waves', () => {
    expect(longitudinalCheck({ wave: 'longitudinal', pressure: 'high' }).correct).toBe(true);
    expect(longitudinalCheck({ wave: 'transverse', pressure: 'high' }).correct).toBe(false);
  });
  it('validates pitch and loudness controls', () => {
    expect(pitchCheck({ frequency: '440' }).correct).toBe(true);
    expect(pitchCheck({ frequency: '120' }).correct).toBe(false);
    expect(loudnessCheck({ amplitude: '8' }).correct).toBe(true);
    expect(loudnessCheck({ amplitude: '3' }).correct).toBe(false);
  });
  it('validates the 17.2 m echo rule', () => {
    expect(echoSonarCheck({ time: '0.1', distance: '17.2' }).correct).toBe(true);
    expect(echoSonarCheck({ time: '0.1', distance: '34.4' }).correct).toBe(false);
  });
});
