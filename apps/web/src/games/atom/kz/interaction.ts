// Use elapsed time, not frame/timer counts: slow devices must not stall a hold.
export function advanceZoom(value: number, seconds: number, holding: boolean) {
  return Math.max(0, Math.min(1, value + Math.max(0, seconds) * (holding ? 0.7 : -0.16)));
}

// Damped impulse: immediate recoil, then settle without changing the resting artwork.
export function nucleusRecoil(seconds: number, reduced: boolean) {
  const age = Math.max(0, seconds);
  return reduced ? 0 : Math.exp(-age * 5) * Math.sin(age * 18) * 0.14;
}

export function rejectedElectronProgress(seconds: number) {
  const t = Math.max(0, Math.min(1, seconds / 0.85));
  return { approach: Math.sin(Math.PI * t) ** 2, scale: t === 1 ? 0 : Math.min(1, (1 - t) * 5) };
}
