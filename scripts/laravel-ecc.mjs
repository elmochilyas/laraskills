#!/usr/bin/env node
import { existsSync, readFileSync, copyFileSync, mkdirSync, cpSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  retrieveContext,
  searchKnowledge,
  getKnowledgeUnit,
  getPrerequisites,
  getRelatedTopics,
  validateIntelligence,
  retrieveAndFormat,
} from '../src/retrieval/index.mjs';
import { formatAsMarkdown, formatAsJson, formatKuDetail } from '../src/retrieval/formatter.mjs';
import {
  resolveEccRootWithPrecedence,
  resolveEccRoot,
  validateIntelligenceRoot,
} from '../src/runtime/ecc-root-resolver.mjs';
import {
  getConfigPath,
  loadConfig,
  saveConfig,
} from '../src/runtime/user-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

const VALID_COMPONENTS = [
  'laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals', 'laravel-database',
  'laravel-artisan', 'laravel-eloquent', 'laravel-migration', 'laravel-container',
];

function log(msg) { console.log(`[Laravel ECC] ${msg}`); }
function warn(msg) { console.warn(`[Laravel ECC] WARNING: ${msg}`); }
function err(msg) { console.error(`[Laravel ECC] ERROR: ${msg}`); process.exit(1); }
function logRet(msg) { console.log(msg); }

function detectTools(target) {
  const tools = [];
  if (existsSync(join(target, '.opencode'))) tools.push('opencode');
  if (existsSync(join(target, '.claude'))) tools.push('claude');
  if (existsSync(join(target, '.cursor'))) tools.push('cursor');
  if (existsSync(join(target, '.gemini'))) tools.push('gemini');
  if (existsSync(join(target, '.codex'))) tools.push('codex');
  if (existsSync(join(target, '.github'))) tools.push('copilot');
  if (existsSync(join(target, '.vscode'))) tools.push('vscode');
  if (existsSync(join(target, '.zed'))) tools.push('zed');
  if (existsSync(join(target, '.trae'))) tools.push('trae');
  if (existsSync(join(target, '.qwen'))) tools.push('qwen');
  if (existsSync(join(target, '.codebuddy'))) tools.push('codebuddy');
  if (existsSync(join(target, '.kiro'))) tools.push('kiro');
  return tools;
}

function readState(target) {
  const stateFile = join(target, '.laravel-ecc-state.json');
  if (!existsSync(stateFile)) return null;
  return JSON.parse(readFileSync(stateFile, 'utf-8'));
}

function writeState(target, state) {
  writeFileSync(join(target, '.laravel-ecc-state.json'), JSON.stringify(state, null, 2));
}

function copyRules(target) {
  const src = join(ROOT, 'rules');
  const dest = join(target, 'rules');
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const lang of ['common', 'php', 'web', 'laravel']) {
    const srcLang = join(src, lang);
    if (existsSync(srcLang)) {
      const destLang = join(dest, lang);
      mkdirSync(destLang, { recursive: true });
      cpSync(srcLang, destLang, { recursive: true });
    }
  }
  log('Synced rules (common, php, web, laravel)');
}

function copyCommands(target) {
  const src = join(ROOT, 'commands');
  const dest = join(target, 'commands');
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  log('Synced commands');
}

