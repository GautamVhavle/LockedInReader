import { PRODUCT_THEMES } from '@locked-in/themes';
import type { ProductTheme } from '@locked-in/types';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.js';

export function ThemeSwitcher({
  value,
  onChange,
  className,
}: {
  value: ProductTheme;
  onChange: (theme: ProductTheme) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {PRODUCT_THEMES.map((theme) => (
        <Button
          key={theme.id}
          type="button"
          variant={value === theme.id ? 'default' : 'outline'}
          size="sm"
          aria-pressed={value === theme.id}
          onClick={() => onChange(theme.id)}
        >
          {theme.label}
        </Button>
      ))}
    </div>
  );
}
