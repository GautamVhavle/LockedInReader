import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils.js';

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
