import { afterEach, expect, it, vi } from 'vitest';
import { bootstrapDemo, ensureDemoStory } from '../src/db/demo-bootstrap.ts';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness | undefined;
afterEach(async () => { await h?.app.close(); h = undefined; vi.unstubAllEnvs(); });
it('self-seeds a fresh opted-in server and preserves counts and session progress on repeat', async () => {
  vi.stubEnv('DEMO_LOOSE_AUTH', 'true');
  h = await createHarness();
  const response = await h.app.inject({ url: '/auth/demo/students' });
  expect(response.statusCode).toBe(200);
  for (const name of ['Aarav', 'Priya', 'Rohan']) expect(response.body).toContain(name);
  const count = () => h!.database.sqlite.prepare('SELECT count(*) n FROM profile').get();
  const before = count();
  const session = h.database.sqlite.prepare('SELECT plan FROM proto_study_session').get() as { plan: string };
  expect(JSON.parse(session.plan).currentStep).toBe(2);
  await bootstrapDemo(h.database, h.now());
  await ensureDemoStory(h.database, h.now());
  expect(count()).toEqual(before);
  expect(h.database.sqlite.prepare('SELECT count(*) n FROM proto_study_session').get()).toEqual({ n: 1 });
});
it('never self-seeds production or an unrequested server', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('DEMO_SEED', 'true');
  h = await createHarness();
  expect(h.database.sqlite.prepare('SELECT count(*) n FROM profile').get()).toEqual({ n: 0 });
});
