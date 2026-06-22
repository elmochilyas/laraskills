import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

export function isLaravelProject(target) {
  const markers = [
    'artisan',
    join('app', 'Models'),
    join('app', 'Http', 'Controllers'),
  ];
  const phpMarkers = ['composer.json'];
  const hasPhpMarker = phpMarkers.some(f => existsSync(join(target, f)));
  if (!hasPhpMarker) return false;

  for (const marker of markers) {
    if (existsSync(join(target, marker))) return true;
  }

  const composerPath = join(target, 'composer.json');
  if (existsSync(composerPath)) {
    try {
      const composer = JSON.parse(require('node:fs').readFileSync(composerPath, 'utf-8'));
      const deps = { ...composer.require, ...(composer['require-dev'] || {}) };
      if (deps['laravel/framework']) return true;
    } catch {}
  }

  return false;
}

function createPrompter() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function question(prompt) {
    return new Promise(resolve => {
      rl.question(prompt, answer => {
        resolve(answer.trim());
      });
    });
  }

  function close() {
    rl.close();
  }

  return { question, close };
}

export function isTerminalInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY;
}

function log(msg) { console.log(`  ${msg}`); }

export async function runInteractiveInit({ target, flags }) {
  const isInteractive = isTerminalInteractive();
  const skipPrompts = flags.yes || flags.y || isInteractive === false;

  console.log('');
  console.log('  LaraSkills Init');
  console.log('  ===============');
  console.log('');

  const isLaravel = isLaravelProject(target);
  log(`Project detection: ${isLaravel ? 'Laravel project detected' : 'NOT a Laravel project'}`);
  log(`Target: ${target}`);
  console.log('');

  let profile = flags.profile || (isInteractive && !skipPrompts ? null : 'core');
  let toolIds = parseToolsArg(flags.tools || flags.tool || '');
  let dryRun = flags.dryrun || flags.dryRun || false;

  if (!skipPrompts) {
    const prompter = createPrompter();

    try {
      if (!profile) {
        console.log('  Choose a profile:');
        console.log('    1. core (recommended) — 6 core skills, 5 agents, rules, hooks, MCP configs');
        console.log('    2. minimal — 3 starter skills, 1 agent, rules, hooks, MCP configs');
        console.log('    3. full — core + commands + harness configs for 12 AI tools');
        console.log('');
        const profileChoice = await prompter.question('  Profile [1]: ');
        const profileMap = { '1': 'core', '2': 'minimal', '3': 'full', '': 'core' };
        profile = profileMap[profileChoice.trim()] || 'core';
        console.log('');
      }

      if (!toolIds || toolIds.length === 0) {
        console.log('  Which coding tools do you want to configure?');
        console.log('    1. OpenCode (fully supported — MCP + instructions)');
        console.log('    2. Generic MCP config only');
        console.log('    3. OpenCode + Generic MCP (recommended)');
        console.log('    4. None — install project files only');
        console.log('    5. Custom selection');
        console.log('');
        const toolChoice = await prompter.question('  Tools [3]: ');
        const toolMap = {
          '1': ['opencode'],
          '2': ['generic-mcp'],
          '3': ['opencode', 'generic-mcp'],
          '4': [],
          '5': null,
          '': ['opencode', 'generic-mcp'],
        };
        toolIds = toolMap[toolChoice.trim()] || [];
        if (toolChoice.trim() === '5') {
          console.log('');
          console.log('  Available tools:');
          console.log('    opencode      — OpenCode (fully supported)');
          console.log('    generic-mcp   — Generic MCP config');
          console.log('    codex         — Codex CLI (template only)');
          console.log('    claude-code   — Claude Code (template only)');
          console.log('    cursor        — Cursor IDE (template only)');
          console.log('');
          const customTools = await prompter.question('  Enter tool IDs (comma-separated): ');
          toolIds = customTools.split(',').map(t => t.trim()).filter(Boolean);
        }
        console.log('');
      }
    } finally {
      prompter.close();
    }
  } else if (skipPrompts && (!toolIds || toolIds.length === 0) && !flags.tools && !flags.tool) {
    toolIds = ['opencode', 'generic-mcp'];
    log('Non-interactive mode: using defaults (OpenCode + Generic MCP)');
    console.log('');
  }

  if (dryRun) {
    log('DRY RUN — no files will be written');
    console.log('');
  }

  return {
    profile: profile || 'core',
    toolIds: toolIds || [],
    dryRun,
    isLaravel,
  };
}

function parseToolsArg(toolsArg) {
  if (!toolsArg || toolsArg === 'none') return [];
  if (toolsArg === true) return ['opencode', 'generic-mcp'];
  return toolsArg.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}
