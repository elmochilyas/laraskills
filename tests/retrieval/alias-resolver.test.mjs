import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { resolveAliases } from '../../src/retrieval/alias-resolver.mjs';

const SAMPLE_ALIASES = [
  {
    alias: 'N+1 queries',
    normalized_alias: 'n-plus-one-queries',
    canonical_ku_id: 'data-storage-systems/queries/n-plus-one-detection-elimination',
    source_paths: ['knowledge/data-storage-systems/queries/n-plus-one-detection-elimination/04-standardized-knowledge.md'],
  },
  {
    alias: 'Lazy loading',
    normalized_alias: 'lazy-loading',
    canonical_ku_id: 'data-storage-systems/queries/lazy-loading-prevention',
    source_paths: ['knowledge/data-storage-systems/queries/lazy-loading-prevention/04-standardized-knowledge.md'],
  },
  {
    alias: 'Eager loading',
    normalized_alias: 'eager-loading',
    canonical_ku_id: 'data-storage-systems/queries/eager-loading',
    source_paths: ['knowledge/data-storage-systems/queries/eager-loading/04-standardized-knowledge.md'],
  },
  {
    alias: 'ACID',
    normalized_alias: 'acid-properties',
    canonical_ku_id: 'data-storage-systems/transactions/acid-properties',
    source_paths: ['knowledge/data-storage-systems/transactions/acid-properties/04-standardized-knowledge.md'],
  },
  {
    alias: 'Deadlock prevention',
    normalized_alias: 'deadlock-prevention',
    canonical_ku_id: 'data-storage-systems/transactions/deadlock-prevention-patterns',
    source_paths: ['knowledge/data-storage-systems/transactions/deadlock-prevention-patterns/04-standardized-knowledge.md'],
  },
  {
    alias: 'Laravel read/write config',
    normalized_alias: 'laravel-read-write-config',
    canonical_ku_id: 'data-storage-systems/replication/laravel-read-write-config',
    source_paths: ['knowledge/data-storage-systems/replication/laravel-read-write-config/04-standardized-knowledge.md'],
  },
];

describe('Alias Resolver', () => {
  it('should resolve exact alias match', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['n+1', 'queries']);
    assert.ok(result.matchedKuIds.includes('data-storage-systems/queries/n-plus-one-detection-elimination'));
  });

  it('should resolve normalized alias match', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['n-plus-one-queries']);
    assert.ok(result.matchedKuIds.includes('data-storage-systems/queries/n-plus-one-detection-elimination'));
  });

  it('should resolve substring alias', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['fix', 'lazy', 'loading', 'issue']);
    const match = result.resolved.find(r => r.canonicalKuId === 'data-storage-systems/queries/lazy-loading-prevention');
    assert.ok(match);
    assert.strictEqual(match.matchType, 'substring');
  });

  it('should return empty for missing alias', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['completely', 'unrelated', 'query']);
    assert.strictEqual(result.appliedAliases.length, 0);
    assert.strictEqual(result.matchedKuIds.length, 0);
  });

  it('should not resolve a multi-token alias from one shared token', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['laravel', 'policy', 'feature', 'tests']);
    assert.strictEqual(result.appliedAliases.length, 0);
    assert.strictEqual(result.matchedKuIds.length, 0);
  });

  it('should handle empty aliases array', () => {
    const result = resolveAliases([], ['n+1', 'queries']);
    assert.strictEqual(result.appliedAliases.length, 0);
    assert.strictEqual(result.matchedKuIds.length, 0);
  });

  it('should provide applied alias explanation', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['ACID', 'properties']);
    assert.ok(result.appliedAliases.length > 0);
    assert.ok(result.appliedAliases[0].matchType);
    assert.ok(result.appliedAliases[0].alias);
  });

  it('should deduplicate matched KU ids', () => {
    const result = resolveAliases(SAMPLE_ALIASES, ['eager', 'loading']);
    const uniqueIds = new Set(result.matchedKuIds);
    assert.strictEqual(result.matchedKuIds.length, uniqueIds.size);
  });
});
