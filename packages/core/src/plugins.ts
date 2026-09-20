import type { PluginManifest } from '@locked-in/types';

const registry = new Map<string, PluginManifest>();

export function registerPlugin(manifest: PluginManifest): void {
  registry.set(manifest.id, manifest);
}

export function listPlugins(): PluginManifest[] {
  return [...registry.values()];
}
