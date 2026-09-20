import type { CanonicalDocument, DocumentLocation, ReaderPosition } from '@locked-in/types';

export function clampLocation(
  document: CanonicalDocument,
  location: DocumentLocation,
): DocumentLocation {
  const block = document.blocks.find((item) => item.id === location.blockId);
  if (!block) {
    const first = document.blocks[0];
    if (!first) {
      return location;
    }
    return {
      documentId: document.id,
      blockId: first.id,
      startOffset: 0,
      endOffset: 0,
    };
  }
  const max = block.text.length;
  const start = Math.min(location.startOffset, max);
  const end = Math.min(Math.max(location.endOffset, start), max);
  return { ...location, startOffset: start, endOffset: end };
}

export function positionToLocation(position: ReaderPosition): DocumentLocation {
  return {
    documentId: position.documentId,
    blockId: position.blockId,
    startOffset: position.offset,
    endOffset: position.offset,
  };
}

export function textAtLocation(
  document: CanonicalDocument,
  location: DocumentLocation,
): string {
  const block = document.blocks.find((item) => item.id === location.blockId);
  if (!block) return '';
  return block.text.slice(location.startOffset, location.endOffset);
}

export function progressPercent(
  document: CanonicalDocument,
  position: ReaderPosition,
): number {
  if (document.blocks.length === 0) return 0;
  const index = document.blocks.findIndex((block) => block.id === position.blockId);
  if (index < 0) return 0;
  const total = document.blocks.length;
  return Math.min(100, Math.round(((index + 1) / total) * 1000) / 10);
}
