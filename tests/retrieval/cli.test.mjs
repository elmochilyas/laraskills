import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

  it('core commands should show subcommand help without executing', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const target = mkdtempSync(join(tmpdir(), 'laraskills-help-'));
    const commands = ['install', 'doctor', 'validate', 'retrieve', 'search', 'get'];

    try {
      for (const command of commands) {
        const output = execFileSync(process.execPath, [cliPath, command, '--help'], {
          cwd: target,
          encoding: 'utf8',
        });

        assert.ok(output.includes(`Usage: laraskills ${command}`));
      }

      assert.strictEqual(existsSync(join(target, '.laraskills-state.json')), false);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
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

  // Phase 23: CLI UX tests
  it('laraskills -v should print version', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, '-v'], { encoding: 'utf8' });
    assert.ok(output.includes('LaraSkills v'));
  });

  it('laraskills --version should print version', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, '--version'], { encoding: 'utf8' });
    assert.ok(output.includes('LaraSkills v'));
  });

  it('root --help should include init in project commands', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' });
    assert.ok(output.includes('init'));
  });

  it('root --help should include update in project commands', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' });
    assert.ok(output.includes('update'));
  });

  it('root --help should explain quick start flow (global install, setup, init, retrieve)', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' });
    assert.ok(output.includes('npm install -g laraskills'));
    assert.ok(output.includes('setup'));
    assert.ok(output.includes('init'));
    assert.ok(output.includes('retrieve'));
  });

  it('root --help should not over-emphasize deprecated ECC names', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' });
    // The help should not prominently feature ECC in main command names
    const eccRootLines = output.split('\n').filter(l => l.includes('ecc-root'));
    assert.ok(eccRootLines.length <= 1, 'ECC references should be minimal in root help');
  });

  it('init --help should show purpose, usage, profiles, and example', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, 'init', '--help'], { encoding: 'utf8' });
    assert.ok(output.includes('Usage:'));
    assert.ok(output.includes('profiles') || output.includes('Profiles'));
    assert.ok(output.includes('minimal'));
    assert.ok(output.includes('core'));
    assert.ok(output.includes('full'));
    assert.ok(output.includes('init'));
  });

  it('update --help should clarify CLI update vs project update', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const output = execFileSync(process.execPath, [cliPath, 'update', '--help'], { encoding: 'utf8' });
    assert.ok(output.includes('Usage:'));
    assert.ok(output.includes('CLI package'));
  });

  it('all subcommand --help should show Usage: without executing', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const target = mkdtempSync(join(tmpdir(), 'laraskills-help-all-'));
    const commands = ['setup', 'doctor', 'init', 'install', 'update', 'add', 'retrieve', 'search', 'get', 'validate', 'prerequisites', 'related'];

    try {
      for (const command of commands) {
        const output = execFileSync(process.execPath, [cliPath, command, '--help'], {
          cwd: target,
          encoding: 'utf8',
        });

        assert.ok(output.includes('Usage:'), `${command} --help should include Usage:`);
      }

      assert.strictEqual(existsSync(join(target, '.laraskills-state.json')), false,
        'No state file should be created by --help');
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });

  it('init --profile core should create expected files', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const target = mkdtempSync(join(tmpdir(), 'laraskills-init-core-'));

    try {
      execFileSync(process.execPath, [cliPath, 'init', '--profile', 'core', '--tools', 'opencode,generic-mcp', '--yes'], {
        cwd: target,
        encoding: 'utf8',
      });

      assert.ok(existsSync(join(target, '.laraskills-state.json')), 'State file should exist');
      assert.ok(existsSync(join(target, 'skills')), 'Skills directory should exist');
      assert.ok(existsSync(join(target, 'rules')), 'Rules directory should exist');
      assert.ok(existsSync(join(target, 'agents')), 'Agents directory should exist');

      const state = JSON.parse(readFileSync(join(target, '.laraskills-state.json'), 'utf-8'));
      assert.strictEqual(state.profile, 'core');
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });

  it('install --profile core should still work for backward compatibility', () => {
    const cliPath = join(LARASKILLS_ROOT, 'scripts', 'laraskills.mjs');
    const target = mkdtempSync(join(tmpdir(), 'laraskills-install-core-'));

    try {
      const output = execFileSync(process.execPath, [cliPath, 'install', '--profile', 'core'], {
        cwd: target,
        encoding: 'utf8',
      });

      assert.ok(existsSync(join(target, '.laraskills-state.json')), 'State file should exist');
      assert.ok(existsSync(join(target, 'skills')), 'Skills directory should exist');

      const state = JSON.parse(readFileSync(join(target, '.laraskills-state.json'), 'utf-8'));
      assert.strictEqual(state.profile, 'core');

      // Should show tip about init
      assert.ok(output.includes('init'), 'Install should mention init as recommended');
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });
});
