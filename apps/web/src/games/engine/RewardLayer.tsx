import { useEffect, useState } from 'react';
import type { Rewards } from './rewards';

export function RewardLayer({ rewards, celebration, reducedMotion }: { rewards: Rewards; celebration: number; reducedMotion: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (celebration === 0 || reducedMotion) return;
    setVisible(true);
    const timer = window.setTimeout(() => { setVisible(false); }, 560);
    return () => { window.clearTimeout(timer); };
  }, [celebration, reducedMotion]);
  return (
    <div className="iv-rewards">
      <p aria-live="polite" aria-atomic="true">{rewards.stars} stars · Attention streak: {rewards.streak}</p>
      {visible && !reducedMotion && (
        <svg key={celebration} className="iv-sparkles" viewBox="0 0 240 64" aria-hidden="true">
          <path d="M32 9 l2 10 9 3 -10 2 -2 10 -2 -10 -9 -2 10 -2z M119 4 l3 13 12 4 -13 2 -3 13 -2 -13 -12 -3 13 -3z M204 18 l3 10 9 3 -10 2 -2 10 -2 -10 -9 -3 10 -2z" />
        </svg>
      )}
    </div>
  );
}
