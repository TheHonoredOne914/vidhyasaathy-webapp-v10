/**
 * Local hackathon convenience: any name/PIN/password opens the prototype.
 * Opt-in only: DEMO_LOOSE_AUTH must be exactly 'true', and it is always off when NODE_ENV=production.
 */
export function demoLooseAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.DEMO_LOOSE_AUTH === 'true';
}
