// Use elapsed time, not frame/timer counts: slow devices must not stall a hold.
export function advanceZoom(value: number, seconds: number, holding: boolean) {
  return Math.max(0, Math.min(1, value + Math.max(0, seconds) * (holding ? 0.7 : -0.16)));
}
