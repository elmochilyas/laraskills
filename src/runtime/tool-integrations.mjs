import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, appendFileSync, cpSync } from 'node:fs';
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

function safeWriteJson(filePath, data, dryRun) {
  if (dryRun) return null;
  const existing = existsSync(filePath);
  const backup = existing ? safelyBackup(filePath) : null;
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  return { existing, backup };
}

const MCP_ENTRY = {
  command: 'laraskills-mcp',
  args: [],
};

const MCP_ENTRY_OPENCODE = {
  type: 'local',
  command: ['laraskills-mcp'],
  enabled: true,
  timeout: 10000,
};

function mergeMcpServers(existing, isOpenCode = false) {
  const entry = isOpenCode ? MCP_ENTRY_OPENCODE : MCP_ENTRY;
  if (isOpenCode) {
    if (!existing.mcp) existing.mcp = {};
    if (!existing.mcp.laraskills) existing.mcp.laraskills = entry;
    else existing.mcp.laraskills = mergeDeep(existing.mcp.laraskills, entry);
    return existing;
  }
  if (!existing.mcpServers) existing.mcpServers = {};
  if (!existing.mcpServers.laraskills) existing.mcpServers.laraskills = entry;
  else existing.mcpServers.laraskills = mergeDeep(existing.mcpServers.laraskills, entry);
  return existing;
}

function handleJsonMcp(target, filePath, isOpenCode = false, dryRun = false) {
  const fullPath = join(target, filePath);
  if (existsSync(fullPath)) {
    if (dryRun) return { action: 'would-merge', file: filePath };
    const existing = readJsonSafe(fullPath);
    if (!existing) return { action: 'skipped', file: filePath, reason: 'could not parse existing' };
    const hasLaraSkills = isOpenCode
      ? (existing.mcp && existing.mcp.laraskills)
      : (existing.mcpServers && existing.mcpServers.laraskills);
    if (hasLaraSkills) return { action: 'skipped', file: filePath, reason: 'already configured' };
    const merged = mergeMcpServers(existing, isOpenCode);
    const result = safeWriteJson(fullPath, merged, dryRun);
    return { action: 'merged', file: filePath, backup: result?.backup };
  }
  if (dryRun) return { action: 'would-create', file: filePath };
  const data = isOpenCode
    ? { $schema: 'https://opencode.ai/config.json', mcp: { laraskills: { ...MCP_ENTRY_OPENCODE } } }
    : { mcpServers: { laraskills: { ...MCP_ENTRY } } };
  const result = safeWriteJson(fullPath, data, dryRun);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  return { action: 'created', file: filePath };
}

