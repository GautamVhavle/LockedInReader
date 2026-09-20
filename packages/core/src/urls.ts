const BLOCKED_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'blob:',
]);

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value, 'https://locked-in.invalid');
    const protocol = url.protocol.toLowerCase();
    if (BLOCKED_PROTOCOLS.has(protocol)) return false;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

export function sanitizeHref(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('#') || value.startsWith('/')) return value;
  return isSafeHttpUrl(value) ? value : undefined;
}
