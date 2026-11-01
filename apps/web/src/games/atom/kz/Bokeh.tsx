import { useEffect, useMemo } from 'react';
import { makeBokeh } from './background';

export function Bokeh({ count = 26, color = '#5a1fd1', near = false }: { count?: number; color?: string; near?: boolean }) {
  const bokeh = useMemo(() => makeBokeh(count, color, near ? 5 : -40, near ? 9 : -14, near ? [18, 12] : [70, 40], near ? [2.2, 3.6] : [1.5, 5], near ? 0.4 : 0.3, near ? 21 : 3), [count, color, near]);
  useEffect(() => () => bokeh.traverse((object) => {
    if ('material' in object) (object.material as { dispose: () => void }).dispose();
  }), [bokeh]);
  return <primitive object={bokeh} />;
}
