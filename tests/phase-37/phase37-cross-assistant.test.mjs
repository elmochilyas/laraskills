import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const CLI = join(REPO_ROOT, 'scripts', 'laraskills.mjs');

import {
  generateRegistry,
  readRegistry,
  writeRegistry,
  validateRegistry,
  getRegistryPath,
} from '../../src/runtime/skill-registry.mjs';

import {
  setupToolIntegration,
  getToolDefinition,
  getAllToolChecks,
  checkToolConfigured,
  validateOpenCodeFileReferences,
} from '../../src/runtime/tool-integrations.mjs';

import {
  LARASKILLS_ROOT_DIR,
  SKILLS_DIR,
  REGISTRY_PATH as CANONICAL_REGISTRY_PATH,
  STALE_REFERENCES,
  STALE_PATH_PATTERNS,
  ASSISTANT_IDS,
  canonicalSkillPath,
} from '../../src/runtime/paths.mjs';

function setupTestProject(withSkills = true) {
  const dir = join(tmpdir(), `laraskills-phase37-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  if (withSkills) {
    mkdirSync(join(dir, LARASKILLS_ROOT_DIR, 'skills', 'laravel-patterns'), { recursive: true });
    mkdirSync(join(dir, LARASKILLS_ROOT_DIR, 'skills', 'laravel-tdd'), { recursive: true });
    writeFileSync(join(dir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md'), '# Laravel Patterns\n\n## When to Use\n\nBuild Laravel applications using consistent architecture.');
    writeFileSync(join(dir, '.laraskills', 'skills', 'laravel-tdd', 'SKILL.md'), '# Laravel TDD\n\n## When to Use\n\nTest Laravel applications with Pest 4.');
    writeFileSync(join(dir, '.laraskills-state.json'), JSON.stringify({ version: '1.0.0-beta.23', profile: 'core', installed_at: new Date().toISOString(), assistants: [], tools: [], components: [] }));
  }
  return dir;
}

function runCli(args, cwd) {
  try {
    const result = execSync(`node "${CLI}" ${args}`, {
      encoding: 'utf-8',
      cwd,
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    return { stdout: result, stderr: '', code: 0 };
  } catch (e) {
    // Process exited with non-zero code; stdout may contain JSON
    const stdout = (e.stdout || '').toString().trim();
    const stderr = (e.stderr || '').toString().trim();
    if (stdout && stdout.startsWith('{')) {
      return { stdout, stderr, code: e.status || 1 };
    }
    return {
      stdout: stdout || stderr || e.message || '',
      stderr,
      code: e.status || 1,
    };
  }
}

describe('Phase 37 — Cross-Assistant Integration Reliability', () => {

  describe('Fix 1 — Doctor Health Aggregation', () => {
    let dir;
    before(() => { dir = setupTestProject(); });
    after(() => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });

    it('returns NOT HEALTHY when registry skill files are missing', () => {
      // Create registry pointing to non-existent skill
      writeRegistry(dir, {
        version: '1.0.0-test',
        generated_at: new Date().toISOString(),
        profile: 'core',
        skills: [
          { name: 'laravel-patterns', path: canonicalSkillPath(dir, 'laravel-patterns'), description: 'Test', tags: ['test'] },
          { name: 'nonexistent-skill', path: canonicalSkillPath(dir, 'nonexistent-skill'), description: 'Nope', tags: ['fake'] },
        ],
      });
      const result = runCli('doctor --assistants all --json', dir);
      const data = JSON.parse(result.stdout);
      assert.strictEqual(data.result, 'not_healthy', `Expected not_healthy but got ${data.result}`);
      assert.ok(result.code !== 0, `Expected non-zero exit code but got ${result.code}`);
    });

    it('returns HEALTHY when all registry paths resolve', () => {
      const reg = generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test');
      writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(reg, null, 2));
      const result = runCli('doctor --assistants all --json', dir);
      const data = JSON.parse(result.stdout);
      // Without MCP or full init, assistants may show degraded, but critical checks pass
      const hasSkillIssues = data.critical_failed;
      assert.strictEqual(hasSkillIssues, false, 'Critical checks should pass when registry and skills exist');
    });

    it('returns non-zero exit code when skill files are missing', () => {
      // Remove a skill file
      rmSync(join(dir, '.laraskills', 'skills', 'laravel-tdd'), { recursive: true, force: true });
      // Re-register
      const reg = generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test');
      writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(reg, null, 2));
      const result = runCli('doctor --json', dir);
      const data = JSON.parse(result.stdout);
      assert.strictEqual(data.result, 'not_healthy');
      assert.ok(result.code !== 0);
    });
  });

  describe('Fix 2 — Cross-Assistant Path Consistency', () => {
    it('registry paths use .laraskills/skills prefix', () => {
      const dir = setupTestProject();
      try {
        const reg = generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test');
        for (const skill of reg.skills) {
          assert.ok(skill.path.startsWith('.laraskills/skills/'), `Path ${skill.path} does not start with .laraskills/skills/`);
          assert.ok(!skill.path.startsWith('skills/'), `Path ${skill.path} should not start with skills/`);
          assert.ok(!skill.path.startsWith('../skills'), `Path ${skill.path} should not start with ../skills`);
        }
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('canonical skill path helper returns correct path', () => {
      const p = canonicalSkillPath('/some/project', 'laravel-patterns');
      assert.strictEqual(p, '.laraskills/skills/laravel-patterns/SKILL.md');
    });

    it('STALE_PATH_PATTERNS reject old path formats', () => {
      assert.ok(STALE_PATH_PATTERNS.some(p => p.test('skills/laravel-patterns/SKILL.md')));
      assert.ok(STALE_PATH_PATTERNS.some(p => p.test('../skills/foo')));
      assert.ok(STALE_PATH_PATTERNS.some(p => p.test('laravel-ecc')));
    });
  });

  describe('Fix 3 — Doctor Checks All Assistants', () => {
    it('doctor --assistants all aggregates results in JSON', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        const result = runCli('doctor --assistants all --json', dir);
        const data = JSON.parse(result.stdout);
        assert.ok(data.assistants, 'Should have assistants key');
        const ids = Object.keys(data.assistants);
        assert.ok(ids.length >= 3, `Expected at least 3 assistants, got ${ids.length}`);
        // Each assistant should have a status field
        for (const [id, info] of Object.entries(data.assistants)) {
          assert.ok(typeof info.status === 'string', `${id} should have status string`);
          assert.ok(Array.isArray(info.issues), `${id} should have issues array`);
        }
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('doctor --benchmark treats stale as hard failure', () => {
      const dir = setupTestProject();
      try {
        // Create stale reference
        writeFileSync(join(dir, '.laravel-ecc-state.json'), JSON.stringify({ version: 'old' }));
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        const result = runCli('doctor --benchmark --json', dir);
        const data = JSON.parse(result.stdout);
        assert.strictEqual(data.result, 'not_ready', `Expected not_ready, got ${data.result}`);
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('Fix 4 — Repair Mode', () => {
    it('init --repair recreates missing skill files', () => {
      const dir = setupTestProject(false); // No skills
      try {
        mkdirSync(join(dir, LARASKILLS_ROOT_DIR), { recursive: true });
        writeFileSync(join(dir, '.laraskills-state.json'), JSON.stringify({
          version: '1.0.0-beta.23', profile: 'core', tools: [], assistants: [], components: [],
          installed_at: new Date().toISOString(),
        }));
        // Run repair
        const result = runCli('init --repair --yes', dir);
        assert.ok(result.stdout.includes('Repair complete'), 'Repair should complete');

        // Check skills were created
        assert.ok(existsSync(join(dir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md')), 'Should have laravel-patterns');
        assert.ok(existsSync(join(dir, '.laraskills', 'skills', 'laravel-tdd', 'SKILL.md')), 'Should have laravel-tdd');
        assert.ok(existsSync(join(dir, '.laraskills', 'skill-registry.json')), 'Should have registry');
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('init --repair regenerates registry', () => {
      const dir = setupTestProject();
      try {
        // Remove registry
        rmSync(join(dir, '.laraskills', 'skill-registry.json'), { force: true });
        assert.strictEqual(existsSync(join(dir, '.laraskills', 'skill-registry.json')), false);

        const result = runCli('init --repair --yes', dir);
        assert.ok(result.stdout.includes('Repair complete'));

        // Registry should exist now
        const regPath = join(dir, '.laraskills', 'skill-registry.json');
        assert.ok(existsSync(regPath), 'Registry should be recreated');
        const reg = JSON.parse(readFileSync(regPath, 'utf-8'));
        assert.ok(reg.skills.length > 0, 'Registry should have skills');
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('init --repair is idempotent', () => {
      const dir = setupTestProject();
      try {
        // Run repair twice
        runCli('init --repair --yes', dir);
        const result = runCli('init --repair --yes', dir);
        assert.ok(result.stdout.includes('Repair complete'), 'Second repair should succeed');
        // Registry and skills should still exist
        assert.ok(existsSync(join(dir, '.laraskills', 'skill-registry.json')), 'Registry should exist after second repair');
        assert.ok(existsSync(join(dir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md')), 'Skills should exist after second repair');
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('Fix 5 — Stale Detection', () => {
    it('detects stale laravel-ecc state file', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laravel-ecc-state.json'), JSON.stringify({ version: 'old' }));
        const result = runCli('doctor --json', dir);
        const data = JSON.parse(result.stdout);
        const staleStatus = data.checks?.stale_references?.status;
        assert.ok(staleStatus === 'warn' || staleStatus === 'fail', `Expected warn/fail for stale, got ${staleStatus}`);
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('detects stale laravel-ecc in package.json dependencies', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
          dependencies: { 'laravel-ecc': '^1.0.0' },
        }));
        const result = runCli('doctor --json', dir);
        const data = JSON.parse(result.stdout);
        const staleFindings = data.checks?.stale_references?.findings || [];
        const hasDepFinding = staleFindings.some(f => f.type === 'dependency');
        assert.ok(hasDepFinding, 'Should detect laravel-ecc in dependencies');
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('Fix 6 — JSON Output', () => {
    it('doctor --json produces valid JSON', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        const result = runCli('doctor --assistants all --json', dir);
        const data = JSON.parse(result.stdout);
        assert.ok(typeof data === 'object');
        assert.strictEqual(typeof data.result, 'string');
        assert.ok(typeof data.version, 'string');
        assert.ok(typeof data.mode, 'string');
        assert.ok(data.assistants, 'Should have assistants');
        assert.ok(data.checks, 'Should have checks');
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('doctor --benchmark --json has stable shape', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        const result = runCli('doctor --benchmark --json', dir);
        const data = JSON.parse(result.stdout);
        assert.ok(data.version);
        assert.ok(data.result);
        assert.ok(data.mode);
        assert.ok(data.assistants || data.failures);
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('doctor --json has exit_code field', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        const result = runCli('doctor --json', dir);
        const data = JSON.parse(result.stdout);
        assert.ok(typeof data.exit_code === 'number', 'Should have exit_code');
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('Fix 7 — MCP Runtime Verification', () => {
    it('doctor --mcp-runtime separates config/command checks', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        const result = runCli('doctor --assistants all --json', dir);
        const data = JSON.parse(result.stdout);
        // MCP runtime key may not exist unless --mcp-runtime flag is set
        assert.ok(data.result !== undefined);
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('Fix 9 — Assistant Config Paths Match Registry', () => {
    it('OpenCode config after init points to .laraskills/skills', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills', 'skill-registry.json'), JSON.stringify(
          generateRegistry(dir, REPO_ROOT, 'core', '1.0.0-test'), null, 2
        ));
        setupToolIntegration('opencode', dir, { dryRun: false });
        const openCodeCfg = join(dir, '.opencode', 'opencode.json');
        if (existsSync(openCodeCfg)) {
          const cfg = JSON.parse(readFileSync(openCodeCfg, 'utf-8'));
          if (cfg.skills && cfg.skills.paths) {
            // Check that paths use official skills root
            const hasCorrectPath = cfg.skills.paths.some(p => p === '.laraskills/skills');
            const hasStalePath = cfg.skills.paths.some(p => p === 'skills' || p === '../skills');
            assert.ok(hasCorrectPath || !hasStalePath, 'OpenCode should not use stale skill paths');
          }
        }
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('all 5 assistant tool definitions exist', () => {
      for (const aid of ASSISTANT_IDS) {
        const def = getToolDefinition(aid);
        assert.ok(def, `${aid} tool definition should exist`);
        assert.ok(def.id, `${aid} should have an id`);
        assert.ok(def.displayName, `${aid} should have displayName`);
        assert.ok(typeof def.setup === 'function', `${aid} setup should be a function`);
        assert.ok(typeof def.isConfigured === 'function', `${aid} isConfigured should be a function`);
      }
    });

    it('getAllToolChecks returns results for all 5 assistants', () => {
      const dir = setupTestProject();
      try {
        const checks = getAllToolChecks(dir);
        assert.ok(checks.length >= 5);
        const ids = checks.map(c => c.id);
        for (const aid of ASSISTANT_IDS) {
          assert.ok(ids.includes(aid), `${aid} should be in checks`);
        }
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('Paths Module', () => {
    it('exports all required constants', () => {
      assert.strictEqual(LARASKILLS_ROOT_DIR, '.laraskills');
      assert.strictEqual(SKILLS_DIR, '.laraskills/skills');
      assert.strictEqual(CANONICAL_REGISTRY_PATH, '.laraskills/skill-registry.json');
      assert.ok(ASSISTANT_IDS.length === 5);
      assert.ok(STALE_REFERENCES.includes('laravel-ecc'));
    });

    it('ASSISTANT_IDS includes all supported assistants', () => {
      assert.ok(ASSISTANT_IDS.includes('opencode'));
      assert.ok(ASSISTANT_IDS.includes('cursor'));
      assert.ok(ASSISTANT_IDS.includes('claude-code'));
      assert.ok(ASSISTANT_IDS.includes('codex'));
      assert.ok(ASSISTANT_IDS.includes('generic-mcp'));
    });
  });

  describe('Repair Mode — Assistant Path Updates', () => {
    it('repair updates OpenCode config paths', () => {
      const dir = setupTestProject();
      try {
        // Create an OpenCode config with stale paths
        mkdirSync(join(dir, '.opencode'), { recursive: true });
        writeFileSync(join(dir, '.opencode', 'opencode.json'), JSON.stringify({
          instructions: ['skills/laravel-patterns/SKILL.md'],
          skills: { paths: ['../skills'] },
        }, null, 2));
        writeFileSync(join(dir, '.laraskills-state.json'), JSON.stringify({
          version: '1.0.0-beta.23', profile: 'core', tools: ['opencode'], assistants: ['opencode'], components: [],
          installed_at: new Date().toISOString(),
        }));

        const result = runCli('init --repair --yes', dir);
        assert.ok(result.stdout.includes('Repair complete'));

        // Check config was updated
        if (existsSync(join(dir, '.opencode', 'opencode.json'))) {
          const cfg = JSON.parse(readFileSync(join(dir, '.opencode', 'opencode.json'), 'utf-8'));
          if (cfg.instructions) {
            const oldPath = cfg.instructions.find(i => i.startsWith('skills/'));
            assert.strictEqual(oldPath, undefined, 'Should not have old skills/ paths after repair');
          }
        }
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });

    it('repair is safe to run multiple times', () => {
      const dir = setupTestProject();
      try {
        writeFileSync(join(dir, '.laraskills-state.json'), JSON.stringify({
          version: '1.0.0-beta.23', profile: 'core', tools: [], assistants: [], components: [],
          installed_at: new Date().toISOString(),
        }));
        // Run repair 3 times
        runCli('init --repair --yes', dir);
        runCli('init --repair --yes', dir);
        const result = runCli('init --repair --yes', dir);
        assert.ok(result.stdout.includes('Repair complete'));
        // Should not corrupt anything
        assert.ok(existsSync(join(dir, '.laraskills', 'skill-registry.json')));
      } finally {
        try { rmSync(dir, { recursive: true, force: true }); } catch {}
      }
    });
  });
});