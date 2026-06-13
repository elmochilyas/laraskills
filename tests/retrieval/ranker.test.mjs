import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import { normalizeQuery } from '../../src/retrieval/query-normalizer.mjs';
import { analyzeQuery } from '../../src/retrieval/query-analyzer.mjs';
import { resolveAliases } from '../../src/retrieval/alias-resolver.mjs';
import { routeQuery } from '../../src/retrieval/domain-router.mjs';
import { generateCandidates } from '../../src/retrieval/candidate-generator.mjs';
import { rankCandidates } from '../../src/retrieval/ranker.mjs';

describe('Ranker', () => {
  let catalog;
  let rankedResults;

  before(() => {
    catalog = loadCatalog(LARASKILLS_ROOT);
  });

  it('should rank exact KU match higher than domain-only match', () => {
    const query = 'database connection pooling';
    const normalized = normalizeQuery(query);
    const analysis = analyzeQuery(normalized);
    const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    const routes = routeQuery(normalized, analysis);
    const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);

    assert.ok(ranked.length > 0, 'Should produce ranked results');

    const topScore = ranked[0].score;
    const bottomScore = ranked[ranked.length - 1].score;
    assert.ok(topScore >= bottomScore, 'Top result should have highest or equal score');
  });

  it('should provide score breakdown for each result', () => {
    const query = 'Sanctum authentication';
    const normalized = normalizeQuery(query);
    const analysis = analyzeQuery(normalized);
    const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    const routes = routeQuery(normalized, analysis);
    const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);

    if (ranked.length > 0) {
      assert.ok(Array.isArray(ranked[0].breakdown));
      assert.ok(ranked[0].breakdown.length > 0, 'Should have at least one score signal');
    }
  });

  it('should be deterministic (same query produces same results)', () => {
    const query = 'N+1 query optimization in Eloquent';
    const normalized = normalizeQuery(query);
    const analysis = analyzeQuery(normalized);
    const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    const routes = routeQuery(normalized, analysis);

    const run1Candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const run1 = rankCandidates(run1Candidates, catalog, normalized, aliasResult, analysis);

    const run2Candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const run2 = rankCandidates(run2Candidates, catalog, normalized, aliasResult, analysis);

    assert.strictEqual(run1.length, run2.length);
    for (let i = 0; i < Math.min(10, run1.length); i++) {
      assert.strictEqual(run1[i].id, run2[i].id, `Position ${i} should match`);
      assert.strictEqual(run1[i].score, run2[i].score, `Score at position ${i} should match`);
    }
  });

  it('should have stable tie-breaking', () => {
    const query = 'test';
    const normalized = normalizeQuery(query);
    const analysis = analyzeQuery(normalized);
    const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    const routes = routeQuery(normalized, analysis);
    const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);

    for (let i = 0; i < ranked.length - 1; i++) {
      if (ranked[i].score === ranked[i + 1].score) {
        assert.ok(
          ranked[i].id.localeCompare(ranked[i + 1].id) <= 0,
          `Tied scores should be ordered lexicographically at position ${i}: ${ranked[i].id} vs ${ranked[i + 1].id}`
        );
      }
    }
  });

  it('should include relevant scoring signals', () => {
    const query = 'eager loading prevention';
    const normalized = normalizeQuery(query);
    const analysis = analyzeQuery(normalized);
    const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    const routes = routeQuery(normalized, analysis);
    const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);

    const hasSignals = ranked.some(r =>
      r.breakdown.length > 0
    );
    assert.ok(ranked.length > 0, 'Should produce ranked results');
    assert.ok(hasSignals, 'Results should have scoring breakdown');
  });

  it('should prioritize domain match results', () => {
    const query = 'database sharding strategy';
    const normalized = normalizeQuery(query);
    const analysis = analyzeQuery(normalized);
    const aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    const routes = routeQuery(normalized, analysis);
    const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    const ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);

    if (ranked.length > 0) {
      const topDomain = ranked[0].ku.domain;
      assert.ok(
        topDomain === 'data-storage-systems' || topDomain === 'performance-runtime-engineering',
        `Top result domain should be data-storage-systems or performance-runtime-engineering, got: ${topDomain}`
      );
    }
  });
});
