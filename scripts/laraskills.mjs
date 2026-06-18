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
  validateIntelligenceRoot,
} from '../src/runtime/ecc-root-resolver.mjs';
import {
  getConfigPath,
  getLegacyConfigPath,
  loadConfigWithSource,
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

function log(msg) { console.log(`[LaraSkills] ${msg}`); }
function warn(msg) { console.warn(`[LaraSkills] WARNING: ${msg}`); }
function err(msg) { console.error(`[LaraSkills] ERROR: ${msg}`); process.exit(1); }
function logRet(msg) { console.log(msg); }

function printVersion() {
  console.log(`LaraSkills v${pkg.version}`);
  process.exit(0);
}

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
  const stateFile = join(target, '.laraskills-state.json');
  if (existsSync(stateFile)) {
    return JSON.parse(readFileSync(stateFile, 'utf-8'));
  }
  const legacyStateFile = join(target, '.laravel-ecc-state.json');
  if (!existsSync(legacyStateFile)) return null;
  return {
    ...JSON.parse(readFileSync(legacyStateFile, 'utf-8')),
    legacyStateFile,
  };
}

function writeState(target, state) {
  const { legacyStateFile, ...persistedState } = state;
  writeFileSync(join(target, '.laraskills-state.json'), JSON.stringify(persistedState, null, 2));
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

  log('LaraSkills setup');
  console.log('');

  let result;
  try {
    result = resolveEccRootWithPrecedence({
      explicitLaraskillsRoot: flags.laraskillsroot || null,
      explicitEccRoot: flags.eccroot || null,
    });
  } catch (error) {
    console.error(error.message);
    console.log('');
    log('Provide the full LaraSkills checkout path:');
    console.log(`  laraskills setup --laraskills-root "/path/to/laraskills"`);
    console.log('');
    log('To clone the repository first:');
    console.log(`  git clone https://github.com/elmochilyas/laraskills.git`);
    console.log(`  laraskills setup --laraskills-root "./laraskills"`);
    process.exit(1);
  }

  if (result.legacyFallback) {
    warn(`Using compatibility fallback: ${result.legacyReason}. Migrate to --laraskills-root or LARASKILLS_ROOT.`);
  }

  const intelligenceCheck = validateIntelligenceRoot(result.root);
  const savedPath = saveConfig(result.root);

  console.log('LaraSkills setup complete.');
  console.log('');
  console.log(`Config file:      ${savedPath}`);
  console.log(`LaraSkills root:  ${result.root}`);
  console.log(`Source:           ${result.source}`);
  console.log(`Intelligence:     ${intelligenceCheck.valid ? 'VALID' : 'INCOMPLETE'}`);
  if (!intelligenceCheck.valid) {
    console.log(`  Missing files: ${intelligenceCheck.missingFiles.join(', ')}`);
  }
  console.log('');
  console.log('Next steps:');
  console.log(`  laraskills doctor              Verify configuration`);
  console.log(`  laraskills retrieve "<task>"   Get context for a task`);
  console.log(`  laraskills search "<query>"    Search knowledge units`);
  console.log(`  laraskills validate            Validate intelligence layer`);
  console.log('');
}