function copyHarnessConfigs(target) {
  const dirs = [
    '.opencode', '.claude', '.cursor', '.gemini', '.codex',
    '.vscode', '.zed', '.trae', '.qwen', '.codebuddy', '.kiro', '.github',
  ];
  let count = 0;
  for (const dir of dirs) {
    const src = join(ROOT, dir);
    const dest = join(target, dir);
    if (!existsSync(src)) continue;
    mkdirSync(dest, { recursive: true });
    if (existsSync(join(src, 'settings.json'))) {
      copyFileSync(join(src, 'settings.json'), join(dest, 'settings.json'));
      count++;
    }
    if (existsSync(join(src, 'opencode.json'))) {
      copyFileSync(join(src, 'opencode.json'), join(dest, 'opencode.json'));
      count++;
    }
    if (existsSync(join(src, 'rules.mdc'))) {
      copyFileSync(join(src, 'rules.mdc'), join(dest, 'rules.mdc'));
      count++;
    }
    if (existsSync(join(src, 'instructions.md'))) {
      copyFileSync(join(src, 'instructions.md'), join(dest, 'instructions.md'));
      count++;
    }
    if (existsSync(join(src, 'copilot-instructions.md'))) {
      copyFileSync(join(src, 'copilot-instructions.md'), join(dest, 'copilot-instructions.md'));
      count++;
    }
    if (existsSync(join(src, 'README.md'))) {
      copyFileSync(join(src, 'README.md'), join(dest, 'README.md'));
      count++;
    }
    if (existsSync(join(src, 'extensions.json'))) {
      copyFileSync(join(src, 'extensions.json'), join(dest, 'extensions.json'));
      count++;
    }
    if (existsSync(join(src, 'rules.md'))) {
      copyFileSync(join(src, 'rules.md'), join(dest, 'rules.md'));
      count++;
    }
  }
  log(`Synced ${count} harness configs`);
}

function copyHooks(target) {
  const src = join(ROOT, 'hooks');
  const dest = join(target, 'hooks');
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  log('Synced hooks');
}

function copyMcpConfigs(target) {
  const src = join(ROOT, 'mcp-configs');
  const dest = join(target, 'mcp-configs');
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  log('Synced MCP configs');
}

function addComponent(target, component) {
  if (!VALID_COMPONENTS.includes(component)) {
    err(`Unknown component: ${component}. Valid: ${VALID_COMPONENTS.join(', ')}`);
  }

  const skillDir = join(ROOT, 'skills', component);
  if (existsSync(skillDir)) {
    const dest = join(target, 'skills', component);
    mkdirSync(join(target, 'skills'), { recursive: true });
    cpSync(skillDir, dest, { recursive: true });
    log(`Added skill: ${component}`);
    return;
  }

  const agentFile = join(ROOT, 'agents', `${component}.md`);
  if (existsSync(agentFile)) {
    const destDir = join(target, 'agents');
    mkdirSync(destDir, { recursive: true });
    copyFileSync(agentFile, join(destDir, `${component}.md`));
    log(`Added agent: ${component}`);
    return;
  }

  err(`Component not found: ${component}`);
}

function cmdSetup(setupArgs) {
  const flags = parseFlags(setupArgs);
  const explicitRoot = getExplicitEccRoot(flags);
  const configPath = getConfigPath();

  log('Laravel ECC setup');
  console.log('');

  let rootToSave = null;
  let source = '';

  if (explicitRoot) {
    const resolved = resolveEccRoot(explicitRoot);
    if (!resolved) {
      err(
        `Validation failed: ${explicitRoot} does not contain intelligence/json/knowledge-units.json.\n` +
        `Provide the root of a full Laravel ECC checkout (not a subdirectory).`
      );
    }
    rootToSave = resolved;
    source = 'cli-argument';
  } else {
    try {
      const result = resolveEccRootWithPrecedence({ explicitRoot: null });
      rootToSave = result.root;
      source = result.source;
      log(`ECC root discovered automatically (${source}): ${rootToSave}`);
      console.log('');
    } catch (e) {
      log('No ECC root could be discovered automatically.');
      log('Provide the full Laravel ECC checkout path:');
      console.log(`  laravel-ecc setup --ecc-root "/path/to/laravel-ecc"`);
      console.log('');
      log('To clone the repository first:');
      console.log(`  git clone https://github.com/elmochilyas/laravel-ecc.git`);
      console.log(`  laravel-ecc setup --ecc-root "./laravel-ecc"`);
      process.exit(1);
    }
  }

  const intelligenceCheck = validateIntelligenceRoot(rootToSave);
  const savedPath = saveConfig(rootToSave);

  console.log('Laravel ECC setup complete.');
  console.log('');
  console.log(`Config file:  ${savedPath}`);
  console.log(`ECC root:     ${rootToSave}`);
  console.log(`Source:       ${source}`);
  console.log(`Intelligence: ${intelligenceCheck.valid ? 'VALID' : 'INCOMPLETE'}`);
  if (!intelligenceCheck.valid) {
    console.log(`  Missing files: ${intelligenceCheck.missingFiles.join(', ')}`);
  }
  console.log('');
  console.log('Next steps:');
  console.log(`  laravel-ecc doctor              Verify configuration`);
  console.log(`  laravel-ecc retrieve "<task>"    Get ECC context for a task`);
  console.log(`  laravel-ecc search "<query>"     Search knowledge units`);
  console.log(`  laravel-ecc validate             Validate intelligence layer`);
  console.log('');
}

