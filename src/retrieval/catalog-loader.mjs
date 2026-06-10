import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  REQUIRED_JSON_FILES,
  OPTIONAL_JSON_FILES,
  INTELLIGENCE_JSON_DIR,
} from './config.mjs';
import { loadConfig } from '../runtime/user-config.mjs';

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

export function findEccRoot(cwd, explicitRoot, envRoot) {
  if (explicitRoot) {
    const found = resolveEccRoot(explicitRoot);
    if (found) return found;
    throw new Error(`ECC root not found at specified path: ${explicitRoot}`);
  }
  if (envRoot) {
    const found = resolveEccRoot(envRoot);
    if (found) return found;
    throw new Error(`ECC root not found at ECC_ROOT: ${envRoot}`);
  }
  let found = resolveEccRoot(cwd);
  if (found) return found;
  found = resolveEccRoot(process.cwd());
  if (found) return found;
  const config = loadConfig();
  if (config) {
    found = resolveEccRoot(config.eccRoot);
    if (found) return found;
  }
  throw new Error(
    'ECC intelligence files were not found.\n\n' +
    'Provide the full Laravel ECC repository path:\n\n' +
    `  npx laravel-ecc retrieve "your task" --ecc-root C:\\path\\to\\laravel-ecc\n\n` +
    'or set:\n\n' +
    '  ECC_ROOT=C:\\path\\to\\laravel-ecc\n\n' +
    'or run:\n\n' +
    '  laravel-ecc setup --ecc-root C:\\path\\to\\laravel-ecc'
  );
}

function stripBom(str) {
  if (str.charCodeAt(0) === 0xFEFF) return str.slice(1);
  return str;
}

function loadJsonFile(filePath) {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  const cleaned = stripBom(raw);
  return JSON.parse(cleaned);
}

function getTopLevelKey(parsed, expectedKeys) {
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of expectedKeys) {
    if (Array.isArray(parsed[key])) return { key, data: parsed[key] };
  }
  return null;
}

export function loadCatalog(eccRoot) {
  const jsonDir = join(eccRoot, INTELLIGENCE_JSON_DIR);

  const result = {
    knowledgeUnits: new Map(),
    dependencies: { edges: [] },
    relationships: { edges: [] },
    rules: [],
    skills: [],
    checklists: [],
    antiPatterns: [],
    decisionTrees: [],
    aliases: [],
    externalConcepts: [],
    warnings: [],
    errors: [],
  };

  const loadResult = loadJsonFile(join(jsonDir, 'knowledge-units.json'));
  if (!loadResult) {
    throw new Error(`Required file not found: knowledge-units.json in ${jsonDir}`);
  }
  const kuLookup = getTopLevelKey(loadResult, ['knowledge_units', 'knowledgeUnits']);
  if (!kuLookup) {
    throw new Error('knowledge-units.json: expected top-level key "knowledge_units" with an array');
  }
  for (const entry of kuLookup.data) {
    if (!entry.id) {
      result.errors.push(`knowledge-units.json: entry missing "id" field`);
      continue;
    }
    if (result.knowledgeUnits.has(entry.id)) {
      result.warnings.push(`Duplicate KU id: ${entry.id}`);
    }
    result.knowledgeUnits.set(entry.id, entry);
  }

  const requiredData = [
    { file: 'dependencies.json', key: 'edges', target: result.dependencies },
    { file: 'relationships.json', key: 'edges', target: result.relationships },
  ];
  for (const { file, key, target } of requiredData) {
    const parsed = loadJsonFile(join(jsonDir, file));
    if (!parsed) {
      throw new Error(`Required file not found: ${file} in ${jsonDir}`);
    }
    const lookup = getTopLevelKey(parsed, [key]);
    if (!lookup) {
      throw new Error(`${file}: expected top-level key "${key}" with an array`);
    }
    target.edges = lookup.data;
  }

  const artifactFiles = [
    { file: 'rules.json', target: 'rules' },
    { file: 'skills.json', target: 'skills' },
    { file: 'checklists.json', target: 'checklists' },
    { file: 'anti-patterns.json', target: 'antiPatterns' },
    { file: 'decision-trees.json', target: 'decisionTrees' },
  ];
  for (const { file, target } of artifactFiles) {
    const parsed = loadJsonFile(join(jsonDir, file));
    if (!parsed) {
      throw new Error(`Required file not found: ${file} in ${jsonDir}`);
    }
    const lookup = getTopLevelKey(parsed, ['entries']);
    if (!lookup) {
      throw new Error(`${file}: expected top-level key "entries" with an array`);
    }
    result[target] = lookup.data;
  }

  for (const file of OPTIONAL_JSON_FILES) {
    const parsed = loadJsonFile(join(jsonDir, file));
    if (!parsed) {
      result.warnings.push(`Optional file not found: ${file} — skipping`);
      continue;
    }
    if (file === 'aliases.json') {
      const lookup = getTopLevelKey(parsed, ['aliases']);
      if (lookup) result.aliases = lookup.data;
      else result.warnings.push('aliases.json: unexpected structure, skipping');
    } else if (file === 'external-concepts.json') {
      const lookup = getTopLevelKey(parsed, ['concepts']);
      if (lookup) result.externalConcepts = lookup.data;
      else result.warnings.push('external-concepts.json: unexpected structure, skipping');
    }
  }

  result.knowledgeUnitsCount = result.knowledgeUnits.size;
  result.dependencyEdgesCount = result.dependencies.edges.length;
  result.relationshipEdgesCount = result.relationships.edges.length;
  result.aliasesCount = result.aliases.length;
  result.externalConceptsCount = result.externalConcepts.length;

  return result;
}