const TOOL_DEFINITIONS = {
  opencode: {
    id: 'opencode',
    displayName: 'OpenCode',
    support: 'full',
    description: 'Auto-configures MCP and project instructions.',
    doctorChecks: [
      { name: 'OpenCode instructions', file: '.opencode/opencode.json', description: 'Project-wide instructions, agents, commands' },
      { name: 'OpenCode commands', file: '.opencode/commands/', description: 'OpenCode custom command definitions' },
      { name: 'OpenCode MCP', file: 'opencode.json', description: 'MCP server connection (project root)' },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const opencodeDir = join(target, '.opencode');
      if (!dryRun) mkdirSync(opencodeDir, { recursive: true });
      else results.push({ file: '.opencode/opencode.json', action: 'would-create' });

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
        }
      }

      const srcOpenCodeCmds = join(ROOT, '.opencode', 'commands');
      const destOpenCodeCmds = join(target, '.opencode', 'commands');
      if (existsSync(srcOpenCodeCmds)) {
        if (!dryRun) {
          cpSync(srcOpenCodeCmds, destOpenCodeCmds, { recursive: true });
          results.push({ file: '.opencode/commands/', action: 'created' });
        } else {
          results.push({ file: '.opencode/commands/', action: 'would-create' });
        }
      }

      const mcpResult = handleJsonMcp(target, 'opencode.json', true, dryRun);
      results.push(mcpResult);

      return results;
    },
    isConfigured(target) {
      const hasInstructions = existsSync(join(target, '.opencode', 'opencode.json'));
      const hasMcp = existsSync(join(target, 'opencode.json'));
      if (hasMcp) {
        try {
          const cfg = JSON.parse(readFileSync(join(target, 'opencode.json'), 'utf-8'));
          const hasMCP = cfg.mcp && cfg.mcp.laraskills;
          return { configured: !!hasMCP, support: 'configured', configFiles: ['.opencode/opencode.json', '.opencode/commands/', 'opencode.json'], mcpConfigured: !!hasMCP };
        } catch { return { configured: hasInstructions, support: 'configured', configFiles: ['.opencode/opencode.json', '.opencode/commands/'], mcpConfigured: false }; }
      }
      return { configured: !!hasInstructions, support: 'configured', configFiles: hasInstructions ? ['.opencode/opencode.json', '.opencode/commands/'] : [], mcpConfigured: false };
    },
  },

  'claude-code': {
    id: 'claude-code',
    displayName: 'Claude Code',
    support: 'full',
    description: 'Configures project MCP through .mcp.json where supported.',
    doctorChecks: [
      { name: 'Claude Code MCP', file: '.mcp.json', description: 'Claude Code MCP server config' },
      { name: 'Claude Code settings', file: '.claude/settings.json', description: 'Claude Code agent settings' },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const mcpResult = handleJsonMcp(target, '.mcp.json', false, dryRun);
      results.push(mcpResult);

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
      }

      return results;
    },
    isConfigured(target) {
      const hasMcp = existsSync(join(target, '.mcp.json'));
      let mcpConfigured = false;
      if (hasMcp) {
        try {
          const cfg = JSON.parse(readFileSync(join(target, '.mcp.json'), 'utf-8'));
          mcpConfigured = !!(cfg.mcpServers && cfg.mcpServers.laraskills);
        } catch {}
      }
      return { configured: mcpConfigured, support: 'configured', configFiles: ['.mcp.json', '.claude/settings.json'], mcpConfigured };
    },
  },

  cursor: {
    id: 'cursor',
    displayName: 'Cursor',
    support: 'full',
    description: 'Auto-configures project MCP and IDE rules.',
    doctorChecks: [
      { name: 'Cursor MCP', file: '.cursor/mcp.json', description: 'Cursor MCP server config' },
      { name: 'Cursor rules', file: '.cursor/rules.mdc', description: 'Cursor IDE rules' },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const cursorDir = join(target, '.cursor');
      if (!dryRun) mkdirSync(cursorDir, { recursive: true });
      else results.push({ file: '.cursor/mcp.json', action: 'would-create' });

      const mcpResult = handleJsonMcp(target, '.cursor/mcp.json', false, dryRun);
      results.push(mcpResult);

      const srcRules = join(ROOT, '.cursor', 'rules.mdc');
      if (existsSync(srcRules)) {
        if (!dryRun) {
          copyFileSync(srcRules, join(cursorDir, 'rules.mdc'));
          results.push({ file: '.cursor/rules.mdc', action: 'created' });
        } else {
          results.push({ file: '.cursor/rules.mdc', action: 'would-create' });
        }
      }

      return results;
    },
    isConfigured(target) {
      const hasMcp = existsSync(join(target, '.cursor', 'mcp.json'));
      let mcpConfigured = false;
      if (hasMcp) {
        try {
          const cfg = JSON.parse(readFileSync(join(target, '.cursor', 'mcp.json'), 'utf-8'));
          mcpConfigured = !!(cfg.mcpServers && cfg.mcpServers.laraskills);
        } catch {}
      }
      return { configured: mcpConfigured, support: 'configured', configFiles: ['.cursor/mcp.json', '.cursor/rules.mdc'], mcpConfigured };
    },
  },

  codex: {
    id: 'codex',
    displayName: 'Codex',
    support: 'full',
    description: 'Configures MCP via .codex/config.toml with safe TOML merging.',
    doctorChecks: [
      { name: 'Codex MCP', file: '.codex/config.toml', description: 'Codex MCP server TOML config' },
      { name: 'Codex instructions', file: '.codex/instructions.md', description: 'Codex CLI instructions' },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const codexDir = join(target, '.codex');
      if (!dryRun) mkdirSync(codexDir, { recursive: true });
      else results.push({ file: '.codex/config.toml', action: 'would-create' });

      const configPath = join(codexDir, 'config.toml');
      const mcpServerBlock = '\n[mcp_servers.laraskills]\ncommand = "laraskills-mcp"\n';

      if (existsSync(configPath)) {
        if (dryRun) {
          results.push({ file: '.codex/config.toml', action: 'would-merge' });
        } else {
          const content = readFileSync(configPath, 'utf-8');
          if (content.includes('[mcp_servers.laraskills]')) {
            results.push({ file: '.codex/config.toml', action: 'skipped', reason: 'already configured' });
          } else {
            const backup = safelyBackup(configPath);
            appendFileSync(configPath, mcpServerBlock, 'utf-8');
            results.push({ file: '.codex/config.toml', action: 'merged', backup });
          }
        }
      } else {
        if (!dryRun) {
          writeFileSync(configPath, `[mcp]\nenabled = true\n${mcpServerBlock}`, 'utf-8');
          results.push({ file: '.codex/config.toml', action: 'created' });
        } else {
          results.push({ file: '.codex/config.toml', action: 'would-create' });
        }
      }

      const srcInstructions = join(ROOT, '.codex', 'instructions.md');
      if (existsSync(srcInstructions)) {
        if (!dryRun) {
          copyFileSync(srcInstructions, join(codexDir, 'instructions.md'));
          results.push({ file: '.codex/instructions.md', action: 'created' });
        } else {
          results.push({ file: '.codex/instructions.md', action: 'would-create' });
        }
      }

      return results;
    },
    isConfigured(target) {
      const configPath = join(target, '.codex', 'config.toml');
      let mcpConfigured = false;
      if (existsSync(configPath)) {
        try {
          const content = readFileSync(configPath, 'utf-8');
          mcpConfigured = content.includes('[mcp_servers.laraskills]');
        } catch {}
      }
      return { configured: mcpConfigured, support: 'configured', configFiles: ['.codex/config.toml', '.codex/instructions.md'], mcpConfigured };
    },
  },

  'generic-mcp': {
    id: 'generic-mcp',
    displayName: 'Generic MCP',
    support: 'full',
    description: 'Generates portable MCP config for any MCP-capable client.',
    doctorChecks: [
      { name: 'Generic MCP config', file: 'mcp-configs/laraskills-mcp.json', description: 'Portable MCP server config' },
    ],
    setup(target, flags) {
      const results = [];
      const dryRun = flags.dryRun || false;

      const destDir = join(target, 'mcp-configs');
      if (!dryRun) mkdirSync(destDir, { recursive: true });
      else results.push({ file: 'mcp-configs/laraskills-mcp.json', action: 'would-create' });

      const mcpFile = join(destDir, 'laraskills-mcp.json');
      const data = { mcpServers: { laraskills: { ...MCP_ENTRY } } };

      if (existsSync(mcpFile)) {
        if (dryRun) {
          results.push({ file: 'mcp-configs/laraskills-mcp.json', action: 'would-merge' });
        } else {
          const existing = readJsonSafe(mcpFile);
          if (existing && existing.mcpServers && existing.mcpServers.laraskills) {
            results.push({ file: 'mcp-configs/laraskills-mcp.json', action: 'skipped', reason: 'already configured' });
          } else {
            const merged = existing ? mergeMcpServers(existing) : data;
            const backup = safelyBackup(mcpFile);
            writeFileSync(mcpFile, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
            results.push({ file: 'mcp-configs/laraskills-mcp.json', action: existing ? 'merged' : 'created', backup });
          }
        }
      } else {
        if (!dryRun) {
          writeFileSync(mcpFile, JSON.stringify(data, null, 2) + '\n', 'utf-8');
          results.push({ file: 'mcp-configs/laraskills-mcp.json', action: 'created' });
        }
      }

      return results;
    },
    isConfigured(target) {
      const mcpFile = join(target, 'mcp-configs', 'laraskills-mcp.json');
      let mcpConfigured = false;
      if (existsSync(mcpFile)) {
        try {
          const cfg = JSON.parse(readFileSync(mcpFile, 'utf-8'));
          mcpConfigured = !!(cfg.mcpServers && cfg.mcpServers.laraskills);
        } catch {}
      }
      return { configured: mcpConfigured, support: 'configured', configFiles: ['mcp-configs/laraskills-mcp.json'], mcpConfigured };
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

export function setupToolIntegration(toolId, target, flags = {}) {
  const def = TOOL_DEFINITIONS[toolId];
  if (!def) throw new Error(`Unknown tool: ${toolId}`);
  return def.setup(target, flags);
}

export function checkToolConfigured(toolId, target) {
  const def = TOOL_DEFINITIONS[toolId];
  if (!def) return { configured: false, support: 'unknown', configFiles: [] };
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
      configured: check.configured,
      mcpConfigured: check.mcpConfigured || false,
      configFiles: check.configFiles || [],
    });
  }
  return results;
}

export function validateOpenCodeFileReferences(target) {
  const cfgPath = join(target, '.opencode', 'opencode.json');
  if (!existsSync(cfgPath)) return { valid: true, missingFiles: [] };

  let cfg;
  try {
    cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
  } catch {
    return { valid: false, missingFiles: [], parseError: true };
  }

  const missingFiles = [];
  const fileRefPattern = /\{file:([^}]+)\}/g;

  function checkRefs(obj, path) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        checkRefs(obj[i], `${path}[${i}]`);
      }
      return;
    }
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = `${path}.${key}`;
      if (typeof value === 'string') {
        let match;
        while ((match = fileRefPattern.exec(value)) !== null) {
          const refPath = match[1];
          const resolved = join(dirname(cfgPath), refPath);
          const normalizedResolved = resolved.replace(/\\/g, '/');
          if (!existsSync(resolved)) {
            missingFiles.push({
              configPath: '.opencode/opencode.json',
              reference: refPath,
              resolvedPath: normalizedResolved,
              key: currentPath,
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        checkRefs(value, currentPath);
      }
    }
  }

  checkRefs(cfg, '.opencode/opencode.json');

  return {
    valid: missingFiles.length === 0,
    missingFiles,
    parseError: false,
  };
}
