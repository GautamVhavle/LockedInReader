export function DocumentCard({
  title,
  kind,
  excerpt,
  progress,
  words,
  featured,
  showKind = true,
  onClick,
}: {
  title: string;
  kind: string;
  excerpt: string;
  progress?: number;
  words?: number;
  featured?: boolean;
  showKind?: boolean;
  onClick?: () => void;
}) {
  const preview = excerpt.trim() || 'No preview yet';
  const read =
    progress !== undefined ? Math.round(Math.min(100, Math.max(0, progress))) : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`group flex h-full min-h-36 w-full cursor-pointer flex-col rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-accent ${
        featured ? 'sm:min-h-44' : ''
      }`}
    >
      {showKind ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {kind}
        </span>
      ) : null}
      <span
        className={`${showKind ? 'mt-3' : ''} block font-serif leading-snug tracking-tight group-hover:text-accent ${featured ? 'text-3xl' : 'line-clamp-2 text-xl'}`}
      >
        {title || 'Untitled'}
      </span>
      <span
        className={`mt-2 block text-sm text-muted-foreground ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}
      >
        {preview}
      </span>
      <span className="mt-auto flex items-center gap-3 pt-5">
        <span className="filament w-full">
          <span style={{ width: `${read ?? 0}%` }} />
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
          {read !== undefined ? `${read}%` : words ? `${words.toLocaleString()} words` : 'New'}
        </span>
      </span>
    </button>
  );
}

export const LibraryCard = DocumentCard;
