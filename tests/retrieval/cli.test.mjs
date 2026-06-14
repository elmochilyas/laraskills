import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

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
    bundle = retrieveAndFormat('Build a REST API', { mode: 'compact', format: 'markdown', eccRoot: LARASKILLS_ROOT });
  });

  it('retrieve command should produce Markdown output', () => {
    assert.ok(typeof bundle === 'string');
    assert.ok(bundle.includes('LaraSkills Context Bundle'));
    assert.ok(bundle.includes('Build a REST API'));
  });

  it('retrieve command should produce JSON output', () => {
    const jsonOutput = retrieveAndFormat('Sanctum auth', { mode: 'compact', format: 'json', eccRoot: LARASKILLS_ROOT });
    const parsed = JSON.parse(jsonOutput);
    assert.ok(parsed.query);
    assert.ok(parsed.selectedDomains);
    assert.ok(parsed.knowledgeUnits);
  });

  it('search command should return results', () => {
    const results = searchKnowledge('Eloquent relationships', { eccRoot: LARASKILLS_ROOT, limit: 10 });
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
    assert.ok(results[0].id);
    assert.ok(typeof results[0].score === 'number');
  });

  it('search command should respect limit', () => {
    const results = searchKnowledge('database', { eccRoot: LARASKILLS_ROOT, limit: 5 });
    assert.ok(results.length <= 5);
  });

  it('search command should filter by domain', () => {
    const results = searchKnowledge('security', { eccRoot: LARASKILLS_ROOT, limit: 100, domain: 'security-identity-engineering' });
    if (results.length > 0) {
      for (const r of results) {
        assert.strictEqual(r.ku.domain, 'security-identity-engineering');
      }
    }
  });

  it('should prioritize policy guidance for the Phase 17 archive task', () => {
    const task = 'Add note archiving to an existing Laravel project with an Eloquent policy, nullable archived_at timestamp, Blade archive action, and Pest feature tests for owner authorization and forbidden cross-user access';
    for (const mode of ['compact', 'standard']) {
      const result = retrieveContext(task, {
        eccRoot: LARASKILLS_ROOT,
        mode,
      });

      assert.strictEqual(
        result.bundle.knowledgeUnits[0].id,
        'security-identity-engineering/authorization/policies-model',
        `${mode} mode should rank policy guidance first`,
      );
      assert.notStrictEqual(
        result.bundle.knowledgeUnits[0].id,
        'data-storage-systems/replication/laravel-read-write-config',
      );
    }
  });

  it('get command should retrieve KU metadata', () => {
    const firstKu = [...bundle][0] || null;
    const testId = 'ai-intelligence-systems/agentic-workflows/01';
    const result = getKnowledgeUnit(testId, { eccRoot: LARASKILLS_ROOT });
    assert.ok(result);
    assert.ok(result.metadata);
    assert.strictEqual(result.metadata.id, testId);
    assert.ok(result.detail);
  });

  it('get --include-content should print standardized knowledge for a canonical ID', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [
      cliPath,
      'get',
      'security-identity-engineering/authorization/policies-model',
      '--include-content',
      '--laraskills-root',
      LARASKILLS_ROOT,
    ], { encoding: 'utf8' });

    assert.ok(output.includes('## Standardized Knowledge'));
    assert.ok(output.includes('Policies are classes that organize authorization logic'));
  });

  it('get command should return null for unknown KU', () => {
    const result = getKnowledgeUnit('nonexistent/ku/id', { eccRoot: LARASKILLS_ROOT });
    assert.strictEqual(result, null);
  });

  it('prerequisites command should return dependencies', () => {
    const firstKu = 'ai-intelligence-systems/agentic-workflows/01';
    const results = getPrerequisites(firstKu, { depth: 1, limit: 10, eccRoot: LARASKILLS_ROOT });
    assert.ok(Array.isArray(results));
  });

  it('related command should return relationships', () => {
    const firstKu = 'ai-intelligence-systems/agentic-workflows/01';
    const results = getRelatedTopics(firstKu, { depth: 1, limit: 10, eccRoot: LARASKILLS_ROOT });
    assert.ok(Array.isArray(results));
  });

  it('validate command should check intelligence layer', () => {
    const results = validateIntelligence({ eccRoot: LARASKILLS_ROOT });
    assert.ok(typeof results.valid === 'boolean');
    assert.ok(typeof results.knowledgeUnitCount === 'number');
    assert.ok(typeof results.dependencyEdgeCount === 'number');
    assert.ok(typeof results.relationshipEdgeCount === 'number');
    assert.ok(Array.isArray(results.issues));
    assert.ok(results.knowledgeUnitCount > 0);
  });

  it('retrieveContext should return bundle and explanation', () => {
    const result = retrieveContext('Fix N+1 query', { eccRoot: LARASKILLS_ROOT, mode: 'standard' });
    assert.ok(result.bundle);
    assert.ok(result.explanation);
    assert.ok(result.bundle.query === 'Fix N+1 query');
    assert.ok(result.bundle.knowledgeUnits.length > 0);
  });
});
