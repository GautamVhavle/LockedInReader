import { cn } from '../../lib/utils.js';

export function HighlightMark({
  color = 'yellow',
  children,
}: {
  color?: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
  children: string;
}) {
  const tones: Record<string, string> = {
    yellow: 'bg-reader-highlight',
    green: 'bg-emerald-200/70 dark:bg-emerald-900/60',
    blue: 'bg-sky-200/70 dark:bg-sky-900/60',
    pink: 'bg-rose-200/70 dark:bg-rose-900/60',
    orange: 'bg-orange-200/70 dark:bg-orange-900/60',
  };
  return <mark className={cn('rounded-sm px-0.5', tones[color])}>{children}</mark>;
}
