# 0002. Local-first storage

Status: accepted

`StorageAdapter` is the persistence port. IndexedDB is the browser adapter; an in-memory adapter is used in tests. UI never touches IndexedDB directly. Cloud sync is a change-log adapter, not a source of truth.
