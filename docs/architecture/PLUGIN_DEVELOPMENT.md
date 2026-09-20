# Plugin development

A plugin is a `PluginManifest` plus a factory that implements one extension point.

```ts
import type { PluginManifest } from '@locked-in/types';
import type { DocumentParser } from '@locked-in/document-engine';

export const manifest: PluginManifest = {
  id: 'importer.docx',
  name: 'DOCX importer',
  version: '0.0.1',
  kind: 'importer',
};

export function createParser(): DocumentParser {
  throw new Error('Implement parse() and sniff()');
}
```

Register parsers with `DocumentEngine.register`. Do not import React in plugin packages.
