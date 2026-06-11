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
const ECC_ROOT = join(__dirname, '..', '..');

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
    const catalog = loadCatalog(ECC_ROOT);
    const cached = getCachedCatalog(ECC_ROOT);
    assert.ok(cached);
    assert.strictEqual(cached.knowledgeUnitsCount, catalog.knowledgeUnitsCount);
  });

  it('should return same object reference on repeated loads', () => {
    clearCache();
    const first = loadCatalog(ECC_ROOT);
    const second = loadCatalog(ECC_ROOT);
    assert.strictEqual(first, second);
  });

  it('should clear all cached data', () => {
    clearCache();
    loadCatalog(ECC_ROOT);
    assert.ok(getCachedCatalog(ECC_ROOT));
    clearCache();
    assert.strictEqual(getCachedCatalog(ECC_ROOT), null);
  });

  it('should invalidate specific ECC root', () => {
    clearCache();
    loadCatalog(ECC_ROOT);
    assert.ok(getCachedCatalog(ECC_ROOT));
    invalidateEccRoot(ECC_ROOT);
    assert.strictEqual(getCachedCatalog(ECC_ROOT), null);
  });

  it('should not share cache between different ECC roots', () => {
    clearCache();
    loadCatalog(ECC_ROOT);
    const cachedOther = getCachedCatalog('/other/fake/root');
    assert.strictEqual(cachedOther, null);
  });

  it('should recompute after cache clear', () => {
    clearCache();
    const first = loadCatalog(ECC_ROOT);
    clearCache();
    const second = loadCatalog(ECC_ROOT);
    assert.notStrictEqual(first, second);
    assert.strictEqual(first.knowledgeUnitsCount, second.knowledgeUnitsCount);
  });
});
