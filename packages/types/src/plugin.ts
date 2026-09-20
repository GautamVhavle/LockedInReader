import { z } from 'zod';

export const PluginKindSchema = z.enum([
  'importer',
  'extractor',
  'exporter',
  'theme',
  'reading-mode',
  'ai-provider',
  'tts-provider',
  'metadata-provider',
]);
export type PluginKind = z.infer<typeof PluginKindSchema>;

export const PluginManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  kind: PluginKindSchema,
  description: z.string().optional(),
});
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
