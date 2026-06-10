import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir, platform } from 'node:os';

function getConfigDir() {
  const testOverride = process.env.LARAVEL_ECC_CONFIG_DIR;
  if (testOverride) return testOverride;
  if (platform() === 'win32') {
    const appData = process.env.APPDATA;
    if (appData) return join(appData, 'laravel-ecc');
  }
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, 'laravel-ecc');
  return join(homedir(), '.config', 'laravel-ecc');
}

export function getConfigPath() {
  return join(getConfigDir(), 'config.json');
}

export function loadConfig() {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return null;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    if (raw.charCodeAt(0) === 0xFEFF) {
      throw new Error(
        `Config file contains a BOM (byte-order mark). Fix: open ${configPath} in an editor that saves UTF-8 without BOM, or delete it and rerun \`laravel-ecc setup\`.`
      );
    }
    const config = JSON.parse(raw);
    if (!config || typeof config !== 'object') {
      throw new Error(
        `Config file is not a valid JSON object. Fix: ensure ${configPath} contains a JSON object like {"eccRoot": "/path/to/laravel-ecc"}`
      );
    }
    if (!config.eccRoot || typeof config.eccRoot !== 'string') {
      throw new Error(
        `Config file is missing the required "eccRoot" field. Fix: ensure ${configPath} contains {"eccRoot": "/path/to/laravel-ecc"}`
      );
    }
    if (config.eccRoot.trim().length === 0) {
      throw new Error(
        `Config file has an empty "eccRoot" field. Fix: run \`laravel-ecc setup --ecc-root /path/to/laravel-ecc\`.`
      );
    }
    return config;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(
        `Config file contains invalid JSON. Fix: check ${configPath} for syntax errors, then rerun \`laravel-ecc setup\`.`
      );
    }
    throw err;
  }
}

export function saveConfig(eccRoot) {
  const configPath = getConfigPath();
  const configDir = dirname(configPath);
  mkdirSync(configDir, { recursive: true });
  const config = { eccRoot };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return configPath;
}

export function clearConfig() {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    writeFileSync(configPath, '{}', 'utf-8');
  }
}
