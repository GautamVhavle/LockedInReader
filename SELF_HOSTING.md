# Self-hosting

```bash
pnpm install
pnpm build
docker compose up --build
```

- Web: http://localhost:8080
- Optional API: http://localhost:8787/health
- Optional Postgres: `docker compose --profile sync up`

The PWA does not require the API. Enable Postgres only when you want multi-device sync.
