/** Local hackathon convenience. Explicitly disabled in production and with DEMO_LOOSE_AUTH=false. */
export function demoLooseAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production' || process.env.DEMO_LOOSE_AUTH === 'false') return false;
  return process.env.DEMO_LOOSE_AUTH === 'true'
    || process.env.NODE_ENV === 'development'
    || process.env.NODE_ENV === undefined;
}
