import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadConfigWithSource,
  getConfigPath,
  getLegacyConfigPath,
} from './user-config.mjs';
import { getPackagedIntelligenceRoot, isPackagedRoot } from './packaged-root.mjs';

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
  if (typeof root !== 'string') return null;
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

function buildResult(root, source, legacyFallback = false, legacyReason = null) {
  const missing = validateIntelligenceFiles(root);
  return {
    root,
    source,
    valid: missing.length === 0,
    missingIntelligenceFiles: missing,
    legacyFallback,
    legacyReason,
  };
}

function resolveRequiredRoot(root, label, source, legacyFallback, legacyReason) {
  const resolved = resolveEccRoot(root);
  if (resolved) {
    return buildResult(resolved, source, legacyFallback, legacyReason);
  }
  throw new Error(
    `LaraSkills root not found at ${label}: ${root}\n` +
    `The path must contain intelligence/json/knowledge-units.json.\n` +
    `Fix: clone the full repository and point to its root:\n` +
    `  git clone https://github.com/elmochilyas/laraskills.git\n` +
    `  laraskills setup --laraskills-root /path/to/laraskills`
  );
}

export function resolveConfigRoot() {
  const loaded = loadConfigWithSource();
  if (!loaded) return null;
  const resolved = resolveEccRoot(loaded.config.laraskillsRoot);
  if (!resolved) return null;
  return buildResult(
    resolved,
    loaded.source === 'legacy-config' ? 'legacy-laravel-ecc-user-config' : 'laraskills-user-config',
    loaded.legacy,
    loaded.legacy ? loaded.legacyReasons.join(', ') : null,
  );
}

export function resolveEccRootWithPrecedence({
  explicitLaraskillsRoot,
  explicitEccRoot,
  envLaraskillsRoot,
  envEccRoot,
  explicitRoot,
  envRoot,
} = {}) {
  const preferredCliRoot = explicitLaraskillsRoot ?? explicitRoot ?? null;
  const legacyCliRoot = explicitEccRoot ?? null;
  const preferredEnvRoot = envLaraskillsRoot !== undefined
    ? envLaraskillsRoot
    : (envRoot !== undefined ? envRoot : process.env.LARASKILLS_ROOT);
  const legacyEnvRoot = envEccRoot !== undefined ? envEccRoot : process.env.ECC_ROOT;

  if (preferredCliRoot) {
    return resolveRequiredRoot(
      preferredCliRoot,
      '--laraskills-root',
      'laraskills-cli',
      false,
      null,
    );
  }

  if (legacyCliRoot) {
    return resolveRequiredRoot(
      legacyCliRoot,
      '--ecc-root',
      'legacy-ecc-cli',
      true,
      'deprecated --ecc-root CLI alias',
    );
  }

  if (preferredEnvRoot) {
    return resolveRequiredRoot(
      preferredEnvRoot,
      'LARASKILLS_ROOT',
      'laraskills-environment',
      false,
      null,
    );
  }

  if (legacyEnvRoot) {
    return resolveRequiredRoot(
      legacyEnvRoot,
      'ECC_ROOT',
      'legacy-ecc-environment',
      true,
      'legacy ECC_ROOT environment variable',
    );
  }

  const configResult = resolveConfigRoot();
  if (configResult) return configResult;

  const cwdRoot = resolveEccRoot(process.cwd());
  if (cwdRoot) {
    return buildResult(cwdRoot, 'cwd-discovery');
  }

  const packagedRoot = getPackagedIntelligenceRoot();
  if (packagedRoot) {
    return buildResult(packagedRoot, 'packaged-intelligence');
  }

  const configPath = getConfigPath();
  const legacyConfigPath = getLegacyConfigPath();
  const hint = existsSync(configPath)
    ? `Config file exists but does not contain a valid LaraSkills root:\n  ${configPath}`
    : `No LaraSkills configuration file found at:\n  ${configPath}`;

  throw new Error(
    `LaraSkills intelligence files were not found.\n\n` +
    `The npm package contains the CLI, MCP adapter, and packaged intelligence.\n` +
    `Packaged intelligence should be available automatically.\n\n` +
    `If you see this error, the npm package may be corrupted.\n` +
    `Try reinstalling: npm install -g laraskills\n\n` +
    hint + '\n' +
    `Legacy config fallback checked at:\n  ${legacyConfigPath}\n\n` +
    `Advanced: point to a custom checkout with:\n` +
    `  laraskills setup --laraskills-root /path/to/laraskills\n`
  );
}

export function validateIntelligenceRoot(root) {
  const missing = validateIntelligenceFiles(root);
  return {
    valid: missing.length === 0,
    missingFiles: missing,
  };
}
