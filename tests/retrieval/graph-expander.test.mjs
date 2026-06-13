import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import { expandGraph } from '../../src/retrieval/graph-expander.mjs';

describe('Graph Expander', () => {
  let catalog;

  before(() => {
    catalog = loadCatalog(LARASKILLS_ROOT);
  });

  it('should return prerequisites for a KU', () => {
    const topIds = [...catalog.knowledgeUnits.keys()].slice(0, 3);
    const result = expandGraph(catalog, topIds, {
      prerequisiteDepth: 1,
      relatedDepth: 0,
      maxPrerequisites: 10,
      maxRelated: 0,
    });

    assert.ok(Array.isArray(result.prerequisites));
    assert.ok(result.totalPrerequisitesFound >= 0);
  });

  it('should return related topics for a KU', () => {
    const topIds = [...catalog.knowledgeUnits.keys()].slice(0, 3);
    const result = expandGraph(catalog, topIds, {
      prerequisiteDepth: 0,
      relatedDepth: 1,
      maxPrerequisites: 0,
      maxRelated: 10,
    });

    assert.ok(Array.isArray(result.relatedTopics));
    assert.ok(result.totalRelatedFound >= 0);
  });

  it('should respect maxPrerequisites limit', () => {
    const topIds = [...catalog.knowledgeUnits.keys()].slice(0, 5);
    const result = expandGraph(catalog, topIds, {
      prerequisiteDepth: 2,
      relatedDepth: 0,
      maxPrerequisites: 3,
      maxRelated: 0,
    });

    assert.ok(result.prerequisites.length <= 3);
  });

  it('should respect maxRelated limit', () => {
    const topIds = [...catalog.knowledgeUnits.keys()].slice(0, 5);
    const result = expandGraph(catalog, topIds, {
      prerequisiteDepth: 0,
      relatedDepth: 2,
      maxPrerequisites: 0,
      maxRelated: 3,
    });

    assert.ok(result.relatedTopics.length <= 3);
  });

  it('should not produce cycles (no infinite recursion)', () => {
    const allIds = [...catalog.knowledgeUnits.keys()];
    const sample = allIds.slice(0, 10);
    const result = expandGraph(catalog, sample, {
      prerequisiteDepth: 5,
      relatedDepth: 5,
      maxPrerequisites: 50,
      maxRelated: 50,
    });

    const visited = new Set();
    for (const p of result.prerequisites) {
      assert.ok(!visited.has(p.id), `Cycle detected: ${p.id} appeared twice`);
      visited.add(p.id);
    }
  });

  it('should deduplicate expanded nodes', () => {
    const topIds = [...catalog.knowledgeUnits.keys()].slice(0, 5);
    const result = expandGraph(catalog, topIds, {
      prerequisiteDepth: 2,
      relatedDepth: 2,
      maxPrerequisites: 100,
      maxRelated: 100,
    });

    const preIds = result.prerequisites.map(p => p.id);
    const uniquePreIds = new Set(preIds);
    assert.strictEqual(preIds.length, uniquePreIds.size, 'Prerequisites should be deduplicated');

    const relIds = result.relatedTopics.map(r => r.id);
    const uniqueRelIds = new Set(relIds);
    assert.strictEqual(relIds.length, uniqueRelIds.size, 'Related topics should be deduplicated');
  });

  it('should provide reason for each expanded node', () => {
    const topIds = [...catalog.knowledgeUnits.keys()].slice(0, 5);
    const result = expandGraph(catalog, topIds, {
      prerequisiteDepth: 1,
      relatedDepth: 1,
      maxPrerequisites: 10,
      maxRelated: 10,
    });

    for (const p of result.prerequisites) {
      assert.ok(p.reason, `Prerequisite ${p.id} should have a reason`);
    }
    for (const r of result.relatedTopics) {
      assert.ok(r.reason, `Related topic ${r.id} should have a reason`);
    }
  });

  it('should handle empty KU list gracefully', () => {
    const result = expandGraph(catalog, [], {
      prerequisiteDepth: 1,
      relatedDepth: 1,
      maxPrerequisites: 10,
      maxRelated: 10,
    });

    assert.strictEqual(result.prerequisites.length, 0);
    assert.strictEqual(result.relatedTopics.length, 0);
  });
});
