import { useEffect, useMemo } from 'react';
import { makeSparkles } from './background';

export function Sparkles({ count = 180 }: { count?: number }) {
  const sparkles = useMemo(() => makeSparkles(count, [60, 36, 40]), [count]);
  useEffect(() => () => { sparkles.geometry.dispose(); sparkles.material.dispose(); }, [sparkles]);
  return <primitive object={sparkles} />;
}
