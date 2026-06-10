import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, getConfigPath } from './user-config.mjs';

const INTELLIGENCE_JSON_DIR = 'intelligence/json';

const REQUIRED_INTELLIGENCE_FILES = [
  'knowledge-units.json',
  'dependencies.json',
  'relationships.json',
  'rules.json',
  'skills.json',
  'checklists.json',
  'anti-patterns.json',
  'decision-trees.json',
];

export function resolveEccRoot(root) {
  const candidates = [];
  let normalized = root.replace(/\\/g, '/');
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized.length > 0) candidates.push(normalized);
  while (normalized.length > 0) {
    const idx = normalized.lastIndexOf('/');
    if (idx <= 0) break;
    normalized = normalized.slice(0, idx);
    if (normalized.length > 0) candidates.push(normalized);
  }
  for (const candidate of [...new Set(candidates)]) {
    const jsonDir = join(candidate, INTELLIGENCE_JSON_DIR);
    if (existsSync(jsonDir)) {
      const marker = join(jsonDir, 'knowledge-units.json');
      if (existsSync(marker)) return candidate;
    }
  }
  return null;
}

function validateIntelligenceFiles(root) {
  const jsonDir = join(root, INTELLIGENCE_JSON_DIR);
  const missing = [];
  for (const file of REQUIRED_INTELLIGENCE_FILES) {
    if (!existsSync(join(jsonDir, file))) {
      missing.push(file);
    }
  }
  return missing;
}

export function resolveConfigRoot() {
  const config = loadConfig();
  if (!config) return null;
  const resolved = resolveEccRoot(config.eccRoot);
  return resolved || null;
}

export function resolveEccRootWithPrecedence({
  explicitRoot,
  envRoot,
} = {}) {
  const envEccRoot = envRoot !== undefined ? envRoot : process.env.ECC_ROOT;

  if (explicitRoot) {
    const resolved = resolveEccRoot(explicitRoot);
    if (resolved) {
      const missing = validateIntelligenceFiles(resolved);
      return {
        root: resolved,
        source: 'cli-argument',
        valid: missing.length === 0,
        missingIntelligenceFiles: missing,
      };
    }
    throw new Error(
      `ECC root not found at specified path: ${explicitRoot}\n` +
      `The path must contain intelligence/json/knowledge-units.json.\n` +
      `Fix: clone the full repository and point to its root:\n` +
      `  git clone https://github.com/elmochilyas/laravel-ecc.git\n` +
      `  laravel-ecc setup --ecc-root /path/to/laravel-ecc`
    );
  }

  if (envEccRoot) {
    const resolved = resolveEccRoot(envEccRoot);
    if (resolved) {
      const missing = validateIntelligenceFiles(resolved);
      return {
        root: resolved,
        source: 'environment',
        valid: missing.length === 0,
        missingIntelligenceFiles: missing,
      };
    }
    throw new Error(
      `ECC root not found at ECC_ROOT: ${envEccRoot}\n` +
      `The ECC_ROOT environment variable points to a path that does not contain intelligence/json/.\n` +
      `Fix: set ECC_ROOT to the full Laravel ECC repository root, or run:\n` +
      `  laravel-ecc setup --ecc-root /path/to/laravel-ecc`
    );
  }

  {
    const configRoot = resolveConfigRoot();
    if (configRoot) {
      const missing = validateIntelligenceFiles(configRoot);
      return {
        root: configRoot,
        source: 'user-config',
        valid: missing.length === 0,
        missingIntelligenceFiles: missing,
      };
    }
  }

  {
    const cwdRoot = resolveEccRoot(process.cwd());
    if (cwdRoot) {
      const missing = validateIntelligenceFiles(cwdRoot);
      return {
        root: cwdRoot,
        source: 'cwd-discovery',
        valid: missing.length === 0,
        missingIntelligenceFiles: missing,
      };
    }
  }

  const configPath = getConfigPath();
  const hint = existsSync(configPath)
    ? `Config file exists but does not contain a valid ECC root:\n  ${configPath}\nFix: run \`laravel-ecc setup --ecc-root /path/to/laravel-ecc\` to update it.`
    : `No configuration file found at:\n  ${configPath}\nFix: run \`laravel-ecc setup --ecc-root /path/to/laravel-ecc\` to configure it.`;

  throw new Error(
    `ECC intelligence files were not found.\n\n` +
    `The npm package contains the CLI and MCP adapter.\n` +
    `Retrieval requires access to a full Laravel ECC checkout.\n\n` +
    hint + '\n\n' +
    `You can also set the ECC_ROOT environment variable:\n` +
    `  ECC_ROOT=/path/to/laravel-ecc\n` +
    `or run from inside a cloned laravel-ecc repository.\n\n` +
    `To clone the full repository:\n` +
    `  git clone https://github.com/elmochilyas/laravel-ecc.git`
  );
}

export function validateIntelligenceRoot(root) {
  const missing = validateIntelligenceFiles(root);
  return {
    valid: missing.length === 0,
    missingFiles: missing,
  };
}
