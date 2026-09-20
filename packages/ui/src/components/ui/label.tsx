import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils.js';

export function Label({ className, ...props }: LabelPrimitive.LabelProps) {
  return (
    <LabelPrimitive.Root className={cn('text-sm font-medium', className)} {...props} />
  );
}
