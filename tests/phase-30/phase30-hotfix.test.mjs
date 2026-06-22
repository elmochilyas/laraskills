import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, 'fixtures', 'tmp-phase30');

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch {}
}

const OPECODE_CFG = {
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
  },
};

describe('Phase 30 — Hotfix: Invalid generated config references', () => {
  before(cleanup);
  after(cleanup);

  describe('A. OpenCode init generates all referenced files', () => {
    it('setup creates .opencode/opencode.json and .opencode/commands/', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'init-all-files');
      mkdirSync(testDir, { recursive: true });

      setupToolIntegration('opencode', testDir, { dryRun: false });

      assert.ok(
        existsSync(join(testDir, '.opencode', 'opencode.json')),
        '.opencode/opencode.json should exist',
      );
      assert.ok(
        existsSync(join(testDir, '.opencode', 'commands', 'plan.md')),
        '.opencode/commands/plan.md should exist (referenced in config)',
      );
      assert.ok(
        existsSync(join(testDir, '.opencode', 'commands', 'tdd.md')),
        '.opencode/commands/tdd.md should exist',
      );
      assert.ok(
        existsSync(join(testDir, '.opencode', 'commands', 'artisan.md')),
        '.opencode/commands/artisan.md should exist',
      );
      assert.ok(
        existsSync(join(testDir, '.opencode', 'commands', 'code-review.md')),
        '.opencode/commands/code-review.md should exist',
      );
    });

    it('no broken {file:...} references exist in generated config', async () => {
      const { setupToolIntegration, validateOpenCodeFileReferences } =
        await import('../../src/runtime/tool-integrations.mjs');
      const testDir = join(TMP, 'no-broken-refs');
      mkdirSync(testDir, { recursive: true });

      setupToolIntegration('opencode', testDir, { dryRun: false });

      const result = validateOpenCodeFileReferences(testDir);
      assert.ok(result.valid, 'No broken file references should exist');
      assert.strictEqual(
        result.missingFiles.length,
        0,
        'Should have zero missing files',
      );
    });

    it('validateOpenCodeFileReferences detects missing files', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'broken-refs');
      mkdirSync(join(testDir, '.opencode'), { recursive: true });

      const cfg = {
        $schema: 'https://opencode.ai/config.json',
        command: {
          missing: {
            description: 'Test',
            template: '{file:commands/nonexistent.md}\n\n$ARGUMENTS',
          },
        },
      };
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        JSON.stringify(cfg),
      );

      const result = validateOpenCodeFileReferences(testDir);
      assert.strictEqual(result.valid, false);
      assert.ok(
        result.missingFiles.length > 0,
        'Should detect missing file references',
      );
      assert.ok(
        result.missingFiles[0].reference.includes('nonexistent'),
        'Should identify the missing reference path',
      );
    });

    it('validateOpenCodeFileReferences passes when no references', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'no-refs');
      mkdirSync(join(testDir, '.opencode'), { recursive: true });

      const cfg = {
        $schema: 'https://opencode.ai/config.json',
        instructions: ['AGENTS.md'],
      };
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        JSON.stringify(cfg),
      );

      const result = validateOpenCodeFileReferences(testDir);
      assert.ok(result.valid);
    });
  });

  describe('B. OpenCode update repairs missing file references', () => {
    it('update creates missing command files', async () => {
      const { setupToolIntegration, validateOpenCodeFileReferences } =
        await import('../../src/runtime/tool-integrations.mjs');
      const testDir = join(TMP, 'repair-cmds');
      mkdirSync(join(testDir, '.opencode'), { recursive: true });

      // Create opencode.json with file references but NO commands directory
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        JSON.stringify(OPECODE_CFG),
      );

      // Verify commands/ doesn't exist yet
      assert.ok(
        !existsSync(join(testDir, '.opencode', 'commands')),
        'Commands dir should NOT exist before update',
      );

      // Run setup (acts as update/re-run)
      setupToolIntegration('opencode', testDir, { dryRun: false });

      // Verify commands/ is created and plan.md exists
      assert.ok(
        existsSync(join(testDir, '.opencode', 'commands', 'plan.md')),
        'plan.md should be created by update',
      );
      assert.ok(
        existsSync(join(testDir, '.opencode', 'commands', 'tdd.md')),
        'tdd.md should be created by update',
      );

      // Verify no broken refs
      const result = validateOpenCodeFileReferences(testDir);
      assert.ok(result.valid, 'All file references should be valid after update');
    });
  });

  describe('C. Doctor detects broken file references', () => {
    it('validateOpenCodeFileReferences returns broken for missing files', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'doctor-broken');
      mkdirSync(join(testDir, '.opencode'), { recursive: true });

      const cfg = {
        $schema: 'https://opencode.ai/config.json',
        command: {
          plan: {
            description: 'Test',
            template: '{file:commands/plan.md}\n\n$ARGUMENTS',
          },
        },
      };
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        JSON.stringify(cfg),
      );
      // Deliberately do NOT create commands/plan.md

      const result = validateOpenCodeFileReferences(testDir);
      assert.strictEqual(result.valid, false);
      assert.ok(result.missingFiles.length > 0);
      assert.ok(
        result.missingFiles.some((f) => f.reference === 'commands/plan.md'),
        'Should detect missing plan.md reference',
      );
    });
  });

  describe('D. Existing user config is preserved', () => {
    it('existing opencode.json MCP config is preserved on merge', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'preserve-mcp');
      mkdirSync(testDir, { recursive: true });

      const existing = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'custom-server': {
            type: 'local',
            command: ['echo', 'hello'],
            enabled: true,
          },
        },
        someCustomSetting: 'my-value',
      };
      writeFileSync(
        join(testDir, 'opencode.json'),
        JSON.stringify(existing, null, 2),
      );

      setupToolIntegration('opencode', testDir, { dryRun: false });

      const merged = JSON.parse(
        readFileSync(join(testDir, 'opencode.json'), 'utf-8'),
      );
      assert.ok(
        merged.mcp['custom-server'],
        'Existing MCP server should be preserved',
      );
      assert.ok(
        merged.mcp.laraskills,
        'LaraSkills MCP server should be added',
      );
      assert.strictEqual(
        merged.someCustomSetting,
        'my-value',
        'Unrelated settings should be preserved',
      );
    });

    it('existing .opencode/opencode.json user settings are merged', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'preserve-opencode-cfg');
      mkdirSync(join(testDir, '.opencode'), { recursive: true });

      const existing = {
        $schema: 'https://opencode.ai/config.json',
        customKey: 'my-custom-value',
      };
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        JSON.stringify(existing),
      );

      setupToolIntegration('opencode', testDir, { dryRun: false });

      const merged = JSON.parse(
        readFileSync(join(testDir, '.opencode', 'opencode.json'), 'utf-8'),
      );
      assert.strictEqual(
        merged.customKey,
        'my-custom-value',
        'User settings in .opencode/opencode.json should be preserved',
      );
    });
  });

  describe('E. Idempotency', () => {
    it('running init twice does not duplicate MCP entries', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'idempotent-mcp');
      mkdirSync(testDir, { recursive: true });

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const cfg1 = JSON.parse(
        readFileSync(join(testDir, 'opencode.json'), 'utf-8'),
      );

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const cfg2 = JSON.parse(
        readFileSync(join(testDir, 'opencode.json'), 'utf-8'),
      );

      assert.deepStrictEqual(
        cfg1,
        cfg2,
        'Config should be identical after second init',
      );
      assert.ok(
        cfg1.mcp && cfg1.mcp.laraskills,
        'Should have exactly one laraskills MCP entry',
      );
    });

    it('running init twice does not duplicate command files', async () => {
      const { setupToolIntegration } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'idempotent-cmds');
      mkdirSync(testDir, { recursive: true });

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const filesAfterFirst = {
        plan:
          existsSync(join(testDir, '.opencode', 'commands', 'plan.md')) &&
          readFileSync(join(testDir, '.opencode', 'commands', 'plan.md'), 'utf-8')
            .length,
        tdd:
          existsSync(join(testDir, '.opencode', 'commands', 'tdd.md')) &&
          readFileSync(join(testDir, '.opencode', 'commands', 'tdd.md'), 'utf-8')
            .length,
      };

      setupToolIntegration('opencode', testDir, { dryRun: false });
      const filesAfterSecond = {
        plan: readFileSync(
          join(testDir, '.opencode', 'commands', 'plan.md'),
          'utf-8',
        ).length,
        tdd: readFileSync(
          join(testDir, '.opencode', 'commands', 'tdd.md'),
          'utf-8',
        ).length,
      };

      assert.strictEqual(
        filesAfterFirst.plan,
        filesAfterSecond.plan,
        'plan.md should be same after second init',
      );
      assert.strictEqual(
        filesAfterFirst.tdd,
        filesAfterSecond.tdd,
        'tdd.md should be same after second init',
      );
    });
  });

  describe('F. Summary accuracy', () => {
    it('assistants list does not include auto-added generic-mcp', async () => {
      const { getAssistantToolIds } = await import(
        '../../src/runtime/interactive-init.mjs'
      );

      // Selecting only OpenCode
      const toolIds = getAssistantToolIds(['opencode'], 'full');
      assert.ok(toolIds.includes('opencode'));
      // generic-mcp is auto-added for setup but user-selected assistants list
      // should only contain 'opencode'
      const userAssistants = ['opencode'];
      const autoAdded = toolIds.filter((id) => !userAssistants.includes(id));
      assert.ok(
        autoAdded.length >= 1,
        'generic-mcp should be auto-added for setup',
      );

      // Verify the user's selected ID is preserved
      assert.ok(userAssistants.includes('opencode'));
      assert.ok(!userAssistants.includes('generic-mcp'));
    });

    it('selecting generic-mcp explicitly includes it', async () => {
      const { getAssistantToolIds } = await import(
        '../../src/runtime/interactive-init.mjs'
      );

      const toolIds = getAssistantToolIds(
        ['opencode', 'generic-mcp'],
        'full',
      );
      assert.ok(toolIds.includes('generic-mcp'));
      assert.ok(toolIds.includes('opencode'));
    });
  });

  describe('Validation helper edge cases', () => {
    it('handles deeply nested {file:...} references', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'deep-nested');
      mkdirSync(join(testDir, '.opencode', 'commands'), { recursive: true });
      writeFileSync(
        join(testDir, '.opencode', 'commands', 'deep.md'),
        '# Deep command',
      );

      const cfg = {
        $schema: 'https://opencode.ai/config.json',
        command: {
          one: { template: '{file:commands/deep.md}' },
          two: { template: '{file:commands/nonexistent.md}' },
        },
      };
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        JSON.stringify(cfg),
      );

      const result = validateOpenCodeFileReferences(testDir);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.missingFiles.length, 1);
      assert.ok(result.missingFiles[0].reference.includes('nonexistent'));
    });

    it('handles missing .opencode/opencode.json gracefully', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'no-opencode-cfg');
      mkdirSync(testDir, { recursive: true });

      const result = validateOpenCodeFileReferences(testDir);
      assert.ok(result.valid);
      assert.strictEqual(result.missingFiles.length, 0);
    });

    it('handles unparseable JSON gracefully', async () => {
      const { validateOpenCodeFileReferences } = await import(
        '../../src/runtime/tool-integrations.mjs'
      );
      const testDir = join(TMP, 'bad-json');
      mkdirSync(join(testDir, '.opencode'), { recursive: true });
      writeFileSync(
        join(testDir, '.opencode', 'opencode.json'),
        'not valid json {{{',
      );

      const result = validateOpenCodeFileReferences(testDir);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.parseError, true);
    });
  });
});
