import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ECC_ROOT = join(__dirname, '..', '..');

import {
  retrieveContext,
  searchKnowledge,
  getKnowledgeUnit,
  getPrerequisites,
  getRelatedTopics,
  validateIntelligence,
  retrieveAndFormat,
} from '../../src/retrieval/index.mjs';

describe('CLI Integration Smoke Tests', () => {
  let bundle;

  before(() => {
    bundle = retrieveAndFormat('Build a REST API', { mode: 'compact', format: 'markdown', eccRoot: ECC_ROOT });
  });

  it('retrieve command should produce Markdown output', () => {
    assert.ok(typeof bundle === 'string');
    assert.ok(bundle.includes('ECC Context Bundle'));
    assert.ok(bundle.includes('Build a REST API'));
  });

  it('retrieve command should produce JSON output', () => {
    const jsonOutput = retrieveAndFormat('Sanctum auth', { mode: 'compact', format: 'json', eccRoot: ECC_ROOT });
    const parsed = JSON.parse(jsonOutput);
    assert.ok(parsed.query);
    assert.ok(parsed.selectedDomains);
    assert.ok(parsed.knowledgeUnits);
  });

  it('search command should return results', () => {
    const results = searchKnowledge('Eloquent relationships', { eccRoot: ECC_ROOT, limit: 10 });
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
    assert.ok(results[0].id);
    assert.ok(typeof results[0].score === 'number');
  });

  it('search command should respect limit', () => {
    const results = searchKnowledge('database', { eccRoot: ECC_ROOT, limit: 5 });
    assert.ok(results.length <= 5);
  });

  it('search command should filter by domain', () => {
    const results = searchKnowledge('security', { eccRoot: ECC_ROOT, limit: 100, domain: 'security-identity-engineering' });
    if (results.length > 0) {
      for (const r of results) {
        assert.strictEqual(r.ku.domain, 'security-identity-engineering');
      }
    }
  });

  it('get command should retrieve KU metadata', () => {
    const firstKu = [...bundle][0] || null;
    const testId = 'ai-intelligence-systems/agentic-workflows/01';
    const result = getKnowledgeUnit(testId, { eccRoot: ECC_ROOT });
    assert.ok(result);
    assert.ok(result.metadata);
    assert.strictEqual(result.metadata.id, testId);
    assert.ok(result.detail);
  });

  it('get command should return null for unknown KU', () => {
    const result = getKnowledgeUnit('nonexistent/ku/id', { eccRoot: ECC_ROOT });
    assert.strictEqual(result, null);
  });

  it('prerequisites command should return dependencies', () => {
    const firstKu = 'ai-intelligence-systems/agentic-workflows/01';
    const results = getPrerequisites(firstKu, { depth: 1, limit: 10, eccRoot: ECC_ROOT });
    assert.ok(Array.isArray(results));
  });

  it('related command should return relationships', () => {
    const firstKu = 'ai-intelligence-systems/agentic-workflows/01';
    const results = getRelatedTopics(firstKu, { depth: 1, limit: 10, eccRoot: ECC_ROOT });
    assert.ok(Array.isArray(results));
  });

  it('validate command should check intelligence layer', () => {
    const results = validateIntelligence({ eccRoot: ECC_ROOT });
    assert.ok(typeof results.valid === 'boolean');
    assert.ok(typeof results.knowledgeUnitCount === 'number');
    assert.ok(typeof results.dependencyEdgeCount === 'number');
    assert.ok(typeof results.relationshipEdgeCount === 'number');
    assert.ok(Array.isArray(results.issues));
    assert.ok(results.knowledgeUnitCount > 0);
  });

  it('retrieveContext should return bundle and explanation', () => {
    const result = retrieveContext('Fix N+1 query', { eccRoot: ECC_ROOT, mode: 'standard' });
    assert.ok(result.bundle);
    assert.ok(result.explanation);
    assert.ok(result.bundle.query === 'Fix N+1 query');
    assert.ok(result.bundle.knowledgeUnits.length > 0);
  });
});
