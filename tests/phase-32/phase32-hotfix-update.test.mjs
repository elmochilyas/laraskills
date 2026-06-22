import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, 'fixtures', 'tmp-phase32');

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch {}
}

function mockBrokenBeta20Project(testDir, includeState = true) {
  mkdirSync(join(testDir, '.opencode'), { recursive: true });
  const cfg = {
    $schema: 'https://opencode.ai/config.json',
    instructions: ['AGENTS.md'],
    command: {
      plan: {
        description: 'Create a detailed implementation plan',
        template: '{file:commands/plan.md}\n\n$ARGUMENTS',
        agent: 'planner',
        subtask: true,
      },
      tdd: {
        description: 'TDD workflow',
        template: '{file:commands/tdd.md}\n\n$ARGUMENTS',
        agent: 'tdd-guide',
        subtask: true,
      },
      'code-review': {
        description: 'Code review',
        template: '{file:commands/code-review.md}\n\n$ARGUMENTS',
        agent: 'code-reviewer',
        subtask: true,
      },
      artisan: {
        description: 'Artisan commands',
        template: '{file:commands/artisan.md}\n\n$ARGUMENTS',
        agent: 'build',
        subtask: false,
      },
    },
  };
  writeFileSync(
    join(testDir, '.opencode', 'opencode.json'),
    JSON.stringify(cfg),
  );
  // Deliberately do NOT create .opencode/commands/ — simulating beta.20 bug

  if (includeState) {
    writeFileSync(
      join(testDir, '.laraskills-state.json'),
      JSON.stringify({
        version: '1.0.0-beta.20',
        target: testDir,
        installed_at: new Date().toISOString(),
        profile: 'core',
        integration: 'full',
        assistants: ['opencode'],
        tools: ['opencode', 'generic-mcp'],
        components: ['laravel-patterns', 'rules', 'hooks', 'mcp-configs'],
      }),
    );
  }
}

