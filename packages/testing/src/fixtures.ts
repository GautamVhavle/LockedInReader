import {
  CanonicalDocumentSchema,
  createBlockId,
  createDocumentId,
  DOCUMENT_SCHEMA_VERSION,
  nowIso,
  type CanonicalDocument,
} from '@locked-in/types';

export const SAMPLE_MARKDOWN = `# Locked In

Read faster. Listen anywhere. Remember everything.

## Why it exists

There is too much information and too many places to consume it.

- Capture anything
- Read it your way
- Own the knowledge

\`\`\`ts
const wpm = 550;
\`\`\`
`;

export const SAMPLE_TXT = `Locked In Reader

Read faster. Listen anywhere. Remember everything. Own your knowledge.

The same document can be read, speed-read, or listened to. Progress stays attached to the canonical document, not the renderer.`;

export const SAMPLE_HTML = `<!doctype html>
<html lang="en">
  <body>
    <header><nav>Home</nav></header>
    <article>
      <h1>The Future of Personal Knowledge</h1>
      <p>Anything you read should become part of your personal knowledge system.</p>
      <p>You should be able to consume that knowledge however you want.</p>
    </article>
    <footer>ads</footer>
  </body>
</html>`;

export function sampleDocument(overrides: Partial<CanonicalDocument> = {}): CanonicalDocument {
  const id = overrides.id ?? createDocumentId();
  const heading = createBlockId();
  const paragraph = createBlockId();
  const now = nowIso();
  return CanonicalDocumentSchema.parse({
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    id,
    source: { kind: 'markdown', filename: 'sample.md' },
    metadata: {
      title: 'Locked In',
      authors: ['Locked In'],
      wordCount: 8,
      characterCount: 48,
    },
    structure: {
      toc: [{ id: 'h1', title: 'Locked In', blockId: heading, children: [] }],
      spine: [heading, paragraph],
    },
    blocks: [
      { id: heading, type: 'heading', text: 'Locked In', order: 0, level: 1 },
      {
        id: paragraph,
        type: 'paragraph',
        text: 'Read faster. Listen anywhere. Remember everything.',
        order: 1,
      },
    ],
    assets: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}
