import { clampLocation, textAtLocation } from '@locked-in/core';
import type { AnnotationRepository } from '@locked-in/storage';
import {
  createBookmarkId,
  createHighlightId,
  createNoteId,
  nowIso,
  type Bookmark,
  type CanonicalDocument,
  type DocumentLocation,
  type Highlight,
  type HighlightColor,
  type Note,
  type NoteTarget,
} from '@locked-in/types';

export function createHighlight(
  document: CanonicalDocument,
  location: DocumentLocation,
  color: HighlightColor = 'yellow',
): Highlight {
  const clamped = clampLocation(document, location);
  const now = nowIso();
  return {
    id: createHighlightId(),
    documentId: document.id,
    location: clamped,
    text: textAtLocation(document, clamped),
    color,
    createdAt: now,
    updatedAt: now,
  };
}

export function createNote(target: NoteTarget, body: string): Note {
  const now = nowIso();
  return {
    id: createNoteId(),
    target,
    body,
    createdAt: now,
    updatedAt: now,
  };
}

export function createBookmark(
  document: CanonicalDocument,
  location: DocumentLocation,
  label?: string,
): Bookmark {
  return {
    id: createBookmarkId(),
    documentId: document.id,
    location: clampLocation(document, location),
    label,
    createdAt: nowIso(),
  };
}

export class AnnotationService {
  constructor(private readonly repo: AnnotationRepository) {}

  async highlight(
    document: CanonicalDocument,
    location: DocumentLocation,
    color?: HighlightColor,
  ): Promise<Highlight> {
    const highlight = createHighlight(document, location, color);
    await this.repo.saveHighlight(highlight);
    return highlight;
  }

  async note(target: NoteTarget, body: string): Promise<Note> {
    const note = createNote(target, body);
    await this.repo.saveNote(note);
    return note;
  }
}