function cmdDoctor(doctorArgs) {
  const flags = parseFlags(doctorArgs || []);
  const configPath = getConfigPath();
  const configExists = existsSync(configPath);
  const envEccRoot = process.env.ECC_ROOT || 'not set';

  console.log('Laravel ECC Doctor');
  console.log('');
  console.log(`Package version:       ${pkg.version}`);
  console.log(`Node.js:               ${process.version}`);
  console.log(`Platform:              ${process.platform}`);
  console.log(`Config file:           ${configPath}`);
  console.log(`Config exists:         ${configExists ? 'yes' : 'no'}`);

  if (configExists) {
    try {
      const config = loadConfig();
      console.log(`Config ECC root:       ${config.eccRoot}`);
    } catch (e) {
      console.log(`Config ECC root:       ERROR - ${e.message}`);
    }
  }

  console.log(`ECC_ROOT env:          ${envEccRoot}`);

  let resolvedRoot = null;
  let resolutionSource = '';
  let resolutionError = null;

  try {
    const result = resolveEccRootWithPrecedence({
      explicitRoot: flags.eccroot || null,
    });
    resolvedRoot = result.root;
    resolutionSource = result.source;
    console.log(`Resolved ECC root:     ${resolvedRoot}`);
    console.log(`Resolution source:     ${resolutionSource}`);
  } catch (e) {
    resolutionError = e.message;
    console.log(`Resolved ECC root:     NOT FOUND`);
    console.log(`Resolution source:     none`);
  }

  if (resolvedRoot) {
    const jsonDir = join(resolvedRoot, 'intelligence', 'json');
    const requiredFiles = [
      'knowledge-units.json', 'dependencies.json', 'relationships.json',
      'rules.json', 'skills.json', 'checklists.json', 'anti-patterns.json',
      'decision-trees.json',
    ];
    let filesPass = true;
    const fileResults = [];
    for (const f of requiredFiles) {
      const ok = existsSync(join(jsonDir, f));
      fileResults.push({ file: f, ok });
      if (!ok) filesPass = false;
    }
    console.log(`Intelligence files:    ${filesPass ? 'PASS' : 'FAIL'}`);
    if (!filesPass) {
      for (const fr of fileResults) {
        if (!fr.ok) console.log(`  Missing: ${fr.file}`);
      }
    }

    const intelligenceCheck = validateIntelligenceRoot(resolvedRoot);
    console.log(`Intelligence validate: ${intelligenceCheck.valid ? 'PASS' : 'FAIL'}`);

    const mcpPath = join(resolvedRoot, 'scripts', 'laravel-ecc-mcp.mjs');
    console.log(`MCP adapter:           ${existsSync(mcpPath) ? 'PASS' : 'MISSING'}`);

    const retrievalDir = join(resolvedRoot, 'src', 'retrieval');
    console.log(`Retrieval readiness:   ${existsSync(retrievalDir) ? 'PASS' : 'MISSING'}`);
  } else {
    console.log(`Intelligence files:    FAIL`);
    console.log(`Intelligence validate: FAIL`);
    console.log(`MCP adapter:           FAIL`);
    console.log(`Retrieval readiness:   FAIL`);
  }

  console.log('');

  if (resolvedRoot && validateIntelligenceRoot(resolvedRoot).valid) {
    console.log('Status: HEALTHY');
    process.exit(0);
  } else {
    console.log('Status: ACTION REQUIRED');
    if (resolutionError) {
      console.log('');
      console.log('Fix:');
      console.log(`  laravel-ecc setup --ecc-root "/path/to/laravel-ecc"`);
      console.log('');
      console.log('To clone the full repository:');
      console.log(`  git clone https://github.com/elmochilyas/laravel-ecc.git`);
    }
    process.exit(1);
  }
}

