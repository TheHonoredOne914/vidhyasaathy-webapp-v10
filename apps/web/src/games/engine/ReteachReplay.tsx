import { useEffect, useState } from 'react';
import { Saathy, speechBubbles } from './Saathy';
import type { Scene, SceneState } from './types';

export function ReteachReplay({ scene, narration, hint, feedback, state, onRetry }: {
  scene: Scene | null;
  narration: string[];
  hint: string;
  feedback: string;
  state: SceneState;
  onRetry: () => void;
}) {
  const duration = Math.min(scene?.durationMs ?? 4000, 6000);
  const [ms, setMs] = useState(0);
  const [bubble, setBubble] = useState(0);
  const messages = [...speechBubbles(feedback), ...narration.flatMap(speechBubbles), ...speechBubbles(hint)];
  useEffect(() => {
    if (state.reducedMotion) return;
    let frame = 0;
    let start: number | null = null;
    function tick(now: number) {
      start ??= now;
      const next = Math.min(duration, now - start);
      setMs(next);
      if (next < duration) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [duration, state.reducedMotion]);
  return (
    <section className="iv-reteach" aria-label="Short reteach replay">
      <h3>Look once more</h3>
      {scene && <div className="iv-stage">{scene.render(state.reducedMotion ? 1 : ms / scene.durationMs, { ...state, narrationIndex: 0, highlightId: scene.signals[0] ?? null })}</div>}
      <Saathy text={messages[bubble] ?? hint} mood="oops" reducedMotion={state.reducedMotion} />
      <div className="iv-actions">
        {bubble < messages.length - 1 && <button type="button" onClick={() => { setBubble((current) => current + 1); }}>Next explanation</button>}
        <button type="button" disabled={!state.reducedMotion && ms < duration} onClick={onRetry}>Try again</button>
      </div>
    </section>
  );
}
