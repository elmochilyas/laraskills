import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, 'fixtures', 'tmp-config-test');

import {
  getConfigPath,
  getLegacyConfigPath,
  loadConfig,
  loadConfigWithSource,
  saveConfig,
  clearConfig,
} from '../../src/runtime/user-config.mjs';

function cleanup() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }
}

function clearConfigEnvironment() {
  delete process.env.LARASKILLS_CONFIG_DIR;
  delete process.env.LARAVEL_ECC_CONFIG_DIR;
}

describe('LaraSkills User Config - paths', () => {
  before(() => {
    cleanup();
    clearConfigEnvironment();
  });

  after(() => {
    clearConfigEnvironment();
    cleanup();
  });

  it('uses LARASKILLS_CONFIG_DIR for the preferred config path', () => {
    const configDir = join(TMP, 'preferred');
    process.env.LARASKILLS_CONFIG_DIR = configDir;
    assert.strictEqual(getConfigPath(), join(configDir, 'config.json'));
  });

  it('keeps LARAVEL_ECC_CONFIG_DIR as a legacy fallback path', () => {
    const configDir = join(TMP, 'legacy');
    process.env.LARAVEL_ECC_CONFIG_DIR = configDir;
    assert.strictEqual(getLegacyConfigPath(), join(configDir, 'config.json'));
  });

  it('preferred config directory is independent of the legacy override', () => {
    process.env.LARASKILLS_CONFIG_DIR = join(TMP, 'preferred');
    process.env.LARAVEL_ECC_CONFIG_DIR = join(TMP, 'legacy');
    assert.notStrictEqual(getConfigPath(), getLegacyConfigPath());
  });
});

describe('LaraSkills User Config - save/load/clear cycle', () => {
  const configDir = join(TMP, 'cycle');
  let configPathResult;

  before(() => {
    cleanup();
    clearConfigEnvironment();
    process.env.LARASKILLS_CONFIG_DIR = configDir;
    process.env.LARAVEL_ECC_CONFIG_DIR = join(TMP, 'legacy-cycle');
  });

  after(() => {
    clearConfigEnvironment();
    cleanup();
  });

  it('loadConfig returns null when config does not exist', () => {
    const config = loadConfig();
    assert.strictEqual(config, null);
  });

  it('saveConfig writes valid UTF-8 JSON with laraskillsRoot', () => {
    configPathResult = saveConfig('/path/to/laraskills');
    assert.ok(existsSync(configPathResult));
    const raw = readFileSync(configPathResult, 'utf-8');
    assert.ok(raw.charCodeAt(0) !== 0xFEFF, 'Should not have BOM');
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.laraskillsRoot, '/path/to/laraskills');
    assert.strictEqual(parsed.eccRoot, undefined);
  });

  it('loadConfig loads saved config', () => {
    const config = loadConfig();
    assert.ok(config);
    assert.strictEqual(config.laraskillsRoot, '/path/to/laraskills');
  });

  it('repeated setup is idempotent', () => {
    saveConfig('/different/path');
    const config = loadConfig();
    assert.strictEqual(config.laraskillsRoot, '/different/path');
  });

  it('malformed JSON throws actionable error', () => {
    writeFileSync(configPathResult || getConfigPath(), '{invalid json}', 'utf-8');
    assert.throws(
      () => loadConfig(),
      /invalid JSON/,
    );
  });

  it('missing root field throws actionable error', () => {
    writeFileSync(getConfigPath(), JSON.stringify({}), 'utf-8');
    assert.throws(
      () => loadConfig(),
      /missing the required "laraskillsRoot"/,
    );
  });

  it('clearConfig resets config to empty object', () => {
    clearConfig();
    assert.ok(existsSync(getConfigPath()));
    const raw = readFileSync(getConfigPath(), 'utf-8');
    assert.strictEqual(raw.trim(), '{}');
  });
});

describe('LaraSkills User Config - legacy fallback', () => {
  before(() => {
    cleanup();
    clearConfigEnvironment();
    process.env.LARASKILLS_CONFIG_DIR = join(TMP, 'preferred-fallback');
    process.env.LARAVEL_ECC_CONFIG_DIR = join(TMP, 'legacy-fallback');
    mkdirSync(process.env.LARAVEL_ECC_CONFIG_DIR, { recursive: true });
  });

  after(() => {
    clearConfigEnvironment();
    cleanup();
  });

  it('loads the old config file and eccRoot field when no new config exists', () => {
    writeFileSync(
      getLegacyConfigPath(),
      JSON.stringify({ eccRoot: '/legacy/checkout' }),
      'utf-8',
    );
    const loaded = loadConfigWithSource();
    assert.strictEqual(loaded.config.laraskillsRoot, '/legacy/checkout');
    assert.strictEqual(loaded.source, 'legacy-config');
    assert.strictEqual(loaded.legacy, true);
  });

  it('prefers the new config when both new and old config files exist', () => {
    writeFileSync(
      getLegacyConfigPath(),
      JSON.stringify({ eccRoot: '/legacy/checkout' }),
      'utf-8',
    );
    saveConfig('/preferred/checkout');
    const loaded = loadConfigWithSource();
    assert.strictEqual(loaded.config.laraskillsRoot, '/preferred/checkout');
    assert.strictEqual(loaded.source, 'config');
    assert.strictEqual(loaded.legacy, false);
  });
});

describe('LaraSkills User Config - BOM detection', () => {
  before(() => {
    cleanup();
    clearConfigEnvironment();
    process.env.LARASKILLS_CONFIG_DIR = join(TMP, 'bom');
    mkdirSync(process.env.LARASKILLS_CONFIG_DIR, { recursive: true });
  });

  after(() => {
    clearConfigEnvironment();
    cleanup();
  });

  it('BOM in config file throws actionable error', () => {
    const cp = getConfigPath();
    const json = JSON.stringify({ laraskillsRoot: '/test' });
    const bom = '\uFEFF';
    writeFileSync(cp, bom + json, 'utf-8');
    assert.throws(
      () => loadConfig(),
      /BOM/,
    );
  });
});