function install(target, profile) {
  const detected = detectTools(target);
  log(`Laravel ECC v${pkg.version}`);
  log(`Target: ${target}`);
  log(`Profile: ${profile}`);
  log(`Detected tools: ${detected.join(', ')}`);

  const skillsDir = join(target, 'skills');
  mkdirSync(skillsDir, { recursive: true });

  const skillList = profile === 'minimal'
    ? ['laravel-patterns', 'laravel-tdd', 'laravel-security']
    : ['laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals', 'laravel-eloquent', 'laravel-database'];

  for (const skill of skillList) {
    const src = join(ROOT, 'skills', skill);
    if (existsSync(src)) {
      cpSync(src, join(skillsDir, skill), { recursive: true });
      log(`  ✓ Installed skill: ${skill}`);
    }
  }

  copyRules(target);
  copyHooks(target);
  copyMcpConfigs(target);

  const agentsDir = join(target, 'agents');
  mkdirSync(agentsDir, { recursive: true });
  const agents = profile === 'minimal'
    ? ['laravel-artisan.md']
    : ['laravel-artisan.md', 'laravel-eloquent.md', 'laravel-migration.md', 'laravel-database.md', 'laravel-container.md'];
  for (const agent of agents) {
    const src = join(ROOT, 'agents', agent);
    if (existsSync(src)) {
      copyFileSync(src, join(agentsDir, agent));
    }
  }
  log(`  ✓ Installed ${agents.length} agent(s)`);

  if (profile === 'full') {
    copyCommands(target);
    copyHarnessConfigs(target);
    log('  ✓ Installed commands & harness configs');
  }

  const installedComponents = [...new Set([...skillList, 'rules', ...agents.map(a => a.replace('.md', ''))])];
  const state = {
    version: pkg.version,
    target,
    installed_at: new Date().toISOString(),
    profile,
    tools: detected,
    components: installedComponents,
  };
  writeState(target, state);
  log('Installation complete!');
  log(`Profile: ${profile}`);
}

function doUpdate(target) {
  const state = readState(target);
  if (!state) {
    err('Not installed. Run `npx laravel-ecc install` first.');
  }

  log(`Laravel ECC v${pkg.version}`);
  log(`Updating from v${state.version} to v${pkg.version}`);
  log(`Target: ${target}`);
  log(`Profile: ${state.profile}`);

  const skillsDir = join(target, 'skills');
  mkdirSync(skillsDir, { recursive: true });
  const srcSkillsDir = join(ROOT, 'skills');
  if (existsSync(srcSkillsDir)) {
    const installed = readdirSync(srcSkillsDir);
    for (const skill of installed) {
      const src = join(srcSkillsDir, skill);
      if (statSync(src).isDirectory()) {
        cpSync(src, join(skillsDir, skill), { recursive: true });
        log(`  ✓ Updated skill: ${skill}`);
      }
    }
  }

  copyRules(target);
  copyHooks(target);
  copyMcpConfigs(target);

  const agentsDir = join(target, 'agents');
  mkdirSync(agentsDir, { recursive: true });
  const srcAgentsDir = join(ROOT, 'agents');
  if (existsSync(srcAgentsDir)) {
    const installed = readdirSync(srcAgentsDir);
    for (const agent of installed) {
      if (agent.endsWith('.md')) {
        copyFileSync(join(srcAgentsDir, agent), join(agentsDir, agent));
        log(`  ✓ Updated agent: ${agent}`);
      }
    }
  }

  if (state.profile === 'full') {
    copyCommands(target);
    copyHarnessConfigs(target);
  }

  const updatedComponents = [];
  if (existsSync(join(target, 'skills'))) {
    const skillDirs = readdirSync(join(target, 'skills'));
    updatedComponents.push(...skillDirs);
  }
  updatedComponents.push('rules');
  if (existsSync(join(target, 'agents'))) {
    const agentFiles = readdirSync(join(target, 'agents')).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    updatedComponents.push(...agentFiles);
  }

  const newState = {
    ...state,
    version: pkg.version,
    updated_at: new Date().toISOString(),
    components: updatedComponents,
  };
  writeState(target, newState);

  log('Update complete!');
  if (state.version !== pkg.version) {
    log(`Updated from v${state.version} to v${pkg.version}`);
  } else {
    log(`Already at latest version v${pkg.version}`);
  }
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '').replace(/-/g, '');
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  if (flags.json && !flags.format) flags.format = 'json';
  if (flags.markdown && !flags.format) flags.format = 'markdown';
  return flags;
}

