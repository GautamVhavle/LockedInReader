import { z } from 'zod';
import { FontFamilySchema, ProductThemeSchema } from './reading.js';

export const AIProviderIdSchema = z.enum([
  'none',
  'spacexai',
  'openai',
  'anthropic',
  'google',
  'openrouter',
  'ollama',
  'local',
  'custom',
]);
export type AIProviderId = z.infer<typeof AIProviderIdSchema>;

export const AppSettingsSchema = z.object({
  theme: ProductThemeSchema.default('dark'),
  fontFamily: FontFamilySchema.default('serif'),
  fontSizePx: z.number().min(12).max(48).default(20),
  wpm: z.number().int().min(50).max(2000).default(350),
  chunkSize: z.number().int().min(1).max(12).default(1),
  orpEnabled: z.boolean().default(true),
  aiProvider: AIProviderIdSchema.default('none'),
  aiModel: z.string().optional(),
  aiBaseUrl: z.string().optional(),
  /** BYOK: stored locally, never logged or committed. */
  hasLocalAiKey: z.boolean().default(false),
  ttsVoice: z.string().optional(),
  ttsRate: z.number().min(0.5).max(3).default(1),
  reducedMotion: z.boolean().default(false),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = AppSettingsSchema.parse({});
