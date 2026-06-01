#!/usr/bin/env node
import { existsSync, readFileSync, copyFileSync, mkdirSync, cpSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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

function doctor(target) {
  const state = readState(target);
  if (state) {
    log(`Package version: ${pkg.version}`);
    log(`Installed version: ${state.version}`);
    log(`Profile: ${state.profile}`);
    log(`Installed at: ${state.installed_at}`);
    log(`Components: ${(state.components || []).join(', ')}`);
    log(`Tools detected: ${(state.tools || []).join(', ')}`);
    if (state.version !== pkg.version) {
      warn(`Version mismatch! Installed ${state.version}, package is ${pkg.version}. Run 'npx laravel-ecc update' to sync.`);
    }
  } else {
    log('Not installed. Run `npx laravel-ecc install` or `install.ps1` / `install.sh` to install.');
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

function showHelp() {
  console.log(`
Laravel ECC v${pkg.version}

Usage:
  npx laravel-ecc install [--profile core|full|minimal]   Install Laravel ECC
  npx laravel-ecc add <component>                          Add a component
  npx laravel-ecc update                                   Update to latest version
  npx laravel-ecc doctor                                   Check installation state
  npx laravel-ecc --help                                   Show this help

Profiles:
  minimal   Skills only (3 skills)
  core      6 skills + rules + agents (default)
  full      Everything + commands + harness configs

Components:
  laravel-patterns        Laravel 13 architecture patterns (Actions, DTOs, Eloquent, Queues)
  laravel-tdd             Laravel 13 testing with Pest 4 (feature tests, fakes, architecture)
  laravel-security        Laravel 13 security (mass assignment, XSS, CSRF, Gates, rate limiting)
  laravel-core-internals  Laravel 13 core internals (Container, DI, Providers, Facades, Lifecycle, Contracts)
  laravel-artisan         Artisan command generation agent
  laravel-eloquent        Eloquent ORM optimization agent
  laravel-database        Database engineering skill (SQL, indexing, PostgreSQL, vector search)
  laravel-migration       Database migration design agent
  laravel-container       Container, DI, provider, facade architecture agent

Also install via install scripts:
  ./install.ps1 --profile minimal|core|full   Windows
  ./install.sh --profile minimal|core|full    macOS/Linux
`);
}

const args = process.argv.slice(2);
const target = process.cwd();

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

if (args[0] === 'doctor') {
  doctor(target);
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

err(`Unknown command: ${args[0]}. Use --help to see usage.`);
