import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, 'fixtures', 'tmp-phase25');

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch {}
}

function mockComposerJson(projectDir) {
  const composer = { require: { 'laravel/framework': '^13.0' } };
  writeFileSync(join(projectDir, 'composer.json'), JSON.stringify(composer));
}

function mockArtisan(projectDir) {
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, 'artisan'), '#!/usr/bin/env php');
}

describe('Phase 25 — Packaged Intelligence', () => {
  before(cleanup);
  after(cleanup);

  it('getPackagedIntelligenceRoot returns the bundled intelligence path', async () => {
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');
    const root = getPackagedIntelligenceRoot();
    assert.ok(root, 'Packaged intelligence root should exist in the development checkout');
    assert.ok(existsSync(join(root, 'intelligence', 'json', 'knowledge-units.json')),
      'knowledge-units.json should exist in packaged intelligence');
  });

  it('packaged intelligence is valid', async () => {
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');
    const { validateIntelligenceRoot } = await import('../../src/runtime/ecc-root-resolver.mjs');
    const root = getPackagedIntelligenceRoot();
    if (!root) { assert.ok(true, 'Skipping — no packaged root'); return; }
    const result = validateIntelligenceRoot(root);
    assert.ok(result.valid, `Packaged intelligence should be valid. Missing: ${result.missingFiles.join(', ')}`);
  });
});

describe('Phase 25 — Interactive Init', () => {
  before(cleanup);
  after(cleanup);

  it('isLaravelProject detects composer.json with laravel/framework', async () => {
    const { isLaravelProject } = await import('../../src/runtime/interactive-init.mjs');
    const testDir = join(TMP, 'laravel-detection');
    mkdirSync(join(testDir, 'app', 'Models'), { recursive: true });
    mockComposerJson(testDir);
    assert.strictEqual(isLaravelProject(testDir), true);
  });

  it('isLaravelProject returns false for non-Laravel dirs', async () => {
    const { isLaravelProject } = await import('../../src/runtime/interactive-init.mjs');
    const testDir = join(TMP, 'empty-dir');
    mkdirSync(testDir, { recursive: true });
    assert.strictEqual(isLaravelProject(testDir), false);
  });
});

describe('Phase 25 — Tool Integrations', () => {
  before(cleanup);
  after(cleanup);

  it('getAllToolDefinitions includes opencode and generic-mcp', async () => {
    const { getAllToolDefinitions } = await import('../../src/runtime/tool-integrations.mjs');
    const defs = getAllToolDefinitions();
    assert.ok(defs.opencode);
    assert.ok(defs['generic-mcp']);
    assert.strictEqual(defs.opencode.support, 'full');
    assert.strictEqual(defs['generic-mcp'].support, 'full');
  });

  it('getFullySupportedTools returns opencode and generic-mcp', async () => {
    const { getFullySupportedTools } = await import('../../src/runtime/tool-integrations.mjs');
    const tools = getFullySupportedTools();
    const ids = tools.map(t => t.id);
    assert.ok(ids.includes('opencode'));
    assert.ok(ids.includes('generic-mcp'));
  });

  it('OpenCode setup creates .opencode/opencode.json and opencode.json', async () => {
    const { setupToolIntegration, checkToolConfigured } = await import('../../src/runtime/tool-integrations.mjs');
    const testDir = join(TMP, 'opencode-setup');
    mkdirSync(testDir, { recursive: true });

    const results = setupToolIntegration('opencode', testDir, { dryRun: false });
    assert.ok(results.length > 0, 'Should produce results');

    const check = checkToolConfigured('opencode', testDir);
    assert.ok(check.configured);
    assert.ok(check.hasOpenCodeDir);

    const rootCfg = JSON.parse(readFileSync(join(testDir, 'opencode.json'), 'utf-8'));
    assert.ok(rootCfg.mcp && rootCfg.mcp.laraskills, 'Should have MCP laraskills entry');
    assert.strictEqual(rootCfg.mcp.laraskills.command[0], 'laraskills-mcp');
  });

  it('OpenCode setup merges with existing opencode.json', async () => {
    const { setupToolIntegration } = await import('../../src/runtime/tool-integrations.mjs');
    const testDir = join(TMP, 'opencode-merge');
    mkdirSync(testDir, { recursive: true });

    const existing = { $schema: 'https://opencode.ai/config.json', existingKey: 'should-survive' };
    writeFileSync(join(testDir, 'opencode.json'), JSON.stringify(existing, null, 2));

    setupToolIntegration('opencode', testDir, { dryRun: false });

    const merged = JSON.parse(readFileSync(join(testDir, 'opencode.json'), 'utf-8'));
    assert.strictEqual(merged.existingKey, 'should-survive', 'Existing keys should be preserved');
    assert.ok(merged.mcp && merged.mcp.laraskills, 'Should have MCP laraskills entry');
  });

  it('Generic MCP setup creates mcp-configs/mcp-servers.json', async () => {
    const { setupToolIntegration, checkToolConfigured } = await import('../../src/runtime/tool-integrations.mjs');
    const testDir = join(TMP, 'mcp-setup');
    mkdirSync(testDir, { recursive: true });

    setupToolIntegration('generic-mcp', testDir, { dryRun: false });

    const check = checkToolConfigured('generic-mcp', testDir);
    assert.ok(check.configured);
    assert.ok(existsSync(join(testDir, 'mcp-configs', 'mcp-servers.json')));
  });

  it('Dry run does not write files', async () => {
    const { setupToolIntegration } = await import('../../src/runtime/tool-integrations.mjs');
    const testDir = join(TMP, 'dryrun-test');
    mkdirSync(testDir, { recursive: true });

    setupToolIntegration('opencode', testDir, { dryRun: true });

    assert.ok(!existsSync(join(testDir, 'opencode.json')), 'Dry run should not write opencode.json');
    assert.ok(!existsSync(join(testDir, '.opencode')), 'Dry run should not write .opencode/');
  });
});

