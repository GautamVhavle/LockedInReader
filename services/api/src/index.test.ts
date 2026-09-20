import { describe, expect, it } from 'vitest';
import { app } from './index.js';

describe('api', () => {
  it('health is unauthenticated', async () => {
    const response = await app.request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });
});
