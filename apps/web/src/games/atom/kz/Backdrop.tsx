import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { makeBackdrop } from './background';

export function Backdrop({ inner, outer }: { inner: string; outer: string }) {
  const { size } = useThree();
  const backdrop = useMemo(() => makeBackdrop(inner, outer), [inner, outer]);
  backdrop.material.uniforms.uRes.value.set(size.width, size.height);
  useEffect(() => () => { backdrop.geometry.dispose(); backdrop.material.dispose(); }, [backdrop]);
  return <primitive object={backdrop} />;
}
