# Contributing

1. `pnpm install`
2. `pnpm dev` starts the PWA (and the extension watcher).
3. `pnpm test && pnpm typecheck && pnpm lint && pnpm build` must pass.

Put shared logic in `packages/`. Keep core free of React and Chrome APIs. Add fixtures for new parsers. Record architecture decisions in `docs/decisions/`.
