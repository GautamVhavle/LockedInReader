import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