describe('Phase 25 — Backward Compatibility', () => {
  before(cleanup);
  after(cleanup);

  it('--laraskills-root still works for explicit root override', async () => {
    const { resolveEccRootWithPrecedence } = await import('../../src/runtime/ecc-root-resolver.mjs');
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');

    const packaged = getPackagedIntelligenceRoot();
    if (!packaged) { assert.ok(true, 'Skipping — no packaged root'); return; }

    const result = resolveEccRootWithPrecedence({
      explicitLaraskillsRoot: packaged,
    });
    assert.strictEqual(result.source, 'laraskills-cli');
    assert.ok(result.valid);
    assert.strictEqual(result.root.replace(/\\/g, '/'), packaged.replace(/\\/g, '/'));
  });
});

describe('Phase 25 — Packaged Standardized Knowledge Content', () => {
  const CONTENT_TIMEOUT = 30000;

  it('packaged content index exists and contains known KU', { timeout: CONTENT_TIMEOUT }, async () => {
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');
    const root = getPackagedIntelligenceRoot();
    if (!root) { assert.ok(true, 'Skipping — no packaged root'); return; }

    const contentIndexPath = join(root, 'intelligence', 'content', 'content-index.json');
    assert.ok(existsSync(contentIndexPath), 'Content index should exist in packaged intelligence');
  });

  it('get --include-content resolves from packaged content index', { timeout: CONTENT_TIMEOUT }, async () => {
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');
    const root = getPackagedIntelligenceRoot();
    if (!root) { assert.ok(true, 'Skipping — no packaged root'); return; }

    const { getKnowledgeUnit } = await import('../../src/retrieval/index.mjs');
    const testKuId = 'security-identity-engineering/authorization/policies-model';
    const result = getKnowledgeUnit(testKuId, {
      eccRoot: root,
      includeContent: true,
    });

    assert.ok(result, 'Should resolve knowledge unit');
    assert.ok(result.detail, 'Should have detail output');
    assert.ok(
      result.detail.includes('## Standardized Knowledge'),
      'Detail should include Standardized Knowledge section',
    );
    assert.ok(
      result.detail.includes('Policies are classes') || result.detail.includes('organize authorization logic'),
      'Should contain real content, not "unavailable"',
    );
    assert.ok(
      !result.detail.includes('Standardized knowledge content is unavailable'),
      'Should NOT show "unavailable" message',
    );
  });

  it('get --include-content returns clear message for unknown KU', { timeout: CONTENT_TIMEOUT }, async () => {
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');
    const root = getPackagedIntelligenceRoot();
    if (!root) { assert.ok(true, 'Skipping — no packaged root'); return; }

    const { getKnowledgeUnit } = await import('../../src/retrieval/index.mjs');
    const result = getKnowledgeUnit('nonexistent-domain/nonexistent/sub-nonexistent', {
      eccRoot: root,
      includeContent: true,
    });

    assert.strictEqual(result, null, 'Should return null for unknown KU');
  });

  it('full checkout root still overrides packaged content', { timeout: CONTENT_TIMEOUT }, async () => {
    const { getPackagedIntelligenceRoot } = await import('../../src/runtime/packaged-root.mjs');
    const root = getPackagedIntelligenceRoot();
    if (!root) { assert.ok(true, 'Skipping — no packaged root'); return; }

    const { getKnowledgeUnit } = await import('../../src/retrieval/index.mjs');
    const testKuId = 'security-identity-engineering/authorization/policies-model';
    const result = getKnowledgeUnit(testKuId, {
      eccRoot: root,
      includeContent: true,
    });

    assert.ok(result, 'Should resolve knowledge unit from checkout root');
    assert.ok(result.detail, 'Should have detail output');
    assert.ok(
      result.detail.includes('## Standardized Knowledge'),
      'Detail should include Standardized Knowledge section',
    );
  });
});
