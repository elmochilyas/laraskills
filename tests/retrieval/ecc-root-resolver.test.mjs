import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const TMP = join(__dirname, 'fixtures', 'tmp-resolver-test');

import {
  resolveEccRoot,
  resolveEccRootWithPrecedence,
  validateIntelligenceRoot,
} from '../../src/runtime/ecc-root-resolver.mjs';

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
    for (const f of files) {
      writeFileSync(join(jsonDir, f), JSON.stringify({ entries: [] }));
    }
  }
  return base;
}

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }
}

describe('ECC Root Resolver — resolveEccRoot', () => {
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
    const result = resolveEccRoot('C:\\nonexistent\\path');
    assert.strictEqual(result, null);
  });

  it('returns null for path without intelligence/json/', () => {
    const testDir = join(tmpdir(), 'laravel-ecc-test-empty-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    try {
      const result = resolveEccRoot(testDir);
      assert.strictEqual(result, null);
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
    const bsPath = validRoot.replace(/\//g, '\\');
    const result = resolveEccRoot(bsPath);
    assert.ok(result);
  });
});

describe('ECC Root Resolver — resolveEccRootWithPrecedence', () => {
  const tmpDir = join(TMP, 'resolve-precedence');
  let validRoot;

  before(() => {
    cleanup();
    validRoot = createFakeCheckout(join(tmpDir, 'checkout'), true);
  });

  after(() => cleanup());

  it('1st precedence: explicit CLI argument wins', () => {
    const result = resolveEccRootWithPrecedence({ explicitRoot: validRoot });
    assert.strictEqual(result.source, 'cli-argument');
    assert.ok(result.valid);
    assert.ok(result.root);
  });

  it('explicit root fails clearly for missing path', () => {
    assert.throws(
      () => resolveEccRootWithPrecedence({ explicitRoot: '/nonexistent/ecc/path' }),
      /ECC root not found at specified path/,
    );
  });

  it('2nd precedence: ECC_ROOT environment variable', () => {
    const result = resolveEccRootWithPrecedence({ envRoot: validRoot });
    assert.strictEqual(result.source, 'environment');
    assert.ok(result.valid);
  });

  it('ECC_ROOT environment fails clearly for invalid path', () => {
    assert.throws(
      () => resolveEccRootWithPrecedence({ envRoot: '/invalid/ecc/env/root' }),
      /ECC root not found at ECC_ROOT/,
    );
  });

  it('4th precedence: cwd discovery works inside repo', () => {
    const result = resolveEccRootWithPrecedence({});
    assert.strictEqual(result.source, 'cwd-discovery');
    assert.ok(result.valid);
    assert.ok(result.root);
  });

  it('resolution result has correct shape', () => {
    const result = resolveEccRootWithPrecedence({ explicitRoot: validRoot });
    assert.ok(typeof result.root === 'string');
    assert.ok(['cli-argument', 'environment', 'user-config', 'cwd-discovery'].includes(result.source));
    assert.strictEqual(typeof result.valid, 'boolean');
    assert.ok(Array.isArray(result.missingIntelligenceFiles || []));
  });
});

describe('ECC Root Resolver — validateIntelligenceRoot', () => {
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

  it('returns valid for complete checkout', () => {
    const result = validateIntelligenceRoot(validRoot);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.missingFiles.length, 0);
  });

  it('returns invalid for incomplete checkout', () => {
    const result = validateIntelligenceRoot(incompleteRoot);
    assert.strictEqual(result.valid, false);
    assert.ok(result.missingFiles.length > 0);
  });
});

describe('ECC Root Resolver — error messages', () => {
  const voidDir = join(tmpdir(), 'laravel-ecc-test-void-' + Date.now());
  let prevCwd;

  before(() => {
    prevCwd = process.cwd();
    mkdirSync(voidDir, { recursive: true });
    process.chdir(voidDir);
  });

  after(() => {
    process.chdir(prevCwd);
    try { rmSync(voidDir, { recursive: true, force: true }); } catch { }
  });

  it('throws actionable error when no root can be resolved', () => {
    assert.throws(
      () => resolveEccRootWithPrecedence({}),
      /ECC intelligence files were not found/,
    );
    assert.throws(
      () => resolveEccRootWithPrecedence({}),
      /laravel-ecc setup/,
    );
  });
});
