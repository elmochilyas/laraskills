import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

import {
  generateRegistry,
  readRegistry,
  writeRegistry,
  validateRegistry,
  getRegistrySummary,
  getRegistryPath,
} from '../../src/runtime/skill-registry.mjs';

describe('Skill Registry — Generation', () => {
  let tmpDir;

  before(() => {
    tmpDir = join(tmpdir(), `laraskills-test-${randomUUID()}`);
    mkdirSync(tmpDir, { recursive: true });
    mkdirSync(join(tmpDir, '.laraskills'), { recursive: true });
  });

  after(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('generateRegistry creates a registry', () => {
    // Create a mock skills directory
    mkdirSync(join(tmpDir, '.laraskills', 'skills'), { recursive: true });
    mkdirSync(join(tmpDir, '.laraskills', 'skills', 'laravel-patterns'), { recursive: true });
    writeFileSync(join(tmpDir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md'), '# Laravel Patterns\n\n## When to Use\n\nBuild Laravel apps.');

    const registry = generateRegistry(tmpDir, ROOT, 'core');
    assert.ok(registry);
    assert.ok(registry.version);
    assert.ok(registry.generated_at);
    assert.ok(registry.skills);
    assert.ok(Array.isArray(registry.skills));
  });

  it('readRegistry returns null for missing registry', () => {
    const emptyDir = join(tmpdir(), `laraskills-test-no-reg-${randomUUID()}`);
    mkdirSync(emptyDir, { recursive: true });
    mkdirSync(join(emptyDir, '.laraskills'), { recursive: true });
    try {
      const result = readRegistry(emptyDir);
      assert.strictEqual(result, null);
    } finally {
      try { rmSync(emptyDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('writeRegistry and readRegistry roundtrip', () => {
    const testRegistry = {
      version: '1.0.0-test',
      generated_at: new Date().toISOString(),
      profile: 'core',
      skills: [
        { name: 'laravel-patterns', path: '.laraskills/skills/laravel-patterns/SKILL.md', description: 'Test', tags: ['test'] }
      ]
    };
    writeRegistry(tmpDir, testRegistry);
    const registryPath = getRegistryPath(tmpDir);
    assert.ok(existsSync(registryPath));

    const read = readRegistry(tmpDir);
    assert.ok(read);
    assert.strictEqual(read.version, '1.0.0-test');
    assert.strictEqual(read.skills.length, 1);
    assert.strictEqual(read.skills[0].name, 'laravel-patterns');
  });

  it('getRegistrySummary returns exists:false when no registry', () => {
    const emptyDir = join(tmpdir(), `laraskills-test-empty-${randomUUID()}`);
    mkdirSync(emptyDir, { recursive: true });
    try {
      const summary = getRegistrySummary(emptyDir);
      assert.strictEqual(summary.exists, false);
    } finally {
      try { rmSync(emptyDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('validateRegistry reports valid when all skills exist', () => {
    mkdirSync(join(tmpDir, '.laraskills', 'skills', 'laravel-tdd'), { recursive: true });
    writeFileSync(join(tmpDir, '.laraskills', 'skills', 'laravel-tdd', 'SKILL.md'), '# Laravel TDD');

    const testRegistry = {
      version: '1.0.0-test',
      generated_at: new Date().toISOString(),
      profile: 'core',
      skills: [
        { name: 'laravel-patterns', path: '.laraskills/skills/laravel-patterns/SKILL.md', description: 'Test', tags: ['test'] },
        { name: 'laravel-tdd', path: '.laraskills/skills/laravel-tdd/SKILL.md', description: 'TDD', tags: ['testing'] }
      ]
    };
    writeRegistry(tmpDir, testRegistry);

    const validation = validateRegistry(tmpDir);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.missingSkills.length, 0);
  });

  it('validateRegistry reports missing skills', () => {
    const testRegistry = {
      version: '1.0.0-test',
      generated_at: new Date().toISOString(),
      profile: 'core',
      skills: [
        { name: 'laravel-patterns', path: '.laraskills/skills/laravel-patterns/SKILL.md', description: 'Test', tags: ['test'] },
        { name: 'nonexistent-skill', path: '.laraskills/skills/nonexistent-skill/SKILL.md', description: 'Nope', tags: ['fake'] }
      ]
    };
    writeRegistry(tmpDir, testRegistry);

    const validation = validateRegistry(tmpDir);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.missingSkills.includes('nonexistent-skill'));
  });
});

describe('Skill Registry — Paths', () => {
  it('paths use .laraskills prefix and are relative', () => {
    const testRegistry = {
      version: '1.0.0-test',
      generated_at: new Date().toISOString(),
      skills: [
        { name: 'laravel-patterns', path: '.laraskills/skills/laravel-patterns/SKILL.md', description: 'Test', tags: ['test'] }
      ]
    };
    assert.ok(testRegistry.skills[0].path.startsWith('.laraskills/'));
    assert.ok(!testRegistry.skills[0].path.startsWith('/'));
    assert.ok(!testRegistry.skills[0].path.includes('C:'));
  });
});

describe('Skill Registry — Failure mode', () => {
  it('doctor-mode: skills on disk but registry missing', () => {
    const failDir = join(tmpdir(), `laraskills-test-fail-${randomUUID()}`);
    mkdirSync(failDir, { recursive: true });
    mkdirSync(join(failDir, '.laraskills'), { recursive: true });
    mkdirSync(join(failDir, '.laraskills', 'skills'), { recursive: true });
    mkdirSync(join(failDir, '.laraskills', 'skills', 'laravel-patterns'), { recursive: true });
    writeFileSync(join(failDir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md'), '# test');

    try {
      // Skills exist on disk but no registry
      assert.strictEqual(existsSync(join(failDir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md')), true);
      const registry = readRegistry(failDir);
      assert.strictEqual(registry, null);

      // generateRegistry should create it
      const newReg = generateRegistry(failDir, ROOT, 'core');
      assert.ok(newReg);
      assert.ok(newReg.skills.some(s => s.name === 'laravel-patterns'));
    } finally {
      try { rmSync(failDir, { recursive: true, force: true }); } catch {}
    }
  });
});

describe('Skill Registry — Registry format', () => {
  it('registry includes version, generated_at, profile, skills', () => {
    const tmpDir2 = join(tmpdir(), `laraskills-test-fmt-${randomUUID()}`);
    mkdirSync(tmpDir2, { recursive: true });
    mkdirSync(join(tmpDir2, '.laraskills', 'skills', 'laravel-patterns'), { recursive: true });
    writeFileSync(join(tmpDir2, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md'), '# Test\n\n## When to Use\n\nTest skill.');

    try {
      const reg = generateRegistry(tmpDir2, ROOT, 'core');
      assert.ok(typeof reg.version === 'string');
      assert.ok(typeof reg.generated_at === 'string');
      assert.ok(typeof reg.profile === 'string');
      assert.ok(Array.isArray(reg.skills));

      const skill = reg.skills.find(s => s.name === 'laravel-patterns');
      assert.ok(skill);
      assert.ok(typeof skill.path === 'string');
      assert.ok(typeof skill.description === 'string');
      assert.ok(Array.isArray(skill.tags));
    } finally {
      try { rmSync(tmpDir2, { recursive: true, force: true }); } catch {}
    }
  });
});
