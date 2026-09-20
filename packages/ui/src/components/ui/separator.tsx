import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../../lib/utils.js';

export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}
