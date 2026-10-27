import { useEffect, useState } from 'react';
import { SaathyMascot } from '../../ui/Saathy';

export type SaathyMood = 'talk' | 'think' | 'cheer' | 'oops';

export function speechBubbles(text: string): string[] {
  const bubbles: string[] = [];
  let bubble = '';
  for (const word of text.split(/\s+/)) {
    if (bubble && bubble.length + word.length + 1 > 64) {
      bubbles.push(bubble);
      bubble = '';
    }
    bubble = bubble ? `${bubble} ${word}` : word;
  }
  if (bubble) bubbles.push(bubble);
  return bubbles;
}

export function Saathy({ text, mood = 'talk', reducedMotion }: { text: string; mood?: SaathyMood; reducedMotion: boolean }) {
  const [letters, setLetters] = useState(0);
  useEffect(() => {
    setLetters(reducedMotion ? text.length : 0);
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setLetters((current) => {
        const next = Math.min(text.length, current + 2);
        if (next === text.length) window.clearInterval(timer);
        return next;
      });
    }, 30);
    return () => { window.clearInterval(timer); };
  }, [text, reducedMotion]);
  return (
    <div className="iv-saathy">
      <SaathyMascot className="iv-cloud" size={120} alt={`Saathy, ${mood}`} />
      <button type="button" className="iv-bubble" onClick={() => { setLetters(text.length); }} aria-label={`${text} Tap to finish typing.`}>
        <span aria-hidden="true">{reducedMotion ? text : text.slice(0, letters)}<span className="iv-typing-space">{reducedMotion ? '' : text.slice(letters)}</span></span>
      </button>
    </div>
  );
}
