import type { ProductTheme } from '@locked-in/types';

export const PRODUCT_THEMES: Array<{ id: ProductTheme; label: string; className: string }> = [
  { id: 'light', label: 'Lamp', className: 'light' },
  { id: 'dark', label: 'Ink', className: 'dark' },
  { id: 'sepia', label: 'Vellum', className: 'sepia' },
  { id: 'night', label: 'Night watch', className: 'night' },
];

export function themeClass(theme: ProductTheme): string {
  if (theme === 'light') return 'light';
  if (theme === 'sepia') return 'sepia';
  if (theme === 'night') return 'night';
  return 'dark';
}
