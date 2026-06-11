import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { INTELLIGENCE_JSON_DIR } from './config.mjs';

const CACHE_STORE = new Map();

const FINGERPRINT_FILES = [
  'knowledge-units.json',
  'dependencies.json',
  'relationships.json',
  'rules.json',
  'skills.json',
  'checklists.json',
  'anti-patterns.json',
  'decision-trees.json',
  'aliases.json',
  'external-concepts.json',
];

function computeFingerprint(eccRoot) {
  const jsonDir = join(eccRoot, INTELLIGENCE_JSON_DIR);
  const parts = [];
  for (const file of FINGERPRINT_FILES) {
    const fullPath = join(jsonDir, file);
    if (!existsSync(fullPath)) continue;
    try {
      const s = statSync(fullPath);
      parts.push(`${file}:${s.size}:${s.mtimeMs}`);
    } catch {
      parts.push(`${file}:missing`);
    }
  }
  return parts.join('|');
}

function buildCacheKey(eccRoot) {
  const fp = computeFingerprint(eccRoot);
  return `${eccRoot}|${fp}`;
}

export function getCachedCatalog(eccRoot) {
  const key = buildCacheKey(eccRoot);
  const entry = CACHE_STORE.get(key);
  if (entry) return entry;
  return null;
}

export function setCachedCatalog(eccRoot, catalog) {
  const key = buildCacheKey(eccRoot);
  CACHE_STORE.set(key, catalog);
}

export function clearCache() {
  CACHE_STORE.clear();
}

export function invalidateEccRoot(eccRoot) {
  for (const key of CACHE_STORE.keys()) {
    if (key.startsWith(eccRoot + '|')) {
      CACHE_STORE.delete(key);
    }
  }
}
