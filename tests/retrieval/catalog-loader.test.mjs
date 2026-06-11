import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, 'fixtures');

import { loadCatalog, findEccRoot } from '../../src/retrieval/catalog-loader.mjs';
import { clearCache } from '../../src/retrieval/cache-manager.mjs';

const ECC_ROOT = join(__dirname, '..', '..');

describe('Catalog Loader', () => {
  let catalog;

  before(() => {
    catalog = loadCatalog(ECC_ROOT);
  });

  it('should load knowledge units', () => {
    assert.ok(catalog.knowledgeUnits.size > 0);
    assert.ok(catalog.knowledgeUnitsCount > 0);
  });

  it('should have knowledge units with id field', () => {
    for (const [id, ku] of catalog.knowledgeUnits) {
      assert.ok(id, 'KU id should be truthy');
      assert.ok(ku.domain, `KU ${id} should have domain`);
      assert.ok(ku.subdomain, `KU ${id} should have subdomain`);
    }
  });

  it('should load dependencies', () => {
    assert.ok(Array.isArray(catalog.dependencies.edges));
    assert.ok(catalog.dependencyEdgesCount >= 0);
  });

  it('should load relationships', () => {
    assert.ok(Array.isArray(catalog.relationships.edges));
    assert.ok(catalog.relationshipEdgesCount >= 0);
  });

  it('should load rules', () => {
    assert.ok(Array.isArray(catalog.rules));
    assert.ok(catalog.rules.length > 0);
  });

  it('should load skills', () => {
    assert.ok(Array.isArray(catalog.skills));
    assert.ok(catalog.skills.length > 0);
  });

  it('should load checklists', () => {
    assert.ok(Array.isArray(catalog.checklists));
    assert.ok(catalog.checklists.length > 0);
  });

  it('should load anti-patterns', () => {
    assert.ok(Array.isArray(catalog.antiPatterns));
    assert.ok(catalog.antiPatterns.length > 0);
  });

  it('should load decision trees', () => {
    assert.ok(Array.isArray(catalog.decisionTrees));
    assert.ok(catalog.decisionTrees.length > 0);
  });

  it('should handle optional aliases.json gracefully', () => {
    assert.ok(Array.isArray(catalog.aliases));
  });

  it('should handle optional external-concepts.json gracefully', () => {
    assert.ok(Array.isArray(catalog.externalConcepts));
  });

  it('should not have errors', () => {
    assert.strictEqual(catalog.errors.length, 0);
  });

  it('should deduplicate KU ids', () => {
    const ids = new Set();
    const duplicates = [];
    for (const [id] of catalog.knowledgeUnits) {
      if (ids.has(id)) duplicates.push(id);
      ids.add(id);
    }
    assert.strictEqual(duplicates.length, 0, `Duplicate KU ids: ${duplicates.join(', ')}`);
  });

  it('should resolve ECC root from current directory', () => {
    const root = findEccRoot(ECC_ROOT, null, null);
    const normalizedRoot = root.replace(/\\/g, '/');
    const normalizedEcc = ECC_ROOT.replace(/\\/g, '/');
    assert.strictEqual(normalizedRoot, normalizedEcc);
  });

  it('should throw for missing explicit root', () => {
    assert.throws(() => findEccRoot(ECC_ROOT, '/nonexistent/path', null), /not found/i);
  });

  describe('Cache integration', () => {
    before(() => clearCache());

    it('should return cached catalog on second load (same reference)', () => {
      clearCache();
      const first = loadCatalog(ECC_ROOT);
      const second = loadCatalog(ECC_ROOT);
      assert.strictEqual(first, second);
    });

    it('should return new catalog object after clearCache', () => {
      clearCache();
      const first = loadCatalog(ECC_ROOT);
      clearCache();
      const second = loadCatalog(ECC_ROOT);
      assert.notStrictEqual(first, second);
      assert.strictEqual(first.knowledgeUnitsCount, second.knowledgeUnitsCount);
    });

    it('should load faster on cached invocation (performance regression guard)', () => {
      clearCache();
      const warmup = 3;
      for (let i = 0; i < warmup; i++) {
        clearCache();
        loadCatalog(ECC_ROOT);
      }

      clearCache();
      const coldStart = performance.now();
      loadCatalog(ECC_ROOT);
      const coldTime = performance.now() - coldStart;

      const warmStart = performance.now();
      loadCatalog(ECC_ROOT);
      const warmTime = performance.now() - warmStart;

      if (coldTime > 5) {
        assert.ok(warmTime < coldTime, `Warm (${warmTime.toFixed(1)}ms) should be faster than cold (${coldTime.toFixed(1)}ms)`);
      }
    });
  });
});