function getEccRoot(flags) {
  return flags.eccroot || process.env.ECC_ROOT || null;
}

function getExplicitEccRoot(flags) {
  return flags.eccroot || null;
}

function cmdRetrieve(retrieveArgs) {
  if (retrieveArgs.length === 0) {
    err('Usage: npx laravel-ecc retrieve "<query>" [options]\n\nOptions:\n  --mode compact|standard|deep\n  --format markdown|json\n  --ecc-root <path>\n  --max-kus <number>\n  --max-rules <number>\n  --max-skills <number>\n  --max-related <number>\n  --max-prerequisites <number>\n  --prerequisite-depth <number>\n  --related-depth <number>\n  --budget <number>\n  --domain <domain-id>');
  }

  const query = retrieveArgs[0];
  const flags = parseFlags(retrieveArgs.slice(1));

  try {
    const result = retrieveAndFormat(query, {
      mode: flags.mode || 'standard',
      format: flags.format || 'markdown',
      explicitEccRoot: getEccRoot(flags),
      maxKus: flags.maxkus ? parseInt(flags.maxkus, 10) : undefined,
      maxRules: flags.maxrules ? parseInt(flags.maxrules, 10) : undefined,
      maxSkills: flags.maxskills ? parseInt(flags.maxskills, 10) : undefined,
      maxRelated: flags.maxrelated ? parseInt(flags.maxrelated, 10) : undefined,
      maxPrerequisites: flags.maxprerequisites ? parseInt(flags.maxprerequisites, 10) : undefined,
      prerequisiteDepth: flags.prerequisitedepth ? parseInt(flags.prerequisitedepth, 10) : undefined,
      relatedDepth: flags.relateddepth ? parseInt(flags.relateddepth, 10) : undefined,
      budget: flags.budget ? parseInt(flags.budget, 10) : undefined,
      domain: flags.domain || undefined,
    });
    logRet(result);
  } catch (e) {
    err(e.message);
  }
}

