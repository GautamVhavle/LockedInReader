import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/utils.js';

export function Switch({
  checked,
  onCheckedChange,
  className,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'h-5 w-9 rounded-full bg-muted data-[state=checked]:bg-primary',
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-card transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
