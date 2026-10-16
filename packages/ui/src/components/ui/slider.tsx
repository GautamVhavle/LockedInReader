import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils.js';

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
  disabled,
  'aria-label': ariaLabel,
  'aria-valuetext': ariaValueText,
}: {
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-valuetext'?: string;
}) {
  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex h-11 w-full touch-none items-center data-disabled:opacity-50',
        className,
      )}
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText}
    >
      <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background" />
    </SliderPrimitive.Root>
  );
}