function cmdSearch(searchArgs) {
  if (searchArgs.length === 0) {
    err('Usage: npx laravel-ecc search "<query>" [options]\n\nOptions:\n  --format markdown|json\n  --limit <number>\n  --domain <domain-id>\n  --ecc-root <path>');
  }

  const query = searchArgs[0];
  const flags = parseFlags(searchArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const results = searchKnowledge(query, {
      limit: flags.limit ? parseInt(flags.limit, 10) : 20,
      domain: flags.domain || undefined,
      explicitEccRoot: getEccRoot(flags),
    });

    if (format === 'json') {
      logRet(JSON.stringify({ query, results: results.map(r => ({
        id: r.id,
        score: r.score,
        domain: r.ku?.domain || '',
        subdomain: r.ku?.subdomain || '',
        name: r.ku?.knowledge_unit || '',
        breakdown: r.breakdown || [],
      }))}, null, 2));
    } else {
      const lines = [`# Search Results: ${query}`, '', `Found ${results.length} matching knowledge units`, ''];
      let seq = 0;
      for (const r of results.slice(0, 30)) {
        seq++;
        lines.push(`### ${seq}. ${r.ku?.knowledge_unit || r.id}`);
        lines.push('');
        lines.push(`| Property | Value |`);
        lines.push(`|----------|-------|`);
        lines.push(`| **ID** | \`${r.id}\` |`);
        lines.push(`| **Score** | ${r.score} |`);
        lines.push(`| **Domain** | ${r.ku?.domain || '-'} |`);
        lines.push(`| **Subdomain** | ${r.ku?.subdomain || '-'} |`);
        lines.push(`| **Difficulty** | ${r.ku?.difficulty || 'unknown'} |`);
        if (r.breakdown && r.breakdown.length > 0) {
          const topSignal = r.breakdown[0];
          lines.push(`| **Top signal** | ${topSignal.signal} (+${topSignal.value}) |`);
        }
        lines.push('');
      }
      logRet(lines.join('\n'));
    }
  } catch (e) {
    err(e.message);
  }
}

function cmdGet(getArgs) {
  if (getArgs.length === 0) {
    err('Usage: npx laravel-ecc get <knowledge-unit-id> [options]\n\nOptions:\n  --include-content\n  --format markdown|json\n  --ecc-root <path>');
  }

  const kuId = getArgs[0];
  const flags = parseFlags(getArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const result = getKnowledgeUnit(kuId, {
      includeContent: !!flags.includecontent,
      explicitEccRoot: getEccRoot(flags),
    });

    if (!result) {
      err(`Knowledge unit not found: ${kuId}`);
    }

    if (format === 'json') {
      logRet(JSON.stringify(result, null, 2));
    } else {
      logRet(result.detail);
    }
  } catch (e) {
    err(e.message);
  }
}

function cmdPrerequisites(preArgs) {
  if (preArgs.length === 0) {
    err('Usage: npx laravel-ecc prerequisites <knowledge-unit-id> [options]\n\nOptions:\n  --depth <number>\n  --format markdown|json\n  --ecc-root <path>');
  }

  const kuId = preArgs[0];
  const flags = parseFlags(preArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const results = getPrerequisites(kuId, {
      depth: flags.depth ? parseInt(flags.depth, 10) : 1,
      limit: flags.limit ? parseInt(flags.limit, 10) : 20,
      explicitEccRoot: getEccRoot(flags),
    });

    if (format === 'json') {
      logRet(JSON.stringify({ knowledgeUnitId: kuId, prerequisites: results }, null, 2));
    } else {
      const lines = [`# Prerequisites for \`${kuId}\``, ''];
      if (results.length === 0) {
        lines.push('No prerequisites found.');
      } else {
        for (const p of results) {
          lines.push(`- **\`${p.id}\`**`);
          if (p.reason) lines.push(`  - Reason: ${p.reason}`);
          if (p.depth !== undefined) lines.push(`  - Depth: ${p.depth}`);
          lines.push('');
        }
      }
      logRet(lines.join('\n'));
    }
  } catch (e) {
    err(e.message);
  }
}