function cmdDoctor(doctorArgs) {
  const flags = parseFlags(doctorArgs || []);
  const configPath = getConfigPath();
  const legacyConfigPath = getLegacyConfigPath();
  const configExists = existsSync(configPath);
  const legacyConfigExists = existsSync(legacyConfigPath);
  const envLaraskillsRoot = process.env.LARASKILLS_ROOT || 'not set';
  const envEccRoot = process.env.ECC_ROOT || 'not set';

  console.log('LaraSkills Doctor');
  console.log('');
  console.log(`Package version:       ${pkg.version}`);
  console.log(`Node.js:               ${process.version}`);
  console.log(`Platform:              ${process.platform}`);
  console.log(`Config file:           ${configPath}`);
  console.log(`Config exists:         ${configExists ? 'yes' : 'no'}`);
  console.log(`Legacy config file:    ${legacyConfigPath}`);
  console.log(`Legacy config exists:  ${legacyConfigExists ? 'yes' : 'no'}`);

  if (configExists || legacyConfigExists) {
    try {
      const loaded = loadConfigWithSource();
      console.log(`Config root:           ${loaded.config.laraskillsRoot}`);
      console.log(`Config source:         ${loaded.source}`);
      if (loaded.legacy) {
        console.log(`Compatibility notice:  ${loaded.legacyReasons.join(', ')}`);
      }
    } catch (error) {
      console.log(`Config root:           ERROR - ${error.message}`);
    }
  }

  console.log(`LARASKILLS_ROOT env:   ${envLaraskillsRoot}`);
  console.log(`ECC_ROOT env:          ${envEccRoot}`);

  let resolvedRoot = null;
  let resolutionSource = '';
  let compatibilityNotice = null;
  let resolutionError = null;

  try {
    const result = resolveEccRootWithPrecedence({
      explicitLaraskillsRoot: flags.laraskillsroot || null,
      explicitEccRoot: flags.eccroot || null,
    });
    resolvedRoot = result.root;
    resolutionSource = result.source;
    compatibilityNotice = result.legacyFallback ? result.legacyReason : null;
    console.log(`Resolved root:         ${resolvedRoot}`);
    console.log(`Resolution source:     ${resolutionSource}`);
    console.log(`Legacy fallback:       ${compatibilityNotice ? 'yes' : 'no'}`);
    if (compatibilityNotice) {
      console.log(`Compatibility notice:  ${compatibilityNotice}`);
      console.log(`Migration action:      use --laraskills-root, LARASKILLS_ROOT, or the new LaraSkills config`);
    }
  } catch (e) {
    resolutionError = e.message;
    console.log(`Resolved root:         NOT FOUND`);
    console.log(`Resolution source:     none`);
    console.log(`Legacy fallback:       no`);
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

    const mcpPath = join(resolvedRoot, 'scripts', 'laraskills-mcp.mjs');
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
    return;
  } else {
    console.log('Status: ACTION REQUIRED');
    if (resolutionError) {
      console.log('');
      console.log('Fix:');
      console.log(`  laraskills setup --laraskills-root "/path/to/laraskills"`);
      console.log('');
      console.log('To clone the full repository:');
      console.log(`  git clone https://github.com/elmochilyas/laraskills.git`);
    }
    process.exit(1);
  }
}

function install(target, profile) {
  const detected = detectTools(target);
  log(`LaraSkills v${pkg.version}`);
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
    err('Not installed. Run `npx laraskills install` first.');
  }

  if (state.legacyStateFile) {
    warn(`Migrating legacy state file ${state.legacyStateFile} to .laraskills-state.json.`);
  }
  log(`LaraSkills v${pkg.version}`);
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

function getLaraskillsRoot(flags) {
  return flags.laraskillsroot
    || flags.eccroot
    || process.env.LARASKILLS_ROOT
    || process.env.ECC_ROOT
    || null;
}

