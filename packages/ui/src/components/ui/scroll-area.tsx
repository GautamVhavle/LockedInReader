import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils.js';

export function ScrollArea({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ScrollAreaPrimitive.Root className={cn('overflow-hidden', className)}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none bg-transparent p-0.5"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}
