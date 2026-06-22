import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const VALID_INTEGRATIONS = ['full', 'mcp-only', 'project-files'];

const ALL_ASSISTANTS = [
  { id: 'opencode', label: 'OpenCode', support: 'configured', desc: 'Auto-configures MCP and project instructions' },
  { id: 'codex', label: 'Codex', support: 'configured', desc: 'Configures MCP via .codex/config.toml' },
  { id: 'cursor', label: 'Cursor', support: 'configured', desc: 'Auto-configures project MCP and IDE rules' },
  { id: 'claude-code', label: 'Claude Code', support: 'configured', desc: 'Configures project MCP through .mcp.json' },
  { id: 'generic-mcp', label: 'Generic MCP', support: 'configured', desc: 'Generates portable MCP config for any MCP-capable client' },
];

const ALL_ASSISTANT_IDS = ALL_ASSISTANTS.map(a => a.id);

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

function printWizardHeader(target, isLaravel) {
  console.log('');
  console.log('  LaraSkills Init');
  console.log('  ===============');
  console.log('');
  console.log('  Project:');
  console.log(`    Path: ${target}`);
  console.log(`    Laravel detected: ${isLaravel ? 'yes' : 'no'}`);
  if (!isLaravel) {
    console.log('    Note: continuing anyway. Some Laravel-specific checks may be skipped.');
  }
  console.log('');
}

async function askAssistants(prompter) {
  console.log('  Step 1 — Choose coding assistants');
  console.log('');

  for (let i = 0; i < ALL_ASSISTANTS.length; i++) {
    const a = ALL_ASSISTANTS[i];
    console.log(`    ${i + 1}. ${a.label}`);
    console.log(`       ${a.desc}`);
    console.log('');
  }

  console.log(`    ${ALL_ASSISTANTS.length + 1}. None`);
  console.log('       Install project files only');
  console.log('');
  console.log('  Tip: select multiple with comma (e.g. 1,2,3) or type "all"');
  console.log('');

  const choice = await prompter.question('  Select assistants [all]: ');

  const trimmed = choice.trim().toLowerCase();
  if (!trimmed || trimmed === 'all' || trimmed === 'auto') {
    return ALL_ASSISTANT_IDS.slice();
  }
  if (trimmed === 'none' || trimmed === String(ALL_ASSISTANTS.length + 1)) {
    return [];
  }

  const parts = trimmed.split(/[\s,]+/).filter(Boolean);
  const result = new Set();

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!Number.isNaN(num) && num >= 1 && num <= ALL_ASSISTANTS.length) {
      result.add(ALL_ASSISTANTS[num - 1].id);
    } else if (ALL_ASSISTANT_IDS.includes(part)) {
      result.add(part);
    } else if (part === 'claude' || part === 'claude-code') {
      result.add('claude-code');
    } else if (part === 'mcp' || part === 'generic') {
      result.add('generic-mcp');
    }
  }

  return [...result];
}

async function askIntegration(prompter) {
  console.log('');
  console.log('  Step 2 — Choose integration level');
  console.log('');
  console.log('    1. Full recommended');
  console.log('       MCP + skills + agents + rules + hooks + configs');
  console.log('');
  console.log('    2. MCP only');
  console.log('       Dynamic LaraSkills knowledge through MCP');
  console.log('');
  console.log('    3. Project files only');
  console.log('       Skills, agents, rules, hooks, no MCP wiring');
  console.log('');
  const choice = await prompter.question('  Integration [1]: ');
  const map = { '1': 'full', '2': 'mcp-only', '3': 'project-files', '': 'full' };
  return map[choice] || 'full';
}

async function askProfile(prompter) {
  console.log('');
  console.log('  Step 3 — Choose LaraSkills profile');
  console.log('');
  console.log('    1. Core recommended');
  console.log('       Best default for Laravel projects');
  console.log('');
  console.log('    2. Minimal');
  console.log('       Smaller setup for testing');
  console.log('');
  console.log('    3. Full');
  console.log('       Everything LaraSkills provides');
  console.log('');
  const choice = await prompter.question('  Profile [1]: ');
  const map = { '1': 'core', '2': 'minimal', '3': 'full', '': 'core' };
  return map[choice] || 'core';
}

function assistantsToLabel(ids) {
  if (ids.length === 0) return 'no assistant';
  return ids.map(id => {
    const a = ALL_ASSISTANTS.find(x => x.id === id);
    return a ? a.label : id;
  }).join(', ');
}

