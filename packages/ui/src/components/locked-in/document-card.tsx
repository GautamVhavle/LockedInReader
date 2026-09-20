export function DocumentCard({
  title,
  kind,
  excerpt,
  progress,
  words,
  onClick,
}: {
  title: string;
  kind: string;
  excerpt: string;
  progress?: number;
  words?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-baseline gap-4 border-b border-border py-4 text-left last:border-b-0"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{kind}</span>
      <span className="min-w-0">
        <span className="block font-serif text-[1.35rem] leading-snug tracking-tight group-hover:text-accent">
          {title}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">{excerpt}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="filament w-full">
          <span style={{ width: `${Math.min(100, progress ?? 0)}%` }} />
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {progress !== undefined ? `${Math.round(progress)}%` : words ? `${words.toLocaleString()}w` : ''}
        </span>
      </span>
    </button>
  );
}

export const LibraryCard = DocumentCard;
