#!/usr/bin/env node
/**
 * laravel-ecc.mjs — CLI for adding Laravel ECC components
 *
 * Usage:
 *   npx laravel-ecc add laravel-patterns     # Add a skill
 *   npx laravel-ecc doctor                   # Check state
 *   npx laravel-ecc --help                   # Show help
 */

import { existsSync, readFileSync, copyFileSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

const VALID_COMPONENTS = [
  'laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals',
  'laravel-artisan', 'laravel-eloquent', 'laravel-migration', 'laravel-container',
];

function log(msg) { console.log(`[Laravel ECC] ${msg}`); }
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

function addComponent(target, component) {
  if (!VALID_COMPONENTS.includes(component)) {
    err(`Unknown component: ${component}. Valid: ${VALID_COMPONENTS.join(', ')}`);
  }

  // Skills
  const skillDir = join(ROOT, 'skills', component);
  if (existsSync(skillDir)) {
    const dest = join(target, 'skills', component);
    mkdirSync(join(target, 'skills'), { recursive: true });
    cpSync(skillDir, dest, { recursive: true });
    log(`Added skill: ${component} → ${dest}`);
    return;
  }

  // Agents
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
  const stateFile = join(target, '.laravel-ecc-state.json');
  if (existsSync(stateFile)) {
    const state = JSON.parse(readFileSync(stateFile, 'utf-8'));
    log(`Version: ${state.version}`);
    log(`Profile: ${state.profile}`);
    log(`Installed at: ${state.installed_at}`);
    log(`Components: ${state.components.join(', ')}`);
  } else {
    log('Not installed. Run `npx laravel-ecc` or `install.ps1` / `install.sh` to install.');
  }
}

function showHelp() {
  console.log(`
Laravel ECC v${pkg.version}

Usage:
  npx laravel-ecc add <component>    Add a Laravel ECC component
  npx laravel-ecc doctor             Check installation state
  npx laravel-ecc --help             Show this help

Components:
  laravel-patterns        Laravel 13 architecture patterns (Actions, DTOs, Eloquent, Queues)
  laravel-tdd             Laravel 13 testing with Pest 4 (feature tests, fakes, architecture)
  laravel-security        Laravel 13 security (mass assignment, XSS, CSRF, Gates, rate limiting)
  laravel-core-internals  Laravel 13 core internals (Container, DI, Providers, Facades, Lifecycle, Contracts)
  laravel-artisan         Artisan command generation agent
  laravel-eloquent        Eloquent ORM optimization agent
  laravel-migration       Database migration design agent
  laravel-container       Container, DI, provider, facade architecture agent

Also install via install scripts:
  ./install.ps1 --profile minimal|core|full   Windows
  ./install.sh --profile minimal|core|full    macOS/Linux
`);
}

const args = process.argv.slice(2);
const target = process.cwd();

if (args.length === 0 || args[0] === '--help') {
  showHelp();
  process.exit(0);
}

if (args[0] === 'doctor') {
  doctor(target);
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

err(`Unknown command: ${args[0]}. Use --help to see usage.`);
