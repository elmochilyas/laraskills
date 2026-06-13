import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir, platform } from 'node:os';

function getDefaultConfigDir(directoryName) {
  if (platform() === 'win32') {
    const appData = process.env.APPDATA;
    if (appData) return join(appData, directoryName);
  }
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, directoryName);
  return join(homedir(), '.config', directoryName);
}

function getConfigDir() {
  return process.env.LARASKILLS_CONFIG_DIR || getDefaultConfigDir('laraskills');
}

function getLegacyConfigDir() {
  return process.env.LARAVEL_ECC_CONFIG_DIR || getDefaultConfigDir('laravel-ecc');
}

export function getConfigPath() {
  return join(getConfigDir(), 'config.json');
}

export function getLegacyConfigPath() {
  return join(getLegacyConfigDir(), 'config.json');
}

function parseConfig(configPath, source) {
  const raw = readFileSync(configPath, 'utf-8');
  if (raw.charCodeAt(0) === 0xFEFF) {
    throw new Error(
      `Config file contains a BOM (byte-order mark). Fix: open ${configPath} in an editor that saves UTF-8 without BOM, or delete it and rerun \`laraskills setup\`.`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Config file contains invalid JSON. Fix: check ${configPath} for syntax errors, then rerun \`laraskills setup\`.`
      );
    }
    throw error;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `Config file is not a valid JSON object. Fix: ensure ${configPath} contains {"laraskillsRoot": "/path/to/laraskills"}.`
    );
  }

  const usesLegacyField = !parsed.laraskillsRoot && typeof parsed.eccRoot === 'string';
  const root = parsed.laraskillsRoot || parsed.eccRoot;
  if (typeof root !== 'string') {
    throw new Error(
      `Config file is missing the required "laraskillsRoot" field. Fix: ensure ${configPath} contains {"laraskillsRoot": "/path/to/laraskills"}.`
    );
  }
  if (root.trim().length === 0) {
    throw new Error(
      `Config file has an empty root field. Fix: run \`laraskills setup --laraskills-root /path/to/laraskills\`.`
    );
  }

  const legacyFile = source === 'legacy-config';
  const legacyReasons = [];
  if (legacyFile) legacyReasons.push('old laravel-ecc config directory');
  if (usesLegacyField) legacyReasons.push('legacy eccRoot config field');

  return {
    config: {
      ...parsed,
      laraskillsRoot: root,
    },
    path: configPath,
    source,
    legacy: legacyFile || usesLegacyField,
    legacyReasons,
  };
}

export function loadConfigWithSource() {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    return parseConfig(configPath, 'config');
  }

  const legacyConfigPath = getLegacyConfigPath();
  if (legacyConfigPath !== configPath && existsSync(legacyConfigPath)) {
    return parseConfig(legacyConfigPath, 'legacy-config');
  }

  return null;
}

export function loadConfig() {
  return loadConfigWithSource()?.config || null;
}

export function saveConfig(laraskillsRoot) {
  const configPath = getConfigPath();
  const configDir = dirname(configPath);
  mkdirSync(configDir, { recursive: true });
  const config = { laraskillsRoot };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return configPath;
}

export function clearConfig() {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    writeFileSync(configPath, '{}', 'utf-8');
  }
}