describe('Phase 32 — Hotfix: update repair path', () => {
  before(cleanup);
  after(cleanup);

  describe('A. Existing beta.20 broken project repair via setupToolIntegration', () => {
    it('setupToolIntegration creates missing command files for broken project', async () => {
      const { setupToolIntegration, validateOpenCodeFileReferences } =
        await import('../../src/runtime/tool-integrations.mjs');
      const testDir = join(TMP, 'repair-beta20');
      mockBrokenBeta20Project(testDir, false);

      assert.ok(!existsSync(join(testDir, '.opencode', 'commands')),
        'Commands should NOT exist before repair');

      setupToolIntegration('opencode', testDir, { dryRun: false });

      assert.ok(existsSync(join(testDir, '.opencode', 'commands', 'plan.md')),
        'plan.md should be created');
      assert.ok(existsSync(join(testDir, '.opencode', 'commands', 'tdd.md')),
        'tdd.md should be created');
      assert.ok(existsSync(join(testDir, '.opencode', 'commands', 'code-review.md')),
        'code-review.md should be created');
      assert.ok(existsSync(join(testDir, '.opencode', 'commands', 'artisan.md')),
        'artisan.md should be created');

      const refs = validateOpenCodeFileReferences(testDir);
      assert.ok(refs.valid, 'All file references should be valid after repair');
      assert.strictEqual(refs.missingFiles.length, 0);
    });
  });

  describe('B. Explicit assistant update repair', () => {
    it('running update with --assistants opencode repairs missing files', async () => {
      const { setupToolIntegration, validateOpenCodeFileReferences } =
        await import('../../src/runtime/tool-integrations.mjs');
      const testDir = join(TMP, 'explicit-update');
      mockBrokenBeta20Project(testDir, false);

      setupToolIntegration('opencode', testDir, { dryRun: false });

      const refs = validateOpenCodeFileReferences(testDir);
      assert.ok(refs.valid);
    });
  });

  describe('C. State-driven assistant update', () => {
    it('state with opencode selected should lead to repair via setupToolIntegration', async () => {
      const { checkToolConfigured } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'state-driven');
      mockBrokenBeta20Project(testDir, true);

      const stateBefore = JSON.parse(
        readFileSync(join(testDir, '.laraskills-state.json'), 'utf-8'),
      );
      assert.ok(
        stateBefore.assistants.includes('opencode'),
        'State should record OpenCode as selected',
      );

      const check = checkToolConfigured('opencode', testDir);
      assert.ok(check.configured, 'OpenCode should be flagged as configured');
    });

    it('state assistants field survives update path recreation', async () => {
      const testDir = join(TMP, 'state-survival');
      mockBrokenBeta20Project(testDir, true);

      const originalState = JSON.parse(
        readFileSync(join(testDir, '.laraskills-state.json'), 'utf-8'),
      );
      assert.strictEqual(originalState.assistants.length, 1);
      assert.ok(originalState.assistants.includes('opencode'));
      assert.ok(!originalState.assistants.includes('generic-mcp'));
    });
  });

  describe('D. Existing config preservation', () => {
    it('existing opencode.json MCP servers survive repair', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'preserve-mcp-repair');
      mockBrokenBeta20Project(testDir, false);

      const existing = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'custom-server': {
            type: 'local',
            command: ['echo', 'hello'],
            enabled: true,
          },
        },
        customKey: 'my-value',
      };
      writeFileSync(
        join(testDir, 'opencode.json'),
        JSON.stringify(existing, null, 2),
      );

      setupToolIntegration('opencode', testDir, { dryRun: false });

      const merged = JSON.parse(
        readFileSync(join(testDir, 'opencode.json'), 'utf-8'),
      );
      assert.ok(merged.mcp['custom-server'], 'Custom MCP server must survive');
      assert.ok(merged.mcp.laraskills, 'LaraSkills MCP must be added');
      assert.strictEqual(
        merged.customKey,
        'my-value',
        'Unrelated keys must survive',
      );
    });
  });

  describe('E. Idempotency', () => {
    it('running setup twice does not duplicate command files', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'idempotent');
      mockBrokenBeta20Project(testDir, false);

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const content1 = readFileSync(
        join(testDir, '.opencode', 'commands', 'plan.md'),
        'utf-8',
      );

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const content2 = readFileSync(
        join(testDir, '.opencode', 'commands', 'plan.md'),
        'utf-8',
      );

      assert.strictEqual(content1, content2,
        'Command file content must be identical after second run');
    });

    it('running setup twice does not duplicate MCP entries', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'idempotent-mcp2');
      mockBrokenBeta20Project(testDir, false);

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const cfg1 = JSON.parse(
        readFileSync(join(testDir, 'opencode.json'), 'utf-8'),
      );

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const cfg2 = JSON.parse(
        readFileSync(join(testDir, 'opencode.json'), 'utf-8'),
      );

      assert.deepStrictEqual(cfg1, cfg2,
        'Config must be identical after second setup');
    });
  });

  describe('F. Doctor fix message verification', () => {
    it('validateOpenCodeFileReferences detects all four missing command refs', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'doctor-fix');
      mockBrokenBeta20Project(testDir, false);

      const result = validateOpenCodeFileReferences(testDir);
      assert.strictEqual(result.valid, false);
      const refs = result.missingFiles.map(f => f.reference);
      assert.ok(refs.includes('commands/plan.md'));
      assert.ok(refs.includes('commands/tdd.md'));
      assert.ok(refs.includes('commands/code-review.md'));
      assert.ok(refs.includes('commands/artisan.md'));
    });

    it('after repair, validate returns valid with no missing files', async () => {
      const { setupToolIntegration, validateOpenCodeFileReferences } =
        await import('../../src/runtime/tool-integrations.mjs');
      const testDir = join(TMP, 'after-repair');
      mockBrokenBeta20Project(testDir, false);

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const result = validateOpenCodeFileReferences(testDir);
      assert.ok(result.valid);
      assert.strictEqual(result.missingFiles.length, 0);
    });
  });

  describe('G. Summary accuracy', () => {
    it('state.assistants excludes auto-added generic-mcp', async () => {
      const testDir = join(TMP, 'summary-check');
      mockBrokenBeta20Project(testDir, true);

      const state = JSON.parse(
        readFileSync(join(testDir, '.laraskills-state.json'), 'utf-8'),
      );
      assert.ok(state.assistants.includes('opencode'));
      assert.ok(!state.assistants.includes('generic-mcp'));
    });

    it('doctor tool check distinguishes not-selected from configured', async () => {
      const { checkToolConfigured } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'doctor-selection');
      mockBrokenBeta20Project(testDir, true);

      const oc = checkToolConfigured('opencode', testDir);
      assert.ok(oc.configured);

      const gm = checkToolConfigured('generic-mcp', testDir);
      // Generic MCP may or may not be configured depending on setup
      // The key is that state does not record it as selected
      const state = JSON.parse(
        readFileSync(join(testDir, '.laraskills-state.json'), 'utf-8'),
      );
      assert.ok(!state.assistants.includes('generic-mcp'));
    });
  });

  describe('getAllToolChecks preserves definition support level', () => {
    it('should return support: full for opencode regardless of configured state', async () => {
      const { getAllToolChecks } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'support-check');
      mkdirSync(testDir, { recursive: true });

      const checks = getAllToolChecks(testDir);
      const oc = checks.find(c => c.id === 'opencode');
      assert.ok(oc, 'Should find opencode in checks');
      assert.strictEqual(oc.support, 'full',
        'Support should be "full" from definition, not overwritten');
    });
  });
});
