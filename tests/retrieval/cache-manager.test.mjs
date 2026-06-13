import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import {
  getCachedCatalog,
  setCachedCatalog,
  clearCache,
  invalidateEccRoot,
} from '../../src/retrieval/cache-manager.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

describe('Cache Manager', () => {
  before(() => {
    clearCache();
  });

  it('should return null for uncached root', () => {
    const cached = getCachedCatalog('/nonexistent/path');
    assert.strictEqual(cached, null);
  });

  it('should store and return cached catalog', () => {
    clearCache();
    const catalog = loadCatalog(LARASKILLS_ROOT);
    const cached = getCachedCatalog(LARASKILLS_ROOT);
    assert.ok(cached);
    assert.strictEqual(cached.knowledgeUnitsCount, catalog.knowledgeUnitsCount);
  });

  it('should return same object reference on repeated loads', () => {
    clearCache();
    const first = loadCatalog(LARASKILLS_ROOT);
    const second = loadCatalog(LARASKILLS_ROOT);
    assert.strictEqual(first, second);
  });

  it('should clear all cached data', () => {
    clearCache();
    loadCatalog(LARASKILLS_ROOT);
    assert.ok(getCachedCatalog(LARASKILLS_ROOT));
    clearCache();
    assert.strictEqual(getCachedCatalog(LARASKILLS_ROOT), null);
  });

  it('should invalidate specific ECC root', () => {
    clearCache();
    loadCatalog(LARASKILLS_ROOT);
    assert.ok(getCachedCatalog(LARASKILLS_ROOT));
    invalidateEccRoot(LARASKILLS_ROOT);
    assert.strictEqual(getCachedCatalog(LARASKILLS_ROOT), null);
  });

  it('should not share cache between different ECC roots', () => {
    clearCache();
    loadCatalog(LARASKILLS_ROOT);
    const cachedOther = getCachedCatalog('/other/fake/root');
    assert.strictEqual(cachedOther, null);
  });

  it('should recompute after cache clear', () => {
    clearCache();
    const first = loadCatalog(LARASKILLS_ROOT);
    clearCache();
    const second = loadCatalog(LARASKILLS_ROOT);
    assert.notStrictEqual(first, second);
    assert.strictEqual(first.knowledgeUnitsCount, second.knowledgeUnitsCount);
  });
});
