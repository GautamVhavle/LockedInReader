import type { ReactNode } from 'react';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-border px-6 py-10">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
