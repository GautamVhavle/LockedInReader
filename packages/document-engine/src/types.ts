import type { CanonicalDocument, DocumentSourceKind } from '@locked-in/types';

export interface ParseInput {
  text?: string;
  bytes?: Uint8Array;
  filename?: string;
  url?: string;
  mimeType?: string;
  title?: string;
  siteName?: string;
}

export interface DocumentParser {
  kind: DocumentSourceKind;
  sniff(input: ParseInput): boolean;
  parse(input: ParseInput): Promise<CanonicalDocument>;
}
