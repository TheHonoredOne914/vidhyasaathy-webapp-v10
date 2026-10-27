import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.ts';

describe('API environment', () => {
  it('requires a configured origin and rejects non-origin URLs', () => {
    for (const APP_ORIGIN of [undefined, 'https://school.test/', 'https://school.test/path', 'file:///school']) {
      expect(() => loadConfig({ APP_ORIGIN })).toThrow();
    }
  });

  it('requires HTTPS in production and validates numeric bounds', () => {
    expect(() => loadConfig({ APP_ORIGIN: 'http://school.test', NODE_ENV: 'production' })).toThrow();
    expect(() => loadConfig({ APP_ORIGIN: 'https://school.test', API_PORT: '70000' })).toThrow();
    expect(loadConfig({ APP_ORIGIN: 'https://school.test', NODE_ENV: 'production', API_PORT: '3002' }).API_PORT).toBe(3002);
  });

  it('accepts only a 256-bit hexadecimal claim-code encryption key', () => {
    for (const CLAIM_CODE_ENCRYPTION_KEY of ['', 'secret', 'gg'.repeat(32), '11'.repeat(31)]) {
      expect(() => loadConfig({ APP_ORIGIN: 'https://school.test', CLAIM_CODE_ENCRYPTION_KEY })).toThrow();
    }
    const key = 'ab'.repeat(32);
    expect(loadConfig({ APP_ORIGIN: 'https://school.test', CLAIM_CODE_ENCRYPTION_KEY: key }).CLAIM_CODE_ENCRYPTION_KEY).toBe(key);
  });
});
