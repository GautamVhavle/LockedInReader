import { PRODUCT_THEMES } from '@locked-in/themes';
import type { ProductTheme } from '@locked-in/types';
import { Button } from '../ui/button.js';

export function ThemeSwitcher({
  value,
  onChange,
}: {
  value: ProductTheme;
  onChange: (theme: ProductTheme) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRODUCT_THEMES.map((theme) => (
        <Button
          key={theme.id}
          variant={value === theme.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(theme.id)}
        >
          {theme.label}
        </Button>
      ))}
    </div>
  );
}
