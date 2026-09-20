import { z } from 'zod';
import { IsoTimestampSchema, PresetIdSchema } from './ids.js';

export const ReadingModeSchema = z.enum(['normal', 'rsvp', 'orp', 'chunk', 'guided']);
export type ReadingMode = z.infer<typeof ReadingModeSchema>;

export const FontFamilySchema = z.enum(['serif', 'sans', 'mono', 'system']);
export type FontFamily = z.infer<typeof FontFamilySchema>;

export const ProductThemeSchema = z.enum(['light', 'dark', 'sepia', 'night']);
export type ProductTheme = z.infer<typeof ProductThemeSchema>;

export const ReadingPresetSchema = z.object({
  id: PresetIdSchema,
  name: z.string().min(1),
  mode: ReadingModeSchema,
  wpm: z.number().int().min(50).max(2000),
  chunkSize: z.number().int().min(1).max(12).default(1),
  fontFamily: FontFamilySchema.default('serif'),
  fontSizePx: z.number().min(12).max(48).default(20),
  lineHeight: z.number().min(1).max(2.4).default(1.6),
  columnWidthCh: z.number().min(40).max(90).default(66),
  orpEnabled: z.boolean().default(true),
  punctuationPauseMs: z.number().int().nonnegative().default(80),
  paragraphPauseMs: z.number().int().nonnegative().default(220),
  headingPauseMs: z.number().int().nonnegative().default(320),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type ReadingPreset = z.infer<typeof ReadingPresetSchema>;

export const DEFAULT_READING_PRESET: Omit<ReadingPreset, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Focused',
  mode: 'orp',
  wpm: 350,
  chunkSize: 1,
  fontFamily: 'serif',
  fontSizePx: 22,
  lineHeight: 1.65,
  columnWidthCh: 62,
  orpEnabled: true,
  punctuationPauseMs: 80,
  paragraphPauseMs: 220,
  headingPauseMs: 320,
};