function cmdRetrieve(retrieveArgs) {
  if (retrieveArgs.length === 0) {
    err('Usage: npx laraskills retrieve "<query>" [options]\n\nOptions:\n  --mode compact|standard|deep\n  --format markdown|json\n  --laraskills-root <path>\n  --ecc-root <path> (deprecated alias)\n  --max-kus <number>\n  --max-rules <number>\n  --max-skills <number>\n  --max-related <number>\n  --max-prerequisites <number>\n  --prerequisite-depth <number>\n  --related-depth <number>\n  --budget <number>\n  --domain <domain-id>');
  }

  const query = retrieveArgs[0];
  const flags = parseFlags(retrieveArgs.slice(1));

  try {
    const result = retrieveAndFormat(query, {
      mode: flags.mode || 'standard',
      format: flags.format || 'markdown',
      explicitEccRoot: getLaraskillsRoot(flags),
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
    err('Usage: npx laraskills search "<query>" [options]\n\nOptions:\n  --format markdown|json\n  --limit <number>\n  --domain <domain-id>\n  --laraskills-root <path>\n  --ecc-root <path> (deprecated alias)');
  }

  const query = searchArgs[0];
  const flags = parseFlags(searchArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const results = searchKnowledge(query, {
      limit: flags.limit ? parseInt(flags.limit, 10) : 20,
      domain: flags.domain || undefined,
      explicitEccRoot: getLaraskillsRoot(flags),
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
    err('Usage: npx laraskills get <knowledge-unit-id> [options]\n\nOptions:\n  --include-content\n  --format markdown|json\n  --laraskills-root <path>\n  --ecc-root <path> (deprecated alias)');
  }

  const kuId = getArgs[0];
  const flags = parseFlags(getArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const result = getKnowledgeUnit(kuId, {
      includeContent: !!flags.includecontent,
      explicitEccRoot: getLaraskillsRoot(flags),
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
    err('Usage: npx laraskills prerequisites <knowledge-unit-id> [options]\n\nOptions:\n  --depth <number>\n  --format markdown|json\n  --laraskills-root <path>\n  --ecc-root <path> (deprecated alias)');
  }

  const kuId = preArgs[0];
  const flags = parseFlags(preArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const results = getPrerequisites(kuId, {
      depth: flags.depth ? parseInt(flags.depth, 10) : 1,
      limit: flags.limit ? parseInt(flags.limit, 10) : 20,
      explicitEccRoot: getLaraskillsRoot(flags),
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
    err('Usage: npx laraskills related <knowledge-unit-id> [options]\n\nOptions:\n  --depth <number>\n  --limit <number>\n  --format markdown|json\n  --laraskills-root <path>\n  --ecc-root <path> (deprecated alias)');
  }

  const kuId = relArgs[0];
  const flags = parseFlags(relArgs.slice(1));
  const format = flags.format || 'markdown';

  try {
    const results = getRelatedTopics(kuId, {
      depth: flags.depth ? parseInt(flags.depth, 10) : 1,
      limit: flags.limit ? parseInt(flags.limit, 10) : 20,
      explicitEccRoot: getLaraskillsRoot(flags),
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
      explicitEccRoot: getLaraskillsRoot(flags),
    });

    if (flags.format === 'json') {
      logRet(JSON.stringify(results, null, 2));
    } else {
      const lines = [`# LaraSkills Intelligence Validation`, ''];
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
  lines.push(`LaraSkills v${pkg.version}`);
  lines.push('');
  lines.push('Laravel knowledge for AI coding agents.');
  lines.push('');
  lines.push('Quick start:');
  lines.push('  npm install -g laraskills');
  lines.push('  laraskills setup --laraskills-root "<path>"   Connect to the full checkout');
  lines.push('  cd my-laravel-project');
  lines.push('  laraskills init                               Prepare the project');
  lines.push('  laraskills retrieve "<task>"                  Get context for an AI agent');
  lines.push('');
  lines.push('Machine setup:');
  lines.push('  setup       Connect the CLI/MCP to the full LaraSkills checkout');
  lines.push('  doctor      Diagnose configuration and readiness');
  lines.push('');
  lines.push('Project commands:');
  lines.push('  init        Prepare the current Laravel project (recommended)');
  lines.push('  install     Install LaraSkills project files (legacy, use init instead)');
  lines.push('  update      Refresh installed LaraSkills project files');
  lines.push('  add         Add one component (skill or agent)');
  lines.push('');
  lines.push('Retrieval commands:');
  lines.push('  retrieve    Retrieve a task-focused Laravel context bundle');
  lines.push('  search      Search knowledge units');
  lines.push('  get         Show one knowledge unit');
  lines.push('  prerequisites  Show prerequisite knowledge');
  lines.push('  related     Show related knowledge');
  lines.push('  validate    Validate the intelligence layer');
  lines.push('');
  lines.push('Advanced:');
  lines.push('  --help, -v, --version');
  lines.push('');
  lines.push('Options:');
  lines.push('  --help        Show this help');
  lines.push('  -v, --version Show version');
  lines.push('  <command> --help  Show command-specific help');
  lines.push('');
  lines.push('Retrieval options:');
  lines.push('  --mode compact|standard|deep          Context bundle mode (default: standard)');
  lines.push('  --format markdown|json                Output format (default: markdown)');
  lines.push('  --laraskills-root <path>              Path to LaraSkills checkout');
  lines.push('  --ecc-root <path>                     Deprecated alias for --laraskills-root');
  lines.push('  --max-kus, --max-rules, --max-skills  Result limits');
  lines.push('  --budget <number>                     Estimated token budget');
  lines.push('  --domain <domain-id>                  Filter by domain');
  lines.push('  --include-content                     Include Markdown content (get only)');
  lines.push('');
  lines.push('Profiles (init/install):');
  lines.push('  minimal   3 starter skills + rules, hooks, MCP configs, Artisan agent');
  lines.push('  core      6 core skills + rules, hooks, MCP configs, 5 agents (default)');
  lines.push('  full      Core profile + commands and harness configs');
  lines.push('');
  lines.push('Examples:');
  lines.push('  laraskills init');
  lines.push('  laraskills init --profile minimal');
  lines.push('  laraskills retrieve "Add authorization policy and Pest tests"');
  lines.push('  laraskills get "security-identity-engineering/authorization/policies-model" --include-content');
  lines.push('');
  lines.push('Environment:');
  lines.push('  LARASKILLS_ROOT   Path to the LaraSkills checkout');
  lines.push('');
  console.log(lines.join('\n'));
}

function showCommandHelp(command) {
  const help = {
    setup: [
      '',
      'Usage: laraskills setup --laraskills-root <path>',
      '',
      'Configure the CLI and MCP server to use a full LaraSkills checkout.',
      'This is a one-time machine setup step.',
      '',
      'Options:',
      '  --laraskills-root <path>   Path to the cloned LaraSkills repository',
      '  --ecc-root <path>          Deprecated alias',
      '',
      'Examples:',
      '  laraskills setup --laraskills-root "C:\\path\\to\\laraskills"',
      '',
      'See also:',
      '  laraskills doctor    Diagnose configuration and readiness',
      '',
    ],
    doctor: [
      '',
      'Usage: laraskills doctor [--laraskills-root <path>]',
      '',
      'Diagnose the package configuration, intelligence file availability,',
      'retrieval readiness, and MCP adapter health.',
      '',
      'A release-ready setup reports Status: HEALTHY.',
      '',
      'Options:',
      '  --laraskills-root <path>   Override the LaraSkills checkout path',
      '',
      'Examples:',
      '  laraskills doctor',
      '  laraskills doctor --laraskills-root "C:\\path\\to\\laraskills"',
      '',
    ],
    init: [
      '',
      'Usage: laraskills init [--profile minimal|core|full]',
      '',
      'Prepare the current Laravel project for LaraSkills by installing',
      'skills, agents, rules, hooks, MCP configs, and a .laraskills-state.json file.',
      '',
      'This is the recommended command for project setup.',
      '',
      'Profiles:',
      '  minimal   3 starter skills + shared rules, hooks, MCP configs, and Artisan agent',
      '  core      6 core skills + shared rules, hooks, MCP configs, and 5 agents (default)',
      '  full      Core profile + commands and harness configs',
      '',
      'Examples:',
      '  laraskills init',
      '  laraskills init --profile minimal',
      '  laraskills init --profile full',
      '',
    ],
    install: [
      '',
      'Usage: laraskills install [--profile minimal|core|full]',
      '',
      'Install LaraSkills project files into the current project.',
      '',
      'Note: `laraskills init` is the recommended command for new users.',
      '  install is kept for backward compatibility and behaves identically.',
      '',
      'Profiles:',
      '  minimal   3 starter skills + shared rules, hooks, MCP configs, and Artisan agent',
      '  core      6 core skills + shared rules, hooks, MCP configs, and 5 agents (default)',
      '  full      Core profile + commands and harness configs',
      '',
      'Examples:',
      '  laraskills install',
      '  laraskills install --profile core',
      '',
    ],
    add: [
      '',
      'Usage: laraskills add <component>',
      '',
      'Add one supported skill or agent to the current project.',
      '',
      'Valid components:',
      '  laravel-patterns, laravel-tdd, laravel-security, laravel-core-internals,',
      '  laravel-eloquent, laravel-database, laravel-artisan, laravel-migration,',
      '  laravel-container',
      '',
      'Examples:',
      '  laraskills add laravel-eloquent',
      '',
    ],
    update: [
      '',
      'Usage: laraskills update',
      '',
      'Refresh the LaraSkills files already installed inside the current project.',
      'This updates skills, agents, rules, hooks, MCP configs, and state file',
      'to match the current CLI package version.',
      '',
      'Note: To update the CLI package itself, use:',
      '  npm install -g laraskills     (global install)',
      '  npm update -g laraskills      (global update)',
      '  npm install --save-dev laraskills  (local project update)',
      '',
      'Examples:',
      '  laraskills update',
      '',
    ],
    retrieve: [
      '',
      'Usage: laraskills retrieve "<query>" [options]',
      '',
      'Retrieve a ranked context bundle for a Laravel engineering task.',
      'Returns knowledge units, rules, skills, decision trees, anti-patterns,',
      'and checklists relevant to the task.',
      '',
      'Options:',
      '  --mode compact|standard|deep          Bundle size (default: standard)',
      '  --format markdown|json                Output format (default: markdown)',
      '  --laraskills-root <path>              Path to LaraSkills checkout',
      '  --max-kus <number>                    Max knowledge units',
      '  --max-rules <number>                  Max rules',
      '  --max-skills <number>                 Max skills',
      '  --budget <number>                     Estimated token budget',
      '',
      'Examples:',
      '  laraskills retrieve "Build a products API with Form Requests and policies" --mode compact',
      '  laraskills retrieve "Optimize Eloquent N+1 query" --mode standard --format json',
      '',
    ],
    search: [
      '',
      'Usage: laraskills search "<query>" [options]',
      '',
      'Search ranked knowledge units and return canonical IDs.',
      '',
      'Options:',
      '  --format markdown|json                Output format (default: markdown)',
      '  --limit <number>                      Max results (default: 20)',
      '  --domain <domain-id>                  Filter by engineering domain',
      '  --laraskills-root <path>              Path to LaraSkills checkout',
      '',
      'Examples:',
      '  laraskills search "Sanctum tenant authentication"',
      '  laraskills search "composite indexes" --domain data-storage-systems --limit 10',
      '',
    ],
    get: [
      '',
      'Usage: laraskills get <knowledge-unit-id> [options]',
      '',
      'Inspect one canonical knowledge unit by its ID.',
      '',
      'Options:',
      '  --include-content                     Include the full knowledge document',
      '  --format markdown|json                Output format (default: markdown)',
      '  --laraskills-root <path>              Path to LaraSkills checkout',
      '',
      'Examples:',
      '  laraskills get security-identity-engineering/authorization/policies-model',
      '  laraskills get security-identity-engineering/authorization/policies-model --include-content',
      '',
    ],
    prerequisites: [
      '',
      'Usage: laraskills prerequisites <knowledge-unit-id> [options]',
      '',
      'Show prerequisite knowledge units for the given KU.',
      '',
      'Options:',
      '  --depth <number>                      Graph expansion depth (default: 1)',
      '  --limit <number>                      Max results (default: 20)',
      '  --format markdown|json',
      '  --laraskills-root <path>',
      '',
      'Examples:',
      '  laraskills prerequisites security-identity-engineering/authorization/policies-model',
      '',
    ],
    related: [
      '',
      'Usage: laraskills related <knowledge-unit-id> [options]',
      '',
      'Show related knowledge units for the given KU.',
      '',
      'Options:',
      '  --depth <number>                      Graph expansion depth (default: 1)',
      '  --limit <number>                      Max results (default: 20)',
      '  --format markdown|json',
      '  --laraskills-root <path>',
      '',
      'Examples:',
      '  laraskills related security-identity-engineering/authorization/policies-model',
      '',
    ],
    validate: [
      '',
      'Usage: laraskills validate [options]',
      '',
      'Validate the intelligence graph: knowledge unit records, graph edges,',
      'aliases, relationships, and structural integrity.',
      '',
      'Options:',
      '  --format markdown|json                Output format (default: markdown)',
      '  --laraskills-root <path>              Path to LaraSkills checkout',
      '',
      'Examples:',
      '  laraskills validate',
      '  laraskills validate --format json',
      '',
    ],
  };

  if (!help[command]) return false;
  console.log(help[command].join('\n'));
  return true;
}

const args = process.argv.slice(2);
const target = process.cwd();

// Version flags — must be checked before anything else
if (args.length === 1 && (args[0] === '-v' || args[0] === '--version')) {
  printVersion();
}

const commandHelpRequested = args.slice(1).some(arg => arg === '--help' || arg === '-h');

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
} else if (commandHelpRequested) {
  if (!showCommandHelp(args[0])) {
    err(`Unknown command: ${args[0]}. Use --help to see usage.`);
  }
} else if (args[0] === 'setup') {
  cmdSetup(args.slice(1));
} else if (args[0] === 'doctor') {
  cmdDoctor(args.slice(1));
} else if (args[0] === 'init') {
  // init is the recommended command; delegates to install with profile support
  const profileFlag = args.indexOf('--profile');
  const profile = profileFlag !== -1 ? (args[profileFlag + 1] || 'core') : 'core';
  install(target, profile);
} else if (args[0] === 'install') {
  // install is kept for backward compatibility
  const profileFlag = args.indexOf('--profile');
  const profile = profileFlag !== -1 ? (args[profileFlag + 1] || 'core') : 'core';
  console.log('');
  log('Tip: `laraskills init` is now the recommended command for preparing a project.');
  console.log('');
  install(target, profile);
} else if (args[0] === 'add') {
  const component = args[1];
  if (!component) {
    err('Usage: npx laraskills add <component>');
  }
  addComponent(target, component);
} else if (args[0] === 'update') {
  doUpdate(target);
} else if (args[0] === 'retrieve') {
  cmdRetrieve(args.slice(1));
} else if (args[0] === 'search') {
  cmdSearch(args.slice(1));
} else if (args[0] === 'get') {
  cmdGet(args.slice(1));
} else if (args[0] === 'prerequisites') {
  cmdPrerequisites(args.slice(1));
} else if (args[0] === 'related') {
  cmdRelated(args.slice(1));
} else if (args[0] === 'validate') {
  cmdValidate(args.slice(1));
} else {
  err(`Unknown command: ${args[0]}. Use --help to see usage.`);
}
