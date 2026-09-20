import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-xl',
          className,
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <DialogPrimitive.Title className="text-lg font-medium">{children}</DialogPrimitive.Title>;
}
