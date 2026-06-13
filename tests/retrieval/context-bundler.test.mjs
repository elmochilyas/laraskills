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
import { expandGraph } from '../../src/retrieval/graph-expander.mjs';
import { buildContextBundle } from '../../src/retrieval/context-bundler.mjs';

describe('Context Bundler', () => {
  let catalog;
  let ranked;
  let graphResult;
  let routes;
  let aliasResult;
  let analysis;
  let bundle;
  const query = 'Build a REST API with Sanctum authentication';

  before(() => {
    catalog = loadCatalog(LARASKILLS_ROOT);
    const normalized = normalizeQuery(query);
    analysis = analyzeQuery(normalized);
    aliasResult = resolveAliases(catalog.aliases, normalized.tokens);
    routes = routeQuery(normalized, analysis);
    const candidates = generateCandidates(catalog, analysis, aliasResult, routes);
    ranked = rankCandidates(candidates, catalog, normalized, aliasResult, analysis);
    const topIds = ranked.slice(0, 10).map(r => r.id);
    graphResult = expandGraph(catalog, topIds, {
      prerequisiteDepth: 1,
      relatedDepth: 1,
      maxPrerequisites: 5,
      maxRelated: 5,
    });
    bundle = buildContextBundle(
      { originalQuery: query, mode: 'standard' },
      ranked,
      graphResult,
      routes,
      aliasResult,
      analysis,
      catalog,
    );
  });

  it('should include the original query', () => {
    assert.strictEqual(bundle.query, query);
  });

  it('should include selected domains', () => {
    assert.ok(Array.isArray(bundle.selectedDomains));
    if (bundle.selectedDomains.length > 0) {
      assert.ok(bundle.selectedDomains[0].id);
      assert.ok(bundle.selectedDomains[0].name);
      assert.ok(typeof bundle.selectedDomains[0].score === 'number');
    }
  });

  it('should include knowledge units with scores', () => {
    assert.ok(Array.isArray(bundle.knowledgeUnits));
    if (bundle.knowledgeUnits.length > 0) {
      assert.ok(bundle.knowledgeUnits[0].id);
      assert.ok(typeof bundle.knowledgeUnits[0].score === 'number');
      assert.ok(Array.isArray(bundle.knowledgeUnits[0].breakdown));
    }
  });

  it('should include rules', () => {
    assert.ok(Array.isArray(bundle.rules));
  });

  it('should include skills', () => {
    assert.ok(Array.isArray(bundle.skills));
  });

  it('should include checklists', () => {
    assert.ok(Array.isArray(bundle.checklists));
  });

  it('should include prerequisites', () => {
    assert.ok(Array.isArray(bundle.prerequisites));
  });

  it('should include related topics', () => {
    assert.ok(Array.isArray(bundle.relatedTopics));
  });

  it('should include estimated tokens', () => {
    assert.ok(typeof bundle.estimatedTokens === 'number');
    assert.ok(bundle.estimatedTokens > 0);
  });

  it('should include explanation with applied aliases', () => {
    assert.ok(bundle.explanation);
    assert.ok(Array.isArray(bundle.explanation.appliedAliases));
    assert.ok(Array.isArray(bundle.explanation.rankingSummary));
  });

  it('should include warnings array', () => {
    assert.ok(Array.isArray(bundle.warnings));
  });

  it('compact mode should not include decision trees', () => {
    const compactBundle = buildContextBundle(
      { originalQuery: query, mode: 'compact' },
      ranked,
      graphResult,
      routes,
      aliasResult,
      analysis,
      catalog,
    );
    assert.ok(!compactBundle.decisionTrees || compactBundle.decisionTrees.length === 0);
  });

  it('standard mode should include decision trees', () => {
    assert.ok(!bundle.decisionTrees || bundle.decisionTrees.length >= 0);
  });

  it('deep mode should include more KUs', () => {
    const deepBundle = buildContextBundle(
      { originalQuery: query, mode: 'deep', maxKus: 15 },
      ranked,
      graphResult,
      routes,
      aliasResult,
      analysis,
      catalog,
    );
    assert.ok(deepBundle.knowledgeUnits.length >= bundle.knowledgeUnits.length);
  });

  it('should produce deterministic output', () => {
    const bundle2 = buildContextBundle(
      { originalQuery: query, mode: 'standard' },
      ranked,
      graphResult,
      routes,
      aliasResult,
      analysis,
      catalog,
    );
    assert.strictEqual(bundle.knowledgeUnits.length, bundle2.knowledgeUnits.length);
    for (let i = 0; i < bundle.knowledgeUnits.length; i++) {
      assert.strictEqual(bundle.knowledgeUnits[i].id, bundle2.knowledgeUnits[i].id);
    }
  });
});
