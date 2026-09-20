import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { LocalOnlySyncAdapter } from '@locked-in/sync';
import type { SyncChange } from '@locked-in/types';

const app = new Hono();
const adapter = new LocalOnlySyncAdapter();

app.use('/*', cors());
app.get('/health', (c) => c.json({ ok: true, mode: 'optional-sync' }));

app.post('/sync/push', async (c) => {
  const body = (await c.req.json()) as { changes?: SyncChange[] };
  await adapter.push(body.changes ?? []);
  return c.json({ accepted: body.changes?.length ?? 0 });
});

app.get('/sync/pull', async (c) => {
  const since = c.req.query('since');
  const changes = await adapter.pull(since);
  return c.json({ changes });
});

const port = Number(process.env.PORT ?? 8787);
if (!process.env.VITEST) {
  serve({ fetch: app.fetch, port });
}

export { app };