function cmdRelated(relArgs) {
  if (relArgs.length === 0) {
    err('Usage: npx laravel-ecc related <knowledge-unit-id> [options]\n\nOptions:\n  --depth <number>\n  --limit <number>\n  --format markdown|json\n  --ecc-root <path>');
  }

  const kuId = relArgs[0];
  const flags = parseFlags(relArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const results = getRelatedTopics(kuId, {
      depth: flags.depth ? parseInt(flags.depth, 10) : 1,
      limit: flags.limit ? parseInt(flags.limit, 10) : 20,
      explicitEccRoot: getEccRoot(flags),
    });

    if (format === 'json') {
      logRet(JSON.stringify({ knowledgeUnitId: kuId, relatedTopics: results }, null, 2));
    } else {
      const lines = [`# Related Topics for \`${kuId}\``, ''];
      if (results.length === 0) {
        lines.push('No related topics found.');
      } else {
        for (const r of results) {
          lines.push(`- **\`${r.id}\`**`);
          if (r.reason) lines.push(`  - Reason: ${r.reason}`);
          if (r.depth !== undefined) lines.push(`  - Depth: ${r.depth}`);
          lines.push('');
        }
      }
      logRet(lines.join('\n'));
    }
  } catch (e) {
    err(e.message);
  }
}

function cmdValidate(validateArgs) {
  const flags = parseFlags(validateArgs);

  try {
    const results = validateIntelligence({
      explicitEccRoot: getEccRoot(flags),
    });

    if (flags.format === 'json') {
      logRet(JSON.stringify(results, null, 2));
    } else {
      const lines = [`# ECC Intelligence Validation`, ''];
      lines.push(`**Status:** ${results.valid ? '✓ VALID' : '✗ ISSUES FOUND'}`);
      lines.push(`**Knowledge Units:** ${results.knowledgeUnitCount}`);
      lines.push(`**Dependency Edges:** ${results.dependencyEdgeCount}`);
      lines.push(`**Relationship Edges:** ${results.relationshipEdgeCount}`);
      lines.push(`**Aliases:** ${results.aliasesCount}`);
      lines.push(`**External Concepts:** ${results.externalConceptsCount}`);
      lines.push('');

      if (results.issues.length > 0) {
        lines.push(`### Issues (${results.issues.length})`);
        lines.push('');
        for (const issue of results.issues) {
          lines.push(`- ${issue}`);
        }
        lines.push('');
      } else {
        lines.push('No issues found. All structures are consistent.');
        lines.push('');
      }

      logRet(lines.join('\n'));
    }

    if (!results.valid) process.exit(1);
  } catch (e) {
    err(e.message);
  }
}

