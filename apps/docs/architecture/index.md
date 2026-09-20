# Architecture

See the repository document [`docs/architecture/ARCHITECTURE.md`](https://github.com/GautamVhavle/LockedInReader/blob/main/docs/architecture/ARCHITECTURE.md).

Dependency direction:

```
apps/web, apps/extension
        ↓
packages/ui
        ↓
packages/{reader-engine,document-engine,storage,ai,...}
        ↓
packages/core, packages/types
```

Core packages must not import React, Chrome APIs, or cloud vendor SDKs.
