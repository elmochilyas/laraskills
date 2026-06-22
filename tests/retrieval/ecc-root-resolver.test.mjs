import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, 'fixtures', 'tmp-resolver-test');

import {
  resolveEccRoot,
  resolveEccRootWithPrecedence,
  validateIntelligenceRoot,
} from '../../src/runtime/ecc-root-resolver.mjs';
import { getPackagedIntelligenceRoot } from '../../src/runtime/packaged-root.mjs';

function createFakeCheckout(base, valid = true) {
  const jsonDir = join(base, 'intelligence', 'json');
  mkdirSync(jsonDir, { recursive: true });
  if (valid) {
    const files = [
      'knowledge-units.json',
      'dependencies.json',
      'relationships.json',
      'rules.json',
      'skills.json',
      'checklists.json',
      'anti-patterns.json',
      'decision-trees.json',
    ];
    for (const file of files) {
      writeFileSync(join(jsonDir, file), JSON.stringify({ entries: [] }));
    }
  }
  return base;
}

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }
}

function clearRootEnvironment() {
  delete process.env.LARASKILLS_CONFIG_DIR;
  delete process.env.LARAVEL_ECC_CONFIG_DIR;
  delete process.env.LARASKILLS_ROOT;
  delete process.env.ECC_ROOT;
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

describe('LaraSkills Root Resolver - resolveEccRoot', () => {
  const tmpDir = join(TMP, 'resolve-basic');
  let validRoot;

  before(() => {
    cleanup();
    validRoot = createFakeCheckout(join(tmpDir, 'valid-checkout'), true);
  });

  after(() => cleanup());

  it('finds root directly when path contains intelligence/json/', () => {
    const result = resolveEccRoot(validRoot);
    assert.ok(result);
    assert.strictEqual(result.replace(/\\/g, '/'), validRoot.replace(/\\/g, '/'));
  });

  it('finds root by walking up from intelligence/json subdirectory', () => {
    const subDir = join(validRoot, 'intelligence', 'json');
    const result = resolveEccRoot(subDir);
    assert.ok(result);
    assert.strictEqual(result.replace(/\\/g, '/'), validRoot.replace(/\\/g, '/'));
  });

  it('returns null for non-existent path', () => {
    assert.strictEqual(resolveEccRoot('C:\\nonexistent\\path'), null);
  });

  it('returns null for path without intelligence/json/', () => {
    const testDir = join(tmpdir(), 'laraskills-test-empty-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    try {
      assert.strictEqual(resolveEccRoot(testDir), null);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('normalizes trailing slashes', () => {
    const result = resolveEccRoot(validRoot + '/');
    assert.ok(result);
    assert.strictEqual(result.replace(/\\/g, '/'), validRoot.replace(/\\/g, '/'));
  });

  it('normalizes backslashes to forward slashes', () => {
    assert.ok(resolveEccRoot(validRoot.replace(/\//g, '\\')));
  });
});

describe('LaraSkills Root Resolver - precedence', () => {
  const tmpDir = join(TMP, 'resolve-precedence');
  let preferredRoot;
  let legacyRoot;

  before(() => {
    cleanup();
    clearRootEnvironment();
    preferredRoot = createFakeCheckout(join(tmpDir, 'preferred-checkout'), true);
    legacyRoot = createFakeCheckout(join(tmpDir, 'legacy-checkout'), true);
    process.env.LARASKILLS_CONFIG_DIR = join(tmpDir, 'preferred-config');
    process.env.LARAVEL_ECC_CONFIG_DIR = join(tmpDir, 'legacy-config');
  });

  after(() => {
    clearRootEnvironment();
    cleanup();
  });

  it('1st precedence: --laraskills-root wins over --ecc-root', () => {
    const result = resolveEccRootWithPrecedence({
      explicitLaraskillsRoot: preferredRoot,
      explicitEccRoot: legacyRoot,
    });
    assert.strictEqual(result.source, 'laraskills-cli');
    assert.strictEqual(normalizePath(result.root), normalizePath(preferredRoot));
    assert.strictEqual(result.legacyFallback, false);
    assert.ok(result.valid);
  });

  it('2nd precedence: --ecc-root remains a reported legacy alias', () => {
    const result = resolveEccRootWithPrecedence({ explicitEccRoot: legacyRoot });
    assert.strictEqual(result.source, 'legacy-ecc-cli');
    assert.strictEqual(normalizePath(result.root), normalizePath(legacyRoot));
    assert.strictEqual(result.legacyFallback, true);
    assert.match(result.legacyReason, /--ecc-root/);
  });

  it('preferred explicit root fails clearly for a missing path', () => {
    assert.throws(
      () => resolveEccRootWithPrecedence({
        explicitLaraskillsRoot: '/nonexistent/laraskills/path',
      }),
      /LaraSkills root not found at --laraskills-root/,
    );
  });

  it('3rd precedence: LARASKILLS_ROOT wins over ECC_ROOT', () => {
    const result = resolveEccRootWithPrecedence({
      envLaraskillsRoot: preferredRoot,
      envEccRoot: legacyRoot,
    });
    assert.strictEqual(result.source, 'laraskills-environment');
    assert.strictEqual(normalizePath(result.root), normalizePath(preferredRoot));
    assert.strictEqual(result.legacyFallback, false);
  });

  it('4th precedence: ECC_ROOT remains a reported legacy fallback', () => {
    const result = resolveEccRootWithPrecedence({ envEccRoot: legacyRoot });
    assert.strictEqual(result.source, 'legacy-ecc-environment');
    assert.strictEqual(normalizePath(result.root), normalizePath(legacyRoot));
    assert.strictEqual(result.legacyFallback, true);
    assert.match(result.legacyReason, /ECC_ROOT/);
  });

  it('8th precedence: cwd discovery works inside the repository', () => {
    const result = resolveEccRootWithPrecedence({
      envLaraskillsRoot: null,
      envEccRoot: null,
    });
    assert.strictEqual(result.source, 'cwd-discovery');
    assert.ok(result.valid);
    assert.ok(result.root);
  });

  it('resolution result includes compatibility metadata', () => {
    const result = resolveEccRootWithPrecedence({
      explicitLaraskillsRoot: preferredRoot,
    });
    assert.strictEqual(typeof result.root, 'string');
    assert.strictEqual(result.source, 'laraskills-cli');
    assert.strictEqual(typeof result.valid, 'boolean');
    assert.strictEqual(typeof result.legacyFallback, 'boolean');
    assert.ok(Array.isArray(result.missingIntelligenceFiles));
  });
});

describe('LaraSkills Root Resolver - validateIntelligenceRoot', () => {
  const tmpDir = join(TMP, 'validate');
  let validRoot;
  let incompleteRoot;

  before(() => {
    cleanup();
    validRoot = createFakeCheckout(join(tmpDir, 'full'), true);
    incompleteRoot = createFakeCheckout(join(tmpDir, 'partial'), false);
    const jsonDir = join(incompleteRoot, 'intelligence', 'json');
    mkdirSync(jsonDir, { recursive: true });
    writeFileSync(join(jsonDir, 'knowledge-units.json'), JSON.stringify({ knowledge_units: [] }));
  });

  after(() => cleanup());

  it('returns valid for a complete checkout', () => {
    const result = validateIntelligenceRoot(validRoot);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.missingFiles.length, 0);
  });

  it('returns invalid for an incomplete checkout', () => {
    const result = validateIntelligenceRoot(incompleteRoot);
    assert.strictEqual(result.valid, false);
    assert.ok(result.missingFiles.length > 0);
  });
});

describe('LaraSkills Root Resolver - error messages', () => {
  const voidDir = join(tmpdir(), 'laraskills-test-void-' + Date.now());
  let previousCwd;

  before(() => {
    previousCwd = process.cwd();
    mkdirSync(voidDir, { recursive: true });
    process.chdir(voidDir);
    clearRootEnvironment();
    process.env.LARASKILLS_CONFIG_DIR = join(voidDir, 'config');
    process.env.LARAVEL_ECC_CONFIG_DIR = join(voidDir, 'legacy-config');
  });

  after(() => {
    process.chdir(previousCwd);
    clearRootEnvironment();
    try { rmSync(voidDir, { recursive: true, force: true }); } catch { }
  });

  it('throws actionable guidance when no root can be resolved', () => {
    const packaged = getPackagedIntelligenceRoot();
    if (packaged) {
      assert.ok(true, 'Packaged intelligence exists — resolution should succeed without throwing. This is the expected Phase 25 behavior.');
      const result = resolveEccRootWithPrecedence({});
      assert.ok(result);
      assert.ok(result.source);
    } else {
      assert.throws(
        () => resolveEccRootWithPrecedence({}),
        /LaraSkills intelligence files were not found/,
      );
      assert.throws(
        () => resolveEccRootWithPrecedence({}),
        /laraskills setup/,
      );
    }
  });

  it('finds packaged intelligence when available and no config exists', () => {
    const packaged = getPackagedIntelligenceRoot();
    if (packaged) {
      const result = resolveEccRootWithPrecedence({});
      assert.ok(result);
      assert.strictEqual(result.root.replace(/\\/g, '/'), packaged.replace(/\\/g, '/'));
      assert.strictEqual(result.source, 'packaged-intelligence');
      assert.ok(result.valid);
    } else {
      assert.ok(true, 'No packaged intelligence detected (test running outside npm package context) — skipping');
    }
  });
});
