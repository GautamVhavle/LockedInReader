# 0001. Canonical document model

Status: accepted

All sources (web, EPUB, PDF, Markdown, TXT, HTML) normalize into `CanonicalDocument`. Downstream features (reader, audio, search, AI) consume that model only. Parsers may not leak format-specific trees into the UI.