function showHelp() {
  const lines = [];
  lines.push('');
  lines.push(`Laravel ECC v${pkg.version}`);
  lines.push('');
  lines.push('The npm package contains the CLI and MCP adapter.');
  lines.push('Retrieval requires access to a full Laravel ECC checkout.');
  lines.push('Run `laravel-ecc setup` to configure it.');
  lines.push('');
  lines.push('Onboarding:');
  lines.push('  laravel-ecc setup --ecc-root "<path>"   Configure ECC root');
  lines.push('  laravel-ecc doctor                      Diagnose configuration');
  lines.push('');
  lines.push('Project installation:');
  lines.push('  laravel-ecc install [--profile core|full|minimal]   Install Laravel ECC skills');
  lines.push('  laravel-ecc add <component>                          Add a component');
  lines.push('  laravel-ecc update                                   Update to latest version');
  lines.push('');
  lines.push('Retrieval commands:');
  lines.push('  laravel-ecc retrieve "<query>" [options]             Retrieve ECC context bundle');
  lines.push('  laravel-ecc search "<query>" [options]               Search knowledge units');
  lines.push('  laravel-ecc get <ku-id> [options]                    Get knowledge unit details');
  lines.push('  laravel-ecc prerequisites <ku-id> [options]          Get prerequisites');
  lines.push('  laravel-ecc related <ku-id> [options]                Get related topics');
  lines.push('  laravel-ecc validate [options]                       Validate intelligence layer');
  lines.push('');
  lines.push('Options:');
  lines.push('  --help                                                Show this help');
  lines.push('');
  lines.push('Retrieval Options:');
  lines.push('  --mode compact|standard|deep              Context bundle mode (default: standard)');
  lines.push('  --format markdown|json                    Output format (default: markdown)');
  lines.push('  --ecc-root <path>                         Path to laravel-ecc repository root');
  lines.push('  --max-kus <number>                        Max knowledge units to include');
  lines.push('  --max-rules <number>                      Max rules to include');
  lines.push('  --max-skills <number>                     Max skills to include');
  lines.push('  --max-related <number>                    Max related topics (retrieve)');
  lines.push('  --max-prerequisites <number>              Max prerequisites (retrieve)');
  lines.push('  --prerequisite-depth <number>             Prerequisite graph depth (default: 1)');
  lines.push('  --related-depth <number>                  Related topic graph depth (default: 1)');
  lines.push('  --budget <number>                         Estimated token budget');
  lines.push('  --domain <domain-id>                      Filter by domain (search only)');
  lines.push('  --limit <number>                          Result limit (search/prerequisites/related)');
  lines.push('  --depth <number>                          Graph depth (prerequisites/related)');
  lines.push('  --include-content                         Include Markdown content (get only)');
  lines.push('');
  lines.push('Profiles:');
  lines.push('  minimal   Skills only (3 skills)');
  lines.push('  core      6 skills + rules + agents (default)');
  lines.push('  full      Everything + commands + harness configs');
  lines.push('');
  lines.push('Components:');
  lines.push('  laravel-patterns        Laravel 13 architecture patterns (Actions, DTOs, Eloquent, Queues)');
  lines.push('  laravel-tdd             Laravel 13 testing with Pest 4 (feature tests, fakes, architecture)');
  lines.push('  laravel-security        Laravel 13 security (mass assignment, XSS, CSRF, Gates, rate limiting)');
  lines.push('  laravel-core-internals  Laravel 13 core internals (Container, DI, Providers, Facades, Lifecycle, Contracts)');
  lines.push('  laravel-artisan         Artisan command generation agent');
  lines.push('  laravel-eloquent        Eloquent ORM optimization agent');
  lines.push('  laravel-database        Database engineering skill (SQL, indexing, PostgreSQL, vector search)');
  lines.push('  laravel-migration       Database migration design agent');
  lines.push('  laravel-container       Container, DI, provider, facade architecture agent');
  lines.push('');
  lines.push('Also install via install scripts:');
  lines.push('  ./install.ps1 --profile minimal|core|full   Windows');
  lines.push('  ./install.sh --profile minimal|core|full    macOS/Linux');
  lines.push('');
  lines.push('ECC_ROOT environment variable:');
  lines.push('  Set ECC_ROOT to the laravel-ecc repository path for retrieval commands.');
  lines.push('');
  console.log(lines.join('\n'));
}

const args = process.argv.slice(2);
const target = process.cwd();

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

if (args[0] === 'setup') {
  cmdSetup(args.slice(1));
  process.exit(0);
}

if (args[0] === 'doctor') {
  cmdDoctor(args.slice(1));
  process.exit(0);
}

if (args[0] === 'install') {
  const profile = args[1] === '--profile' ? args[2] || 'core' : 'core';
  install(target, profile);
  process.exit(0);
}

if (args[0] === 'add') {
  const component = args[1];
  if (!component) {
    err('Usage: npx laravel-ecc add <component>');
  }
  addComponent(target, component);
  process.exit(0);
}

if (args[0] === 'update') {
  doUpdate(target);
  process.exit(0);
}

if (args[0] === 'retrieve') {
  cmdRetrieve(args.slice(1));
  process.exit(0);
}

if (args[0] === 'search') {
  cmdSearch(args.slice(1));
  process.exit(0);
}

if (args[0] === 'get') {
  cmdGet(args.slice(1));
  process.exit(0);
}

if (args[0] === 'prerequisites') {
  cmdPrerequisites(args.slice(1));
  process.exit(0);
}

if (args[0] === 'related') {
  cmdRelated(args.slice(1));
  process.exit(0);
}

if (args[0] === 'validate') {
  cmdValidate(args.slice(1));
  process.exit(0);
}

err(`Unknown command: ${args[0]}. Use --help to see usage.`);
