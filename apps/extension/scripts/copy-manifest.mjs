import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, 'dist'), { recursive: true });
copyFileSync(resolve(root, 'manifest.json'), resolve(root, 'dist/manifest.json'));
copyFileSync(resolve(root, '../web/public/favicon.svg'), resolve(root, 'dist/favicon.svg'));
