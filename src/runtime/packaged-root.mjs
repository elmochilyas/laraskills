import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getPackagedIntelligenceRoot() {
  const srcRuntimeDir = __dirname;
  const srcDir = join(srcRuntimeDir, '..');
  const rootDir = join(srcDir, '..');
  const jsonDir = join(rootDir, 'intelligence', 'json');
  const marker = join(jsonDir, 'knowledge-units.json');
  if (existsSync(marker)) {
    return rootDir;
  }
  return null;
}

export function isPackagedRoot(root) {
  if (!root) return false;
  const packaged = getPackagedIntelligenceRoot();
  if (!packaged) return false;
  return root.replace(/\\/g, '/') === packaged.replace(/\\/g, '/');
}
