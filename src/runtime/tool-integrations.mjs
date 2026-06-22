import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

function backupPath(originalPath) {
  const dir = dirname(originalPath);
  const base = originalPath.split(/[/\\]/).pop();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return join(dir, `${base}.backup-${timestamp}`);
}

function safelyBackup(filePath) {
  if (!existsSync(filePath)) return null;
  const backup = backupPath(filePath);
  copyFileSync(filePath, backup);
  return backup;
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function mergeDeep(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = mergeDeep(result[key], source[key]);
      } else {
        result[key] = { ...source[key] };
      }
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

const TOOL_DEFINITIONS = {
  opencode: {
    id: 'opencode',
    displayName: 'OpenCode',
    support: 'full',
    description: 'Full MCP integration, instructions, agents, and slash commands.',
    doctorChecks: [
      {
        name: 'OpenCode config',
        file: '.opencode/opencode.json',
        description: 'Project-wide instructions, agents, and commands',
      },
      {
        name: 'OpenCode MCP config',
        file: 'opencode.json',
        description: 'MCP server connection (project root)',
      },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const opencodeDir = join(target, '.opencode');
      if (!dryRun) mkdirSync(opencodeDir, { recursive: true });

      const srcOpenCodeCfg = join(ROOT, '.opencode', 'opencode.json');
      const destOpenCodeCfg = join(target, '.opencode', 'opencode.json');

      if (existsSync(srcOpenCodeCfg)) {
        if (!dryRun) {
          if (existsSync(destOpenCodeCfg)) {
            const existing = readJsonSafe(destOpenCodeCfg);
            const source = readJsonSafe(srcOpenCodeCfg);
            if (existing && source) {
              const merged = mergeDeep(existing, source);
              const backup = safelyBackup(destOpenCodeCfg);
              writeFileSync(destOpenCodeCfg, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
              results.push({ file: '.opencode/opencode.json', action: 'merged', backup });
            } else {
              const backup = safelyBackup(destOpenCodeCfg);
              copyFileSync(srcOpenCodeCfg, destOpenCodeCfg);
              results.push({ file: '.opencode/opencode.json', action: 'replaced', backup });
            }
          } else {
            copyFileSync(srcOpenCodeCfg, destOpenCodeCfg);
            results.push({ file: '.opencode/opencode.json', action: 'created' });
          }
        } else {
          results.push({ file: '.opencode/opencode.json', action: 'would-create' });
        }
      }

      const destRootOpenCodeCfg = join(target, 'opencode.json');
      const srcMcpExample = join(ROOT, 'examples', 'opencode-mcp.linked.jsonc');

      if (existsSync(srcMcpExample)) {
        if (!dryRun) {
          const mcpConfig = {
            $schema: 'https://opencode.ai/config.json',
            mcp: {
              laraskills: {
                type: 'local',
                command: ['laraskills-mcp'],
                enabled: true,
                timeout: 10000,
              },
            },
          };

          if (existsSync(destRootOpenCodeCfg)) {
            const existing = readJsonSafe(destRootOpenCodeCfg);
            if (existing) {
              const merged = mergeDeep(existing, mcpConfig);
              const backup = safelyBackup(destRootOpenCodeCfg);
              writeFileSync(destRootOpenCodeCfg, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
              results.push({ file: 'opencode.json', action: 'merged', backup });
            } else {
              const backup = safelyBackup(destRootOpenCodeCfg);
              writeFileSync(destRootOpenCodeCfg, JSON.stringify(mcpConfig, null, 2) + '\n', 'utf-8');
              results.push({ file: 'opencode.json', action: 'replaced', backup });
            }
          } else {
            writeFileSync(destRootOpenCodeCfg, JSON.stringify(mcpConfig, null, 2) + '\n', 'utf-8');
            results.push({ file: 'opencode.json', action: 'created' });
          }
        } else {
          results.push({ file: 'opencode.json', action: 'would-create (MCP connection)' });
        }
      }

      return results;
    },
    isConfigured(target) {
      const hasOpenCodeDir = existsSync(join(target, '.opencode', 'opencode.json'));
      const hasMcpConfig = existsSync(join(target, 'opencode.json'));
      if (hasMcpConfig) {
        try {
          const cfg = JSON.parse(readFileSync(join(target, 'opencode.json'), 'utf-8'));
          const hasMCP = cfg.mcp && cfg.mcp.laraskills;
          return { configured: true, hasOpenCodeDir, hasMcpConfig: true, hasMCP: !!hasMCP };
        } catch {
          return { configured: true, hasOpenCodeDir, hasMcpConfig: true, hasMCP: false };
        }
      }
      return { configured: !!hasOpenCodeDir, hasOpenCodeDir, hasMcpConfig: false, hasMCP: false };
    },
  },

  'generic-mcp': {
    id: 'generic-mcp',
    displayName: 'Generic MCP config',
    support: 'full',
    description: 'Creates a standard mcp-servers.json for any MCP-compatible tool.',
    doctorChecks: [
      {
        name: 'MCP config',
        file: 'mcp-configs/mcp-servers.json',
        description: 'MCP server definitions',
      },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const srcMcpConfigsDir = join(ROOT, 'mcp-configs');
      const destMcpConfigsDir = join(target, 'mcp-configs');

      if (existsSync(srcMcpConfigsDir)) {
        if (!dryRun) {
          mkdirSync(destMcpConfigsDir, { recursive: true });
          const files = ['mcp-servers.json'];
          for (const f of files) {
            const src = join(srcMcpConfigsDir, f);
            if (existsSync(src)) {
              copyFileSync(src, join(destMcpConfigsDir, f));
              results.push({ file: `mcp-configs/${f}`, action: 'created' });
            }
          }
        } else {
          results.push({ file: 'mcp-configs/', action: 'would-create' });
        }
      }

      return results;
    },
    isConfigured(target) {
      const has = existsSync(join(target, 'mcp-configs', 'mcp-servers.json'));
      return { configured: has, hasMcpConfigs: has };
    },
  },

  codex: {
    id: 'codex',
    displayName: 'Codex CLI',
    support: 'template',
    description: 'Generates a .codex/instructions.md template. Manual wiring required.',
    doctorChecks: [
      {
        name: 'Codex instructions',
        file: '.codex/instructions.md',
        description: 'Codex CLI instructions',
      },
      {
        name: 'Codex MCP',
        file: '.codex/mcp.json',
        description: 'Codex MCP server config (manual setup)',
      },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const codexDir = join(target, '.codex');
      const srcInstructions = join(ROOT, '.codex', 'instructions.md');

      if (existsSync(srcInstructions)) {
        if (!dryRun) {
          mkdirSync(codexDir, { recursive: true });
          copyFileSync(srcInstructions, join(codexDir, 'instructions.md'));
          results.push({ file: '.codex/instructions.md', action: 'created' });
        } else {
          results.push({ file: '.codex/instructions.md', action: 'would-create' });
        }
      } else {
        results.push({ file: '.codex/instructions.md', action: 'skipped (template not available)' });
      }

      return results;
    },
    isConfigured(target) {
      return { configured: existsSync(join(target, '.codex', 'instructions.md')) };
    },
  },

  'claude-code': {
    id: 'claude-code',
    displayName: 'Claude Code',
    support: 'template',
    description: 'Generates a .claude/settings.json template. Manual wiring required.',
    doctorChecks: [
      {
        name: 'Claude Code settings',
        file: '.claude/settings.json',
        description: 'Claude Code agent settings',
      },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const claudeDir = join(target, '.claude');
      const srcSettings = join(ROOT, '.claude', 'settings.json');

      if (existsSync(srcSettings)) {
        if (!dryRun) {
          mkdirSync(claudeDir, { recursive: true });
          copyFileSync(srcSettings, join(claudeDir, 'settings.json'));
          results.push({ file: '.claude/settings.json', action: 'created' });
        } else {
          results.push({ file: '.claude/settings.json', action: 'would-create' });
        }
      } else {
        results.push({ file: '.claude/settings.json', action: 'skipped (template not available)' });
      }

      return results;
    },
    isConfigured(target) {
      return { configured: existsSync(join(target, '.claude', 'settings.json')) };
    },
  },

  cursor: {
    id: 'cursor',
    displayName: 'Cursor IDE',
    support: 'template',
    description: 'Generates a .cursor/rules.mdc template. Manual wiring required.',
    doctorChecks: [
      {
        name: 'Cursor rules',
        file: '.cursor/rules.mdc',
        description: 'Cursor IDE rules',
      },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const cursorDir = join(target, '.cursor');
      const srcRules = join(ROOT, '.cursor', 'rules.mdc');

      if (existsSync(srcRules)) {
        if (!dryRun) {
          mkdirSync(cursorDir, { recursive: true });
          copyFileSync(srcRules, join(cursorDir, 'rules.mdc'));
          results.push({ file: '.cursor/rules.mdc', action: 'created' });
        } else {
          results.push({ file: '.cursor/rules.mdc', action: 'would-create' });
        }
      } else {
        results.push({ file: '.cursor/rules.mdc', action: 'skipped (template not available)' });
      }

      return results;
    },
    isConfigured(target) {
      return { configured: existsSync(join(target, '.cursor', 'rules.mdc')) };
    },
  },
};

export function getToolDefinition(toolId) {
  return TOOL_DEFINITIONS[toolId] || null;
}

export function getAllToolDefinitions() {
  return { ...TOOL_DEFINITIONS };
}

export function getFullySupportedTools() {
  return Object.values(TOOL_DEFINITIONS).filter(t => t.support === 'full');
}

export function getTemplateTools() {
  return Object.values(TOOL_DEFINITIONS).filter(t => t.support === 'template');
}

export function setupToolIntegration(toolId, target, flags = {}) {
  const def = TOOL_DEFINITIONS[toolId];
  if (!def) throw new Error(`Unknown tool: ${toolId}`);
  return def.setup(target, flags);
}

export function checkToolConfigured(toolId, target) {
  const def = TOOL_DEFINITIONS[toolId];
  if (!def) return { configured: false };
  return def.isConfigured(target);
}

export function getAllToolChecks(target) {
  const results = [];
  for (const tool of Object.values(TOOL_DEFINITIONS)) {
    const check = tool.isConfigured(target);
    results.push({
      id: tool.id,
      displayName: tool.displayName,
      support: tool.support,
      ...check,
    });
  }
  return results;
}