async function askConfirm(prompter, assistants, integration, profile) {
  console.log('');
  console.log('  Review');
  console.log('');
  console.log(`  LaraSkills will:`);
  if (assistants.length > 0) {
    console.log(`    - configure assistants: ${assistantsToLabel(assistants)}`);
  }
  if (assistants.length > 0 && (integration === 'full' || integration === 'mcp-only')) {
    console.log(`    - enable LaraSkills MCP for selected assistants`);
  }
  if (integration === 'full' || integration === 'project-files') {
    console.log(`    - install the ${profile} profile`);
  }
  console.log(`    - create/update project config safely`);
  console.log(`    - preserve existing config and MCP servers`);
  console.log('');
  const answer = await prompter.question('  Continue? [Y/n]: ');
  return answer.toLowerCase() !== 'n' && answer.toLowerCase() !== 'no';
}

export function resolveAssistantsArg(flags) {
  const raw = flags.assistants
    || flags.assistant
    || flags.tools
    || flags.tool
    || null;

  if (!raw || raw === true) return null;

  const str = String(raw).toLowerCase().trim();
  if (str === 'all') return ALL_ASSISTANT_IDS.slice();
  if (str === 'none' || str === 'false') return [];

  const ids = str.split(/[\s,]+/).filter(Boolean).map(s => {
    if (ALL_ASSISTANT_IDS.includes(s)) return s;
    if (s === 'claude') return 'claude-code';
    if (s === 'mcp' || s === 'generic') return 'generic-mcp';
    return s;
  }).filter(id => ALL_ASSISTANT_IDS.includes(id));

  return ids.length > 0 ? ids : null;
}

export function resolveInitOptions(flags) {
  let assistants = resolveAssistantsArg(flags);
  let integration = flags.integration || null;
  let profile = flags.profile || null;

  if (!assistants && (flags.tools || flags.tool)) {
    const raw = flags.tools || flags.tool || '';
    const toolIds = parseToolsArg(raw);
    if (toolIds.length === 0) {
      assistants = [];
      integration = integration || 'project-files';
    } else {
      assistants = toolIds.filter(id => ALL_ASSISTANT_IDS.includes(id) || id === 'none');
      if (assistants.length === 0) assistants = ALL_ASSISTANT_IDS.slice();
      integration = integration || 'full';
    }
  }

  return {
    assistants: assistants || ALL_ASSISTANT_IDS.slice(),
    integration: VALID_INTEGRATIONS.includes(integration) ? integration : 'full',
    profile: profile || 'core',
  };
}

export function getAssistantToolIds(assistants, integration) {
  if (!assistants || assistants.length === 0) return [];
  if (integration === 'project-files') return [];

  const toolIds = new Set();
  const mcpAssistants = new Set();

  for (const id of assistants) {
    if (id === 'none') continue;
    toolIds.add(id);
    if (ALL_ASSISTANTS.find(a => a.id === id && a.support === 'configured')) {
      mcpAssistants.add(id);
    }
  }

  if (assistants.length > 0 && (integration === 'full' || integration === 'mcp-only')) {
    toolIds.add('generic-mcp');
  }

  return [...toolIds];
}

export function shouldInstallProjectFiles(integration) {
  return integration === 'full' || integration === 'project-files';
}

export async function runInteractiveInit({ target, flags }) {
  const isInteractive = isTerminalInteractive();
  const skipPrompts = flags.yes || flags.y || isInteractive === false;

  const isLaravel = isLaravelProject(target);
  const dryRun = flags.dryrun || flags.dryRun || false;

  let { assistants, integration, profile } = resolveInitOptions(flags);
  let confirmed = skipPrompts;

  if (skipPrompts) {
    printWizardHeader(target, isLaravel);
    console.log('  Non-interactive mode: using defaults or provided flags');
    console.log(`    Assistants: ${assistantsToLabel(assistants)}`);
    console.log(`    Integration: ${integration}`);
    console.log(`    Profile: ${profile}`);
    console.log('');
  } else {
    const prompter = createPrompter();

    try {
      printWizardHeader(target, isLaravel);

      if (!flags.assistants && !flags.assistant && !flags.tools && !flags.tool) {
        assistants = await askAssistants(prompter);
      }
      if (!flags.integration) {
        integration = await askIntegration(prompter);
      }
      if (!flags.profile) {
        profile = await askProfile(prompter);
      }

      confirmed = await askConfirm(prompter, assistants, integration, profile);
    } finally {
      prompter.close();
    }
  }

  if (!confirmed) {
    console.log('');
    console.log('  Cancelled.');
    return { cancelled: true };
  }

  const installProject = shouldInstallProjectFiles(integration);
  const toolIds = getAssistantToolIds(assistants, integration);

  if (dryRun) {
    console.log('');
    console.log('  DRY RUN — no files will be written');
    console.log('');
  }

  return {
    profile,
    toolIds,
    integration,
    assistants,
    installProject,
    dryRun,
    isLaravel,
  };
}

export function parseToolsArg(toolsArg) {
  if (!toolsArg || toolsArg === 'none') return [];
  if (toolsArg === true) return ALL_ASSISTANT_IDS.slice();
  return toolsArg.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}
