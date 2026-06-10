import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, 'fixtures', 'tmp-config-test');

import {
  getConfigPath,
  loadConfig,
  saveConfig,
  clearConfig,
} from '../../src/runtime/user-config.mjs';

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }
}

describe('User Config — getConfigPath', () => {
  before(() => cleanup());
  after(() => cleanup());

  it('respects LARAVEL_ECC_CONFIG_DIR env var', () => {
    const prev = process.env.LARAVEL_ECC_CONFIG_DIR;
    const configDir = TMP.replace(/\//g, '\\');
    process.env.LARAVEL_ECC_CONFIG_DIR = configDir;
    try {
      const cp = getConfigPath();
      assert.ok(cp.startsWith(configDir), `Expected ${cp} to start with ${configDir}`);
      assert.ok(cp.endsWith('config.json'), `Expected ${cp} to end with config.json`);
    } finally {
      if (prev) process.env.LARAVEL_ECC_CONFIG_DIR = prev;
      else delete process.env.LARAVEL_ECC_CONFIG_DIR;
    }
  });
});

describe('User Config — save/load/clear cycle', () => {
  const configDir = join(TMP, 'cycle');
  let configPathResult;

  before(() => {
    cleanup();
    process.env.LARAVEL_ECC_CONFIG_DIR = configDir;
  });

  after(() => {
    delete process.env.LARAVEL_ECC_CONFIG_DIR;
    cleanup();
  });

  it('loadConfig returns null when config does not exist', () => {
    const config = loadConfig();
    assert.strictEqual(config, null);
  });

  it('saveConfig writes valid UTF-8 JSON', () => {
    configPathResult = saveConfig('/path/to/laravel-ecc');
    assert.ok(existsSync(configPathResult));
    const raw = readFileSync(configPathResult, 'utf-8');
    assert.ok(raw.charCodeAt(0) !== 0xFEFF, 'Should not have BOM');
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.eccRoot, '/path/to/laravel-ecc');
  });

  it('loadConfig loads saved config', () => {
    const config = loadConfig();
    assert.ok(config);
    assert.strictEqual(config.eccRoot, '/path/to/laravel-ecc');
  });

  it('repeated setup is idempotent', () => {
    saveConfig('/different/path');
    const config = loadConfig();
    assert.strictEqual(config.eccRoot, '/different/path');
  });

  it('malformed JSON throws actionable error', () => {
    writeFileSync(configPathResult || getConfigPath(), '{invalid json}', 'utf-8');
    assert.throws(
      () => loadConfig(),
      /invalid JSON/,
    );
  });

  it('missing eccRoot field throws actionable error', () => {
    writeFileSync(getConfigPath(), JSON.stringify({}), 'utf-8');
    assert.throws(
      () => loadConfig(),
      /missing the required "eccRoot"/,
    );
  });

  it('clearConfig resets config to empty object', () => {
    clearConfig();
    assert.ok(existsSync(getConfigPath()));
    const raw = readFileSync(getConfigPath(), 'utf-8');
    assert.strictEqual(raw.trim(), '{}');
  });
});

describe('User Config — BOM detection', () => {
  before(() => {
    cleanup();
    process.env.LARAVEL_ECC_CONFIG_DIR = join(TMP, 'bom');
    mkdirSync(process.env.LARAVEL_ECC_CONFIG_DIR, { recursive: true });
  });

  after(() => {
    delete process.env.LARAVEL_ECC_CONFIG_DIR;
    cleanup();
  });

  it('BOM in config file throws actionable error', () => {
    const cp = getConfigPath();
    const json = JSON.stringify({ eccRoot: '/test' });
    const bom = '\uFEFF';
    writeFileSync(cp, bom + json, 'utf-8');
    assert.throws(
      () => loadConfig(),
      /BOM/,
    );
  });
});
