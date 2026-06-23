#!/usr/bin/env node
import { existsSync, readFileSync, copyFileSync, mkdirSync, cpSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
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
import { getPackagedIntelligenceRoot, isPackagedRoot } from '../src/runtime/packaged-root.mjs';
import {
  setupToolIntegration,
  checkToolConfigured,
  getAllToolChecks,
  getToolDefinition,
  getAllToolDefinitions,
  validateOpenCodeFileReferences,
} from '../src/runtime/tool-integrations.mjs';
import {
  isLaravelProject,
  runInteractiveInit,
  isTerminalInteractive,
  resolveInitOptions,
  getAssistantToolIds,
  shouldInstallProjectFiles,
} from '../src/runtime/interactive-init.mjs';
import {
  generateRegistry,
  readRegistry,
  validateRegistry,
  getRegistrySummary,
  getRegistryPath,
} from '../src/runtime/skill-registry.mjs';
import {
  LARASKILLS_ROOT_DIR,
  SKILLS_DIR,
  REGISTRY_PATH,
  STALE_REFERENCES,
  STALE_PATH_PATTERNS,
  ASSISTANT_IDS,
  ALL_KNOWN_SKILL_NAMES,
  LEGACY_STATE_FILE,
  LEGACY_ROOT_DIR,
  canonicalSkillPath,
  sanitizeSkillName,
  publicAssistantLabel,
  sanitizeDoctorResult,
} from '../src/runtime/paths.mjs';

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

function safeBackupLocal(filePath) {
  if (!existsSync(filePath)) return null;
  const dir = dirname(filePath);
  const base = basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = join(dir, `${base}.backup-${timestamp}`);
  try { copyFileSync(filePath, backup); return backup; } catch { return null; }
}

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
    if (existsSync(join(src, 'commands'))) {
      cpSync(join(src, 'commands'), join(dest, 'commands'), { recursive: true });
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
    const dest = join(target, LARASKILLS_ROOT_DIR, 'skills', component);
    mkdirSync(join(target, LARASKILLS_ROOT_DIR, 'skills'), { recursive: true });
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

  const packagedRoot = getPackagedIntelligenceRoot();
  if (packagedRoot && !flags.laraskillsroot && !flags.eccroot) {
    log('LaraSkills setup is optional for normal users.');
    console.log('');
    console.log('Packaged intelligence is already available — no manual clone is required.');
    console.log('Use --laraskills-root <path> only if you need to point to a custom local checkout.');
    console.log('');
    console.log('To override with a custom checkout:');
    console.log(`  laraskills setup --laraskills-root "/path/to/laraskills"`);
    console.log('');
    console.log('To diagnose current state:');
    console.log('  laraskills doctor');
    console.log('');
    return;
  }

  log('LaraSkills setup');
  console.log('');
  log('NOTE: normal users do not need to run setup.');
  log('Packaged intelligence is used automatically by default.');
  log('setup is for advanced users who want to point to a custom local checkout.');
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

function detectDeepStaleReferences(target) {
  const findings = [];
  // Check state files
  if (existsSync(join(target, LEGACY_STATE_FILE))) {
    findings.push({ location: LEGACY_STATE_FILE, type: 'state_file', severity: 'high' });
  }
  if (existsSync(join(target, LEGACY_ROOT_DIR))) {
    findings.push({ location: LEGACY_ROOT_DIR, type: 'directory', severity: 'high' });
  }
  // Check package.json
  const pkgPath = join(target, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const targetPkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...(targetPkg.dependencies || {}), ...(targetPkg.devDependencies || {}) };
      for (const ref of STALE_REFERENCES) {
        if (deps[ref]) {
          findings.push({ location: `package.json (dependency: ${ref})`, type: 'dependency', severity: 'medium' });
        }
      }
      if (targetPkg.scripts) {
        for (const [name, script] of Object.entries(targetPkg.scripts)) {
          for (const ref of STALE_REFERENCES) {
            if (script.includes(ref)) {
              findings.push({ location: `package.json (script: ${name})`, type: 'script', severity: 'medium' });
            }
          }
        }
      }
    } catch {}
  }
  // Check package-lock.json
  const lockPath = join(target, 'package-lock.json');
  if (existsSync(lockPath)) {
    try {
      const lockContent = readFileSync(lockPath, 'utf-8');
      for (const ref of STALE_REFERENCES) {
        if (lockContent.includes(ref)) {
          findings.push({ location: 'package-lock.json', type: 'lockfile', severity: 'medium' });
          break;
        }
      }
    } catch {}
  }
  // Check node_modules
  for (const ref of STALE_REFERENCES) {
    const nmPath = join(target, 'node_modules', ref);
    if (existsSync(nmPath)) {
      findings.push({ location: `node_modules/${ref}`, type: 'installed_package', severity: 'high' });
    }
  }
  return findings;
}

function checkAssistantConfigForStale(target, configFiles) {
  const findings = [];
  for (const cf of configFiles) {
    const fullPath = join(target, cf);
    if (!existsSync(fullPath)) continue;
    try {
      const content = readFileSync(fullPath, 'utf-8');
      for (const ref of STALE_REFERENCES) {
        if (content.toLowerCase().includes(ref.toLowerCase())) {
          findings.push({ file: cf, stale: ref });
        }
      }
      for (const pat of STALE_PATH_PATTERNS) {
        if (pat.test(content)) {
          findings.push({ file: cf, stale: 'stale_skill_path', pattern: pat.toString() });
        }
      }
    } catch {}
  }
  return findings;
}

function checkAssistantConfigPaths(target, assistantId, def) {
  const check = def.isConfigured(target);
  const issues = [];
  const warnings = [];

  // Check config file existence
  if (check.configFiles) {
    for (const cf of check.configFiles) {
      const fullPath = join(target, cf);
      if (!existsSync(fullPath)) {
        if (cf.endsWith('.json') || cf.endsWith('.toml') || cf.endsWith('.mdc') || cf.endsWith('.md')) {
          issues.push({ type: 'config_missing', file: cf, critical: true });
        }
      }
    }
  }

  // Check MCP config
  if (!check.mcpConfigured) {
    issues.push({ type: 'mcp_not_configured', critical: false });
  }

  // Check for stale references in assistant configs
  const staleFindings = checkAssistantConfigForStale(target, check.configFiles || []);
  for (const sf of staleFindings) {
    if (sf.stale === 'stale_skill_path') {
      issues.push({ type: 'stale_skill_path', file: sf.file, critical: false });
    } else {
      warnings.push({ type: 'stale_reference', file: sf.file, stale: sf.stale });
    }
  }

  return { issues, warnings, mcpConfigured: check.mcpConfigured, configFiles: check.configFiles || [] };
}

function checkMcpRuntime() {
  const checks = {
    configExists: false,
    commandExists: false,
    runtimeAvailable: false,
    toolsAvailable: false,
    details: [],
  };

  // Check MCP config exists
  const mcpConfigs = [
    join(process.cwd(), 'opencode.json'),
    join(process.cwd(), '.mcp.json'),
    join(process.cwd(), '.cursor', 'mcp.json'),
    join(process.cwd(), 'mcp-configs', 'laraskills-mcp.json'),
  ];
  for (const cfg of mcpConfigs) {
    if (existsSync(cfg)) {
      checks.configExists = true;
      checks.details.push(`MCP config found: ${cfg}`);
      break;
    }
  }

  if (!checks.configExists) {
    checks.details.push('No MCP config file found');
    return checks;
  }

  // Check if laraskills-mcp command is available
  const mcpScript = join(ROOT, 'scripts', 'laraskills-mcp.mjs');
  if (existsSync(mcpScript)) {
    checks.commandExists = true;
    checks.details.push('laraskills-mcp script found');
  } else {
    // Try global npm bin
    try {
      const { execSync } = require('node:child_process');
      execSync('npx which laraskills-mcp 2>/dev/null || echo ""', { encoding: 'utf-8', timeout: 5000 });
      checks.commandExists = true;
      checks.details.push('laraskills-mcp available via npx');
    } catch {
      checks.details.push('laraskills-mcp command not found');
    }
  }

  // Try to invoke MCP briefly (just check it starts)
  if (checks.commandExists) {
    try {
      const { execSync } = require('node:child_process');
      const result = execSync(`node "${mcpScript}" --help 2>&1 || echo "NO_HELP"`, {
        encoding: 'utf-8',
        timeout: 5000,
        cwd: ROOT,
        env: { ...process.env, LARASKILLS_MCP_BRIEF: '1' },
      });
      if (result.includes('MCP') || result.includes('laraskills')) {
        checks.runtimeAvailable = true;
        checks.details.push('MCP process can start');
      } else {
        checks.details.push(`MCP start response: ${result.substring(0, 100)}`);
      }
    } catch (e) {
      checks.details.push(`MCP runtime check failed: ${e.message}`);
    }

    // Check tool listing via registry (doesn't need MCP process)
    try {
      const registry = readRegistry(process.cwd());
      if (registry && registry.skills && registry.skills.length > 0) {
        checks.toolsAvailable = true;
        checks.details.push(`Registry has ${registry.skills.length} skills available for MCP tools`);
      }
    } catch {}
  }

  return checks;
}

function cmdDoctor(doctorArgs) {
  const flags = parseFlags(doctorArgs || []);
  const target = process.cwd();
  const isJson = !!flags.json;
  const isPublic = !!flags.public;
  const isMd = flags.output === 'doctor-output.md' || !!flags.markdown;
  const benchmarkPackagePath = flags.package && typeof flags.package === 'string' ? flags.package : null;

  // Determine which assistants to check
  const assistantFilter = flags.opencode || flags.assistant === 'opencode' ? 'opencode'
    : flags.cursor || flags.assistant === 'cursor' ? 'cursor'
    : flags.claude || flags.claudecode || flags['claude-code'] || flags.assistant === 'claude-code' ? 'claude-code'
    : flags.codex || flags.assistant === 'codex' ? 'codex'
    : undefined;

  const checkAllAssistants = flags.assistants === 'all' || flags.all || flags.benchmark;
  const isBenchmark = !!flags.benchmark;

  // Figure out which assistants to check
  let assistantIds = [];
  if (assistantFilter) {
    assistantIds = [assistantFilter];
  } else if (checkAllAssistants) {
    assistantIds = [...ASSISTANT_IDS];
  } else {
    assistantIds = [...ASSISTANT_IDS];
  }

  const state = readState(target);
  const packageVersion = pkg.version;
  const packagedRoot = getPackagedIntelligenceRoot();

  // Deep stale detection
  const deepStaleFindings = detectDeepStaleReferences(target);
  const hasStaleEccConfig = deepStaleFindings.some(f => f.type === 'state_file' || f.type === 'directory');
  const hasDeepStale = deepStaleFindings.length > 0;

  // Build structured results
  function buildResult() {
    const registry = readRegistry(target);
    const skillValidation = registry ? validateRegistry(target) : null;
    const registryOk = !!registry;
    const skillsOk = skillValidation ? skillValidation.valid : false;

    // Critical checks
    const criticalChecks = {
      local_init_exists: { status: !!state ? 'pass' : 'fail', critical: true },
      registry_exists: { status: registryOk ? 'pass' : 'fail', critical: true },
      registry_parses: { status: registryOk ? 'pass' : 'fail', critical: true },
      skills_exist: {
        status: skillsOk ? 'pass' : 'fail',
        critical: true,
        missing: skillValidation ? skillValidation.missingSkills : [],
      },
    };

    // Non-critical checks
    const checks = {
      ...criticalChecks,
      package_version: { status: 'pass', value: packageVersion, critical: false },
      node_version: { status: 'pass', value: process.version, critical: false },
      stale_references: {
        status: deepStaleFindings.length > 0 ? 'warn' : 'pass',
        critical: isBenchmark,
        findings: deepStaleFindings,
      },
      intelligence_source: {
        status: packagedRoot ? 'pass' : 'info',
        value: packagedRoot ? 'packaged' : 'manual',
        critical: false,
      },
    };

    // Determine critical failures
    const criticalFailed = Object.entries(criticalChecks).some(([, v]) => v.status === 'fail');

    // Per-assistant checks
    const assistants = {};
    for (const aid of assistantIds) {
      const def = getToolDefinition(aid);
      if (!def) continue;
      const pathCheck = checkAssistantConfigPaths(target, aid, def);
      const assistantCritical = pathCheck.issues.some(i => i.critical && i.type === 'config_missing');

      assistants[aid] = {
        configured: pathCheck.issues.length === 0,
        mcpConfigured: pathCheck.mcpConfigured,
        configFiles: pathCheck.configFiles,
        issues: pathCheck.issues,
        warnings: pathCheck.warnings,
        status: assistantCritical ? 'fail' : (pathCheck.issues.length > 0 ? 'degraded' : 'pass'),
      };
    }

    // MCP runtime check
    let mcpRuntime = null;
    const checkMcp = flags.mcp || flags['mcp-runtime'] || isBenchmark;
    if (checkMcp) {
      mcpRuntime = checkMcpRuntime();
    }

    const overallResult = criticalFailed ? 'not_healthy'
      : Object.values(assistants).some(a => a.status === 'fail') ? 'not_healthy'
      : Object.values(assistants).some(a => a.status === 'degraded') ? 'degraded'
      : 'healthy';

    return {
      result: overallResult,
      version: packageVersion,
      mode: isBenchmark ? 'benchmark' : (assistantFilter ? `assistant_${assistantFilter}` : 'assistants_all'),
      state: state ? { profile: state.profile || 'core', version: state.version } : null,
      checks,
      critical_failed: criticalFailed,
      assistants,
      mcp_runtime: mcpRuntime,
      failures: [],
      warnings: [],
    };
  }

  // ---- BENCHMARK MODE ----
  if (isBenchmark) {
    const result = buildResult();
    let allOk = true;

    // In benchmark mode, stale is hard failure
    if (deepStaleFindings.length > 0) {
      result.failures.push({ check: 'stale_references', detail: `${deepStaleFindings.length} stale references found`, findings: deepStaleFindings });
      allOk = false;
    }
    if (!state) {
      result.failures.push({ check: 'local_init', detail: 'Not initialized' });
      allOk = false;
    }
    const registry = readRegistry(target);
    if (!registry) {
      result.failures.push({ check: 'registry', detail: 'Registry missing' });
      allOk = false;
    }
    if (registry) {
      const sv = validateRegistry(target);
      if (!sv.valid) {
        result.failures.push({ check: 'skill_files', detail: `${sv.missingSkills.length} skills missing from disk` });
        allOk = false;
      }
    }
    let atLeastOneMcp = false;
    for (const [aid, a] of Object.entries(result.assistants)) {
      if (a.mcpConfigured) { atLeastOneMcp = true; break; }
    }
    if (!atLeastOneMcp) {
      result.failures.push({ check: 'mcp_config', detail: 'No assistant has MCP configured' });
      allOk = false;
    }
    // Knowledge retrieval test
    try {
      const searchResult = searchKnowledge('Laravel security patterns', { eccRoot: ROOT, limit: 1 });
      if (searchResult.length === 0) {
        result.failures.push({ check: 'knowledge_retrieval', detail: 'Could not retrieve knowledge' });
        allOk = false;
      }
    } catch (e) {
      result.failures.push({ check: 'knowledge_retrieval', detail: e.message });
      allOk = false;
    }

    result.result = allOk ? 'benchmark_ready' : 'not_ready';

    if (isJson) {
      result.exit_code = allOk ? 0 : 1;
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('LaraSkills Doctor — Benchmark Pre-Flight');
      console.log('');
      console.log(`Package version:       ${packageVersion}`);
      console.log(`Node.js:               ${process.version}`);
      console.log(`Stale references:      ${deepStaleFindings.length > 0 ? `DETECTED (${deepStaleFindings.length}) - run laraskills init --repair` : 'none'}`);
      console.log(`Local init:            ${state ? 'OK' : 'MISSING - run laraskills init'}`);
      const reg = readRegistry(target);
      console.log(`Skill registry:        ${reg ? `OK (${reg.skills?.length || 0} skills)` : 'MISSING'}`);
      console.log(`MCP config:            ${atLeastOneMcp ? 'OK' : 'NONE'}`);
      const sv = reg ? validateRegistry(target) : null;
      console.log(`Skill validation:      ${sv && sv.valid ? 'OK' : sv ? `FAIL - ${sv.missingSkills.length} missing` : 'N/A'}`);
      console.log('');
      console.log(`Result: ${allOk ? 'BENCHMARK READY' : 'NOT READY'}`);
      if (!allOk) {
        console.log('');
        for (const f of result.failures) {
          console.log(`  - ${f.check}: ${f.detail}`);
        }
      }
    }

    if (!allOk) process.exitCode = 1;

    // Benchmark packaging
    if (benchmarkPackagePath) {
      try {
        const snapshot = {
          timestamp: new Date().toISOString(),
          version: packageVersion,
          node: process.version,
          platform: process.platform,
          result: result.result,
          failures: result.failures,
          stale_findings: deepStaleFindings,
          assistant_count: Object.keys(result.assistants || {}).length,
          public: isPublic || false,
        };
        const resolvedPath = resolve(benchmarkPackagePath);
        const snapshotJson = JSON.stringify(snapshot, null, 2);
        writeFileSync(resolvedPath, snapshotJson, 'utf-8');
        if (!isJson) {
          console.log(`\nBenchmark snapshot saved to: ${resolvedPath}`);
        }
      } catch (e) {
        warn(`Could not write benchmark package: ${e.message}`);
      }
    }

    return;
  }

  // ---- JSON OUTPUT MODE ----
  if (isJson) {
    const result = buildResult();
    result.exit_code = result.result === 'healthy' ? 0 : 1;
    if (isPublic) {
      const sanitized = sanitizeDoctorResult(result);
      // Replace internal critical_failed with public-safe truthful field
      sanitized.requires_action = sanitized.critical_failed || sanitized.result !== 'healthy';
      delete sanitized.critical_failed;
      // Clean up empty missing arrays
      for (const ck of Object.keys(sanitized.checks)) {
        if (sanitized.checks[ck].missing && sanitized.checks[ck].missing.length === 0) {
          delete sanitized.checks[ck].missing;
        }
      }
      console.log(JSON.stringify(sanitized, null, 2));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    if (result.result !== 'healthy') process.exitCode = 1;
    return;
  }

  // ---- STANDARD TEXT MODE ----
  const displayName = assistantFilter === 'opencode' ? 'OpenCode'
    : assistantFilter === 'cursor' ? 'Cursor'
    : assistantFilter === 'claude-code' ? 'Claude Code'
    : assistantFilter === 'codex' ? 'Codex'
    : assistantFilter || 'LaraSkills';

  // In public mode, use generic title
  if (isPublic) {
    console.log('LaraSkills Diagnostic Report');
  } else {
    console.log(`LaraSkills Doctor — ${displayName}`);
  }
  console.log('');

  // Global checks
  console.log(`Global package:         ${packageVersion}`);
  console.log(`Node.js:                 ${process.version}`);

  // Local init (CRITICAL)
  if (!state) {
    console.log(`Local init:              FAIL — run laraskills init`);
    console.log('');
    console.log('Result: NOT HEALTHY');
    process.exitCode = 1;
    return;
  }
  console.log(`Local init:              OK (${isPublic ? 'initialized' : `${state.profile || 'core'}, v${state.version || 'unknown'}`})`);

  // Project state
  console.log(`Project state:           OK`);

  // Stale ecc check (public: simplified)
  if (hasDeepStale) {
    if (isPublic) {
      console.log(`Stale references:        DETECTED — run laraskills init --repair`);
    } else {
      console.log(`Stale references:        DETECTED — run laraskills init --repair`);
      for (const f of deepStaleFindings) {
        console.log(`  - ${f.location} (${f.type}, severity: ${f.severity})`);
      }
    }
  } else {
    console.log(`Stale references:        none`);
  }

  // Skill registry check (CRITICAL)
  const registry = readRegistry(target);
  if (!registry) {
    console.log(`Skill registry:          MISSING`);
    console.log('');
    console.log('Fix: laraskills init --repair');
    console.log('');
    console.log('Result: NOT HEALTHY');
    process.exitCode = 1;
    return;
  }
  console.log(`Skill registry:          OK (${registry.skills?.length || 0} skills)`);

  // Skill file validation (CRITICAL) — public: sanitize names
  const skillValidation = validateRegistry(target);
  if (!skillValidation.valid) {
    if (isPublic) {
      console.log(`Skill files:             ${skillValidation.missingSkills.length} skills need attention`);
    } else {
      console.log(`Skill files:             FAIL — ${skillValidation.missingSkills.length} skills in registry not on disk`);
      for (const ms of skillValidation.missingSkills) {
        console.log(`  Missing: ${ms}`);
      }
    }
  } else {
    console.log(`Skill files:             OK`);
  }

  // Track critical failures for final result
  let criticalFailed = !state || !registry || !skillValidation.valid;

  console.log('');

  // Per-assistant checks (public: simplified)
  let assistantIssues = 0;
  for (const aid of assistantIds) {
    const def = getToolDefinition(aid);
    if (!def) continue;
    const pathCheck = checkAssistantConfigPaths(target, aid, def);
    const statusLabel = isPublic ? publicAssistantLabel(aid) : (def.displayName || aid);

    console.log(`--- ${statusLabel} ---`);

    // MCP config check
    if (pathCheck.mcpConfigured) {
      console.log(`MCP config:              OK`);
    } else {
      console.log(`MCP config:              NOT CONFIGURED`);
      assistantIssues++;
    }

    if (!isPublic) {
      // Config file checks
      for (const cf of pathCheck.configFiles) {
        const ex = existsSync(join(target, cf));
        console.log(`  Config: ${cf.padEnd(28)} ${ex ? 'OK' : 'MISSING'}`);
        if (!ex && (cf.endsWith('.json') || cf.endsWith('.toml'))) assistantIssues++;
      }

      // Report issues
      for (const issue of pathCheck.issues) {
        if (issue.type === 'stale_skill_path') {
          console.log(`  Skill paths:            STALE (references old paths) — run laraskills init --repair`);
          assistantIssues++;
        }
      }

      // Stale reference warnings
      for (const w of pathCheck.warnings) {
        console.log(`  Warning:                Stale reference "${w.stale}" in ${w.file}`);
      }
    }

    console.log('');
  }

  // MCP runtime check if requested
  if (flags.mcp || flags['mcp-runtime']) {
    console.log('--- MCP Runtime ---');
    const mcpChecks = checkMcpRuntime();
    console.log(`  Config exists:         ${mcpChecks.configExists ? 'YES' : 'NO'}`);
    console.log(`  Command exists:        ${mcpChecks.commandExists ? 'YES' : 'NO'}`);
    console.log(`  Runtime check:         ${mcpChecks.runtimeAvailable ? 'OK' : 'NOT VERIFIED'}`);
    console.log(`  Tools available:       ${mcpChecks.toolsAvailable ? 'YES' : 'NO'}`);
    console.log('');
  }

  // Final status
  if (criticalFailed) {
    console.log('Result: NOT HEALTHY');
    console.log('');
    console.log('Critical checks failed. Fix with:');
    console.log('  laraskills init --repair');
    process.exit(1);
  } else if (assistantIssues > 0) {
    console.log('Result: NOT HEALTHY');
    console.log('');
    console.log('Some assistant configurations need attention. Fix with:');
    console.log('  laraskills init --repair');
    process.exit(1);
  } else {
    console.log('Result: HEALTHY');
    if (checkAllAssistants && !isPublic) {
      console.log('');
      console.log('All assistant integrations are properly configured.');
    }
    if (packagedRoot) {
      console.log('Intelligence is running from the packaged bundle.');
    }
  }
}

function cmdRepair(target, flags = {}) {
  const dryRun = flags.dryRun || false;
  const profile = flags.profile || 'core';
  const state = readState(target);
  const autoTools = [];
  if (state && state.assistants) autoTools.push(...state.assistants);

  log('LaraSkills Repair Mode');
  log(`Target: ${target}`);
  log(`Profile: ${state?.profile || profile}`);
  console.log('');

  const changes = [];
  let needsReinit = false;

  // Step 1: Ensure .laraskills directory and state file
  if (!state) {
    log('No init state found. Running full init first...');
    needsReinit = true;
  }

  // Step 2: Recreate .laraskills/skills from package source
  const laraSkillsDir = join(target, LARASKILLS_ROOT_DIR);
  const laraSkillsSkillsDir = join(laraSkillsDir, 'skills');
  if (!dryRun) {
    mkdirSync(laraSkillsSkillsDir, { recursive: true });
  }

  const srcSkillsDir = join(ROOT, 'skills');
  if (existsSync(srcSkillsDir)) {
    const allSkills = readdirSync(srcSkillsDir);
    for (const skill of allSkills) {
      const srcSkill = join(srcSkillsDir, skill);
      if (statSync(srcSkill).isDirectory()) {
        const destSkill = join(laraSkillsSkillsDir, skill);
        if (!dryRun) {
          cpSync(srcSkill, destSkill, { recursive: true });
          changes.push(`Recreated .laraskills/skills/${skill}/`);
        } else {
          changes.push(`Would recreate .laraskills/skills/${skill}/`);
        }
      }
    }
  }

  // Step 3: Regenerate skill registry
  if (!dryRun) {
    try {
      const registry = generateRegistry(target, ROOT, state?.profile || profile, pkg.version);
      writeFileSync(join(target, REGISTRY_PATH), JSON.stringify(registry, null, 2));
      changes.push(`Regenerated ${REGISTRY_PATH} (${registry.skills?.length || 0} skills)`);
    } catch (e) {
      warn(`Registry regeneration: ${e.message}`);
    }
  } else {
    changes.push(`Would regenerate ${REGISTRY_PATH}`);
  }

  // Step 4: Recreate state file if needed
  if (!state && !dryRun) {
    const newState = {
      version: pkg.version,
      target,
      repaired_at: new Date().toISOString(),
      profile,
      integration: 'full',
      assistants: [],
      tools: [],
      components: [],
    };
    writeState(target, newState);
    changes.push('Created .laraskills-state.json');
  }

  // Step 5: Refresh all assistant configs to use canonical paths
  const allAssistants = ASSISTANT_IDS;
  const toolIds = autoTools.length > 0 ? autoTools.filter(id => getToolDefinition(id)) : allAssistants;

  console.log('');
  log('Repairing assistant integrations...');

  for (const toolId of toolIds) {
    const def = getToolDefinition(toolId);
    if (!def) {
      warn(`Unknown tool: ${toolId} — skipping`);
      continue;
    }
    try {
      const results = setupToolIntegration(toolId, target, { dryRun, force: true });
      for (const r of results) {
        const label = r.action === 'created' ? 'Created' : r.action === 'merged' ? 'Updated' : r.action === 'replaced' ? 'Replaced' : r.action === 'would-create' ? 'Would create' : r.action;
        changes.push(`${label} ${def.displayName}: ${r.file}`);
      }
      if (results.length === 0) {
        changes.push(`No changes for ${def.displayName}`);
      }
    } catch (e) {
      warn(`${def.displayName}: ${e.message}`);
    }
  }

  // Step 6: Also set up generic MCP if not explicitly selected
  if (!toolIds.includes('generic-mcp') && !dryRun) {
    try {
      setupToolIntegration('generic-mcp', target, { dryRun });
      changes.push('Refreshed generic MCP config');
    } catch {}
  }

  // Step 7: Clean up stale references
  if (!dryRun) {
    // Remove old state file if it exists
    if (existsSync(join(target, LEGACY_STATE_FILE))) {
      try { rmSync(join(target, LEGACY_STATE_FILE)); changes.push(`Removed stale ${LEGACY_STATE_FILE}`); } catch {}
    }
  }

  // Step 8: Clean old skills/ directory if .laraskills/skills is canonical
  const oldSkillsDir = join(target, 'skills');
  if (existsSync(oldSkillsDir) && existsSync(laraSkillsSkillsDir)) {
    if (!dryRun) {
      try {
        // Only remove if it looks like it only has LaraSkills skills
        const oldEntries = readdirSync(oldSkillsDir);
        const known = oldEntries.filter(e => ALL_KNOWN_SKILL_NAMES.includes(e));
        if (known.length === oldEntries.length) {
          rmSync(oldSkillsDir, { recursive: true, force: true });
          changes.push('Removed old skills/ directory (migrated to .laraskills/skills/)');
        } else {
          changes.push('Old skills/ directory has non-LaraSkills content — left in place');
        }
      } catch (e) {
        warn(`Could not remove old skills/: ${e.message}`);
      }
    } else {
      changes.push('Would check old skills/ for migration');
    }
  }

  // Step 9: Fix OpenCode config skill paths
  if (!dryRun) {
    const openCodeCfgPath = join(target, '.opencode', 'opencode.json');
    if (existsSync(openCodeCfgPath)) {
      try {
        let cfg = JSON.parse(readFileSync(openCodeCfgPath, 'utf-8'));
        let changed = false;

        // Fix skills.paths to use .laraskills/skills
        if (cfg.skills && cfg.skills.paths && Array.isArray(cfg.skills.paths)) {
          const needsFix = cfg.skills.paths.some(p =>
            p === '../skills' || p === 'skills' || p === '../.laraskills/skills'
          );
          if (needsFix) {
            cfg.skills.paths = ['.laraskills/skills'];
            changed = true;
          }
        }

        // Fix instructions paths from skills/ to .laraskills/skills/
        if (cfg.instructions && Array.isArray(cfg.instructions)) {
          cfg.instructions = cfg.instructions.map(p => {
            if (p.startsWith('skills/')) return `.laraskills/${p}`;
            if (p.startsWith('../skills/')) return `.laraskills/skills/${p.replace('../skills/', '')}`;
            return p;
          });
          changed = true;
        }

        if (changed) {
          const backup = safelyBackup(openCodeCfgPath);
          writeFileSync(openCodeCfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
          changes.push(`Updated OpenCode config paths (backup: ${backup || 'none'})`);
        }
      } catch (e) {
        warn(`Could not update OpenCode config: ${e.message}`);
      }
    }

    // Fix Claude Code config skill paths
    const claudeCfgPath = join(target, '.claude', 'settings.json');
    if (existsSync(claudeCfgPath)) {
      try {
        let cfg = JSON.parse(readFileSync(claudeCfgPath, 'utf-8'));
        if (cfg.instructions && Array.isArray(cfg.instructions)) {
          const original = [...cfg.instructions];
          cfg.instructions = cfg.instructions.map(p => {
            if (p.startsWith('skills/')) return `.laraskills/${p}`;
            return p;
          });
          if (JSON.stringify(cfg.instructions) !== JSON.stringify(original)) {
            const backup = safelyBackup(claudeCfgPath);
            writeFileSync(claudeCfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
            changes.push(`Updated Claude Code config paths (backup: ${backup || 'none'})`);
          }
        }
      } catch (e) {
        warn(`Could not update Claude Code config: ${e.message}`);
      }
    }
  }

  // Step 10: Update state
  if (!dryRun) {
    const repairState = {
      ...(state || {}),
      version: pkg.version,
      repaired_at: new Date().toISOString(),
      profile: state?.profile || profile,
      integration: state?.integration || 'full',
      assistants: state?.assistants || [],
      tools: [...new Set([...(state?.tools || []), ...toolIds])],
      components: state?.components || [],
    };
    writeState(target, repairState);
    changes.push('Updated .laraskills-state.json');
  }

  console.log('');
  log('Repair complete!');
  console.log('');
  console.log('Changes made:');
  for (const c of changes) {
    console.log(`  + ${c}`);
  }

  if (dryRun) {
    console.log('');
    console.log('This was a dry run. Run without --dry-run to apply changes.');
  }
}

function install(target, profile, toolIds = [], flags = {}) {
  const dryRun = flags.dryRun || flags.dryrun || false;
  const installProjectFiles = flags.installProjectFiles !== undefined ? flags.installProjectFiles : true;
  const detected = detectTools(target);
  const isLaravel = isLaravelProject(target);

  log(`LaraSkills v${pkg.version}`);
  log(`Target: ${target}`);
  log(`Profile: ${profile}`);
  if (isLaravel) log(`Laravel project: detected`);
  else log(`Laravel project: NOT detected (proceeding anyway)`);

  if (dryRun) {
    log('Mode: DRY RUN — no files will be written');
  }

  console.log('');

  const agents = profile === 'minimal'
    ? ['laravel-artisan.md']
    : ['laravel-artisan.md', 'laravel-eloquent.md', 'laravel-migration.md', 'laravel-database.md', 'laravel-container.md'];

  const skillList = profile === 'minimal'
    ? ['laravel-patterns', 'laravel-tdd', 'laravel-security']
    : ['laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals', 'laravel-eloquent', 'laravel-database'];

  if (installProjectFiles) {
    const skillsDir = join(target, LARASKILLS_ROOT_DIR, 'skills');
    if (!dryRun) mkdirSync(skillsDir, { recursive: true });

    for (const skill of skillList) {
      const src = join(ROOT, 'skills', skill);
      if (existsSync(src)) {
        if (!dryRun) {
          cpSync(src, join(skillsDir, skill), { recursive: true });
          log(`  + Installed skill: ${skill}`);
        } else {
          log(`  ? Would install skill: ${skill}`);
        }
      }
    }

    if (!dryRun) {
      copyRules(target);
      copyHooks(target);
      copyMcpConfigs(target);
    } else {
      log('  ? Would sync rules');
      log('  ? Would sync hooks');
      log('  ? Would sync MCP configs');
    }

    const agentsDir = join(target, 'agents');
    if (!dryRun) mkdirSync(agentsDir, { recursive: true });
    for (const agent of agents) {
      const src = join(ROOT, 'agents', agent);
      if (existsSync(src)) {
        if (!dryRun) {
          copyFileSync(src, join(agentsDir, agent));
          log(`  + Installed agent: ${agent}`);
        } else {
          log(`  ? Would install agent: ${agent}`);
        }
      }
    }

    if (profile === 'full') {
      if (!dryRun) {
        copyCommands(target);
        copyHarnessConfigs(target);
      } else {
        log('  ? Would sync commands');
        log('  ? Would sync harness configs');
      }
    }
  } else {
    log('  - Skipping project files (MCP-only integration)');
    if (dryRun) {
      log('  ? Would skip skills, rules, hooks, agents');
    }
  }

  let toolResults = [];
  if (toolIds.length > 0) {
    console.log('');
    log('Configuring tool integrations...');
    for (const toolId of toolIds) {
      const def = getToolDefinition(toolId);
      if (!def) {
        warn(`Unknown tool: ${toolId} — skipping`);
        continue;
      }
      try {
        const results = setupToolIntegration(toolId, target, { dryRun });
        for (const r of results) {
          const actionLabel = r.action === 'created' ? '+' : r.action === 'merged' ? '~' : r.action === 'replaced' ? '~' : '?';
          const backupNote = r.backup ? ` (backed up to ${r.backup})` : '';
          if (dryRun) {
            log(`  ? Would configure ${def.displayName}: ${r.file}`);
          } else {
            log(`  ${actionLabel} ${def.displayName}: ${r.file}${backupNote}`);
          }
        }
        if (results.length === 0) {
          log(`  - ${def.displayName}: nothing to configure`);
        }
        toolResults.push(...results);
      } catch (e) {
        warn(`${def.displayName}: ${e.message}`);
      }
    }
  }

  const installedComponents = installProjectFiles
    ? [...new Set([...skillList, 'rules', 'hooks', 'mcp-configs', ...agents.map(a => a.replace('.md', ''))])]
    : [];
  const installedTools = toolIds.filter(id => getToolDefinition(id));
  const userSelectedAssistants = flags.assistants && flags.assistants.length > 0
    ? flags.assistants
    : toolIds.filter(id => id !== 'generic-mcp');
  const autoAddedTools = installedTools
    .filter(id => !userSelectedAssistants.includes(id))
    .map(id => getToolDefinition(id)?.displayName || id);
  const state = {
    version: pkg.version,
    target,
    installed_at: new Date().toISOString(),
    profile,
    integration: flags.integration || 'full',
    assistants: userSelectedAssistants,
    tools: [...new Set([...detected, ...installedTools])],
    components: installedComponents,
  };
  if (!dryRun) {
    writeState(target, state);

    if (installProjectFiles) {
      try {
        const registry = generateRegistry(target, ROOT, profile, pkg.version);
        writeFileSync(join(target, '.laraskills', 'skill-registry.json'), JSON.stringify(registry, null, 2));
        log(`  + Generated skill registry: ${Object.keys(registry.skills || {}).length || 0} skills`);
      } catch (e) {
        warn(`Skill registry generation failed (non-fatal): ${e.message}`);
      }
    }
  }

  console.log('');
  log('Installation complete!');
  log(`Profile: ${profile}`);
  if (!dryRun) {
    const userLabels = userSelectedAssistants
      .filter(id => getToolDefinition(id))
      .map(id => getToolDefinition(id)?.displayName || id);
    log(`Tool integrations: ${userLabels.join(', ') || 'none'}`);
    if (autoAddedTools.length > 0) {
      log(`Shared MCP config: generated`);
    }
    console.log('');
    console.log('Next steps:');
    console.log(`  laraskills doctor               Verify everything is set up`);
    console.log(`  laraskills retrieve "<task>"    Get AI-ready Laravel context`);
  }
  if (dryRun) {
    console.log('');
    console.log('To apply these changes, run without --dry-run.');
  }
}

function doUpdate(target, updateFlags = {}) {
  const dryRun = updateFlags.dryRun || updateFlags.dryrun || false;
  let toolIds = parseToolList(updateFlags.tools || updateFlags.tool || '');

  const state = readState(target);
  if (!state) {
    err('Not installed. Run `npx laraskills init` first.');
  }

  if (toolIds.length === 0 && state.assistants && state.assistants.length > 0) {
    toolIds = state.assistants.filter(id => getToolDefinition(id));
  }

  if (state.legacyStateFile) {
    warn(`Migrating legacy state file ${state.legacyStateFile} to .laraskills-state.json.`);
  }
  log(`LaraSkills v${pkg.version}`);
  log(`Updating from v${state.version} to v${pkg.version}`);
  log(`Target: ${target}`);
  log(`Profile: ${state.profile}`);
  if (toolIds.length > 0) {
    const toolLabels = toolIds.map(id => getToolDefinition(id)?.displayName || id).join(', ');
    log(`Repairing assistants: ${toolLabels}`);
  }

  if (dryRun) {
    log('Mode: DRY RUN — no files will be written');
  }
  console.log('');

  const skillsDir = join(target, LARASKILLS_ROOT_DIR, 'skills');
  if (!dryRun) mkdirSync(skillsDir, { recursive: true });
  const srcSkillsDir = join(ROOT, 'skills');
  if (existsSync(srcSkillsDir)) {
    const installed = readdirSync(srcSkillsDir);
    for (const skill of installed) {
      const src = join(srcSkillsDir, skill);
      if (statSync(src).isDirectory()) {
        if (!dryRun) {
          cpSync(src, join(skillsDir, skill), { recursive: true });
          log(`  ~ Updated skill: ${skill}`);
        } else {
          log(`  ? Would update skill: ${skill}`);
        }
      }
    }
  }

  if (!dryRun) {
    copyRules(target);
    copyHooks(target);
    copyMcpConfigs(target);
  } else {
    log('  ? Would refresh rules');
    log('  ? Would refresh hooks');
    log('  ? Would refresh MCP configs');
  }

  const agentsDir = join(target, 'agents');
  if (!dryRun) mkdirSync(agentsDir, { recursive: true });
  const srcAgentsDir = join(ROOT, 'agents');
  if (existsSync(srcAgentsDir)) {
    const installed = readdirSync(srcAgentsDir);
    for (const agent of installed) {
      if (agent.endsWith('.md')) {
        if (!dryRun) {
          copyFileSync(join(srcAgentsDir, agent), join(agentsDir, agent));
          log(`  ~ Updated agent: ${agent}`);
        } else {
          log(`  ? Would update agent: ${agent}`);
        }
      }
    }
  }

  if (state.profile === 'full') {
    if (!dryRun) {
      copyCommands(target);
      copyHarnessConfigs(target);
    } else {
      log('  ? Would refresh commands');
      log('  ? Would refresh harness configs');
    }
  }

  if (toolIds.length > 0) {
    console.log('');
    log('Refreshing tool integrations...');
    for (const toolId of toolIds) {
      const def = getToolDefinition(toolId);
      if (!def) {
        warn(`Unknown tool: ${toolId} — skipping`);
        continue;
      }
      try {
        const results = setupToolIntegration(toolId, target, { dryRun });
        for (const r of results) {
          const actionLabel = r.action === 'created' ? '+' : r.action === 'merged' ? '~' : r.action === 'replaced' ? '~' : '?';
          if (dryRun) {
            log(`  ? Would refresh ${def.displayName}: ${r.file}`);
          } else {
            log(`  ${actionLabel} Refreshed ${def.displayName}: ${r.file}`);
          }
        }
      } catch (e) {
        warn(`${def.displayName}: ${e.message}`);
      }
    }
  }

  const updatedComponents = [];
  const skillsCheckPath = join(target, LARASKILLS_ROOT_DIR, 'skills');
  const oldSkillsCheckPath = join(target, 'skills');
  if (existsSync(skillsCheckPath)) {
    const skillDirs = readdirSync(skillsCheckPath);
    updatedComponents.push(...skillDirs);
  } else if (existsSync(oldSkillsCheckPath)) {
    const skillDirs = readdirSync(oldSkillsCheckPath);
    updatedComponents.push(...skillDirs);
  }
  updatedComponents.push('rules', 'hooks', 'mcp-configs');
  if (existsSync(join(target, 'agents'))) {
    const agentFiles = readdirSync(join(target, 'agents')).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    updatedComponents.push(...agentFiles);
  }

  const newState = {
    ...state,
    version: pkg.version,
    updated_at: new Date().toISOString(),
    components: updatedComponents,
    assistants: state.assistants || [],
    tools: state.tools || [],
  };
  if (!dryRun) {
    writeState(target, newState);

    if (existsSync(skillsCheckPath) || existsSync(oldSkillsCheckPath)) {
      try {
        const registry = generateRegistry(target, ROOT, state.profile || 'core', pkg.version);
        writeFileSync(join(target, '.laraskills', 'skill-registry.json'), JSON.stringify(registry, null, 2));
        log(`  ~ Updated skill registry: ${registry.skills?.length || 0} skills`);
      } catch (e) {
        warn(`Skill registry update failed (non-fatal): ${e.message}`);
      }
    }
  }

  console.log('');
  log('Update complete!');
  if (state.version !== pkg.version) {
    log(`Updated from v${state.version} to v${pkg.version}`);
  } else {
    log(`Already at latest version v${pkg.version}`);
  }
  if (dryRun) {
    console.log('');
    console.log('To apply these changes, run without --dry-run.');
  }
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yes' || args[i] === '-y') {
      flags.yes = true;
      flags.y = true;
      continue;
    }
    if (args[i] === '--dry-run') {
      flags.dryRun = true;
      flags.dryrun = true;
      continue;
    }
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '').replace(/-/g, '').toLowerCase();
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

function parseToolList(toolsArg) {
  if (!toolsArg || toolsArg === true) return [];
  return toolsArg.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
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
  lines.push('  cd my-laravel-project');
  lines.push('  laraskills init                  Prepare the project (interactive)');
  lines.push('  laraskills doctor                Verify everything');
  lines.push('  laraskills retrieve "<task>"     Get context for an AI agent');
  lines.push('');
  lines.push('No manual clone required. Packaged intelligence works out of the box.');
  lines.push('Run `laraskills setup --help` only if you need an advanced custom knowledge source.');
  lines.push('');
  lines.push('Machine commands:');
  lines.push('  setup       Advanced: point to a custom LaraSkills checkout');
  lines.push('  doctor      Diagnose and verify LaraSkills integration');
  lines.push('');
  lines.push('Project commands:');
  lines.push('  init        Prepare the current Laravel project (interactive, recommended)');
  lines.push('  install     Install project files (legacy, use init instead)');
  lines.push('  update      Refresh installed project files and tool integration');
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
  lines.push('  --help              Show this help');
  lines.push('  -v, --version       Show version');
  lines.push('  <command> --help    Show command-specific help');
  lines.push('');
  lines.push('Init options:');
  lines.push('  --assistants <ids>   Coding assistants (opencode,codex,cursor,claude-code,generic-mcp,all,none)');
  lines.push('  --assistant <id>     Single assistant (backward-compatible alias)');
  lines.push('  --tools <ids>        Legacy alias for --assistants');
  lines.push('  --integration <level> Full|mcp-only|project-files (default: full)');
  lines.push('  --profile <name>     Minimal|core|full (default: core)');
  lines.push('  --yes, -y            Skip prompts, use defaults');
  lines.push('  --dry-run            Preview without writing files');
  lines.push('');
  lines.push('Integration levels:');
  lines.push('  full           MCP + skills + agents + rules + hooks + configs (default)');
  lines.push('  mcp-only       Dynamic LaraSkills knowledge through MCP, no project files');
  lines.push('  project-files  Skills, agents, rules, hooks, no MCP wiring');
  lines.push('');
  lines.push('Retrieval options:');
  lines.push('  --mode compact|standard|deep          Context bundle mode (default: standard)');
  lines.push('  --format markdown|json                Output format (default: markdown)');
  lines.push('  --laraskills-root <path>              Path to LaraSkills checkout');
  lines.push('  --budget <number>                     Estimated token budget');
  lines.push('  --domain <domain-id>                  Filter by domain');
  lines.push('  --include-content                     Include Markdown content (get only)');
  lines.push('');
  lines.push('Profiles (init/install):');
  lines.push('  minimal   3 starter skills + rules, hooks, MCP configs, Artisan agent');
  lines.push('  core      6 core skills + rules, hooks, MCP configs, 5 agents (default)');
  lines.push('  full      Core profile + commands and harness configs');
  lines.push('');
  lines.push('Tool integrations (init --tools):');
  lines.push('  opencode       Fully supported (MCP + instructions, agents, commands)');
  lines.push('  generic-mcp    Standard MCP config for any MCP-compatible tool');
  lines.push('  codex          Codex CLI (template only)');
  lines.push('  claude-code    Claude Code (template only)');
  lines.push('  cursor         Cursor IDE (template only)');
  lines.push('');
  lines.push('Examples:');
  lines.push('  laraskills init');
  lines.push('  laraskills init --assistants all --integration full --profile core --yes');
  lines.push('  laraskills init --assistants opencode,codex --integration full --profile core --yes');
  lines.push('  laraskills init --assistants none --integration project-files --profile minimal --yes');
  lines.push('  laraskills init --profile core --tools opencode --yes   (legacy, still works)');
  lines.push('  laraskills retrieve "Add authorization policy and Pest tests"');
  lines.push('  laraskills get "security-identity-engineering/authorization/policies-model" --include-content');
  lines.push('');
  lines.push('Environment:');
  lines.push('  LARASKILLS_ROOT   Path to a custom LaraSkills checkout (advanced)');
  lines.push('');
  console.log(lines.join('\n'));
}

function showCommandHelp(command) {
  const help = {
    setup: [
      '',
      'Usage: laraskills setup --laraskills-root <path>',
      '',
      'ADVANCED: Configure the CLI and MCP server to use a custom LaraSkills checkout.',
      '',
      'Normal users do NOT need to run setup. The npm package includes bundled',
      'intelligence files that work out of the box without a manual clone.',
      '',
      'Only use setup when you need to:',
      '  - Point to a local development checkout of the full repository',
      '  - Override the packaged intelligence with a custom knowledge source',
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
      'Usage: laraskills doctor [options]',
      '',
      'Diagnose machine readiness, project initialization, and assistant integration.',
      '',
      'Reports:',
      '  - Package version, Node.js version',
      '  - LaraSkills project initialization status',
      '  - Skill registry presence and validation',
      '  - MCP config status for each assistant',
      '  - Skill accessibility through registry',
      '  - Stale laravel-ecc reference detection',
      '',
      'Options:',
      '  --opencode          Check OpenCode integration specifically',
      '  --cursor            Check Cursor integration specifically',
      '  --claude, --claude-code   Check Claude Code integration specifically',
      '  --codex             Check Codex integration specifically',
      '  --assistants all    Check all supported assistants',
      '  --benchmark         Pre-flight check before running benchmarks',
      '  --benchmark --package <path>   Save benchmark snapshot to file',
      '  --public            Sanitize output (hide internal skill/assistant names)',
      '  --laraskills-root <path>   Override intelligence root',
      '',
      'Examples:',
      '  laraskills doctor',
      '  laraskills doctor --opencode',
      '  laraskills doctor --assistants all',
      '  laraskills doctor --benchmark',
      '',
    ],
    init: [
      '',
      'Usage: laraskills init [options]',
      '',
      'Prepare the current Laravel project for LaraSkills.',
      '',
      'When run interactively (default), guides you through a clean 3-step wizard:',
      '  Step 1 — Choose coding assistants (OpenCode, Codex, Cursor, Claude Code, Generic MCP)',
      '  Step 2 — Choose integration level (Full, MCP only, Project files only)',
      '  Step 3 — Choose LaraSkills profile (Core, Minimal, Full)',
      '',
      'Multiple assistants can be selected at once (e.g. 1,2,3 or opencode,codex).',
      'Type "all" to select all assistants, "none" for project files only.',
      '',
      'Followed by a review screen before any files are written.',
      '',
      'Non-interactive mode (--yes):',
      '  laraskills init --assistants all --integration full --profile core --yes',
      '',
      'Assistants (--assistants, --assistant, --tools):',
      '  opencode       Fully supported — automatic MCP + instructions + agents + commands',
      '  codex          Template setup — generates Codex-compatible instructions',
      '  cursor         Template setup — generates Cursor-compatible rules',
      '  claude-code    Template setup — generates Claude Code-compatible config',
      '  generic-mcp    Reusable MCP config for any MCP-capable client',
      '  all            Select all assistants',
      '  none           Skip tool integration entirely',
      '',
      'Integration levels (--integration):',
      '  full           MCP + skills + agents + rules + hooks + configs',
      '  mcp-only       Dynamic LaraSkills knowledge through MCP only',
      '  project-files  Skills, agents, rules, hooks — no MCP wiring',
      '',
      'Profiles (--profile):',
      '  minimal   3 starter skills + rules, hooks, MCP configs, Artisan agent',
      '  core      6 core skills + rules, hooks, MCP configs, 5 agents (default)',
      '  full      Core profile + commands and harness configs',
      '',
      'Options:',
      '  --assistants <ids>     Comma-separated assistant IDs (opencode,codex,cursor,claude-code,generic-mcp,all,none)',
      '  --assistant <id>       Single assistant (backward-compatible alias)',
      '  --tools <ids>          Legacy alias for --assistants',
      '  --tool <id>            Legacy alias for --assistant',
      '  --integration <level>  Integration level (full, mcp-only, project-files)',
      '  --profile <name>       Profile (minimal, core, full)',
      '  --yes, -y              Skip prompts, use provided or default values',
      '  --dry-run              Preview without writing files',
      '',
      'Examples:',
      '  laraskills init',
      '  laraskills init --assistants all --integration full --profile core --yes',
      '  laraskills init --assistants opencode,codex --integration full --profile core --yes',
      '  laraskills init --assistants opencode,generic-mcp --integration mcp-only --profile minimal --yes',
      '  laraskills init --assistants none --integration project-files --profile minimal --yes',
      '  laraskills init --profile core --tools opencode --yes   (legacy, still works)',
      '',
    ],
    install: [
      '',
      'Usage: laraskills install [--profile minimal|core|full] [--tools <ids>]',
      '',
      'Install LaraSkills project files into the current project.',
      '',
      'Note: `laraskills init` is the recommended command for new users.',
      '  install is kept for backward compatibility.',
      '',
      'Profiles:',
      '  minimal   3 starter skills + rules, hooks, MCP configs, Artisan agent',
      '  core      6 core skills + rules, hooks, MCP configs, 5 agents (default)',
      '  full      Core profile + commands and harness configs',
      '',
      'Tool integrations (--tools):',
      '  opencode, generic-mcp, codex, claude-code, cursor',
      '',
      'Examples:',
      '  laraskills install',
      '  laraskills install --profile core --tools opencode',
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
      'Usage: laraskills update [options]',
      '',
      'Refresh the LaraSkills files installed inside the current project.',
      'Updates skills, agents, rules, hooks, MCP configs, tool integration',
      'files, and the state file to match the current CLI package version.',
      '',
      'Options:',
      '  --tools <ids>      Refresh specific tool integrations',
      '  --tool <id>        Single tool ID (alias for --tools)',
      '  --dry-run          Preview without writing files',
      '  --yes, -y          Skip prompts',
      '',
      'Note: To update the CLI package itself, use:',
      '  npm install -g laraskills     (global install)',
      '  npm update -g laraskills      (global update)',
      '  npm install --save-dev laraskills  (local project update)',
      '',
      'Examples:',
      '  laraskills update',
      '  laraskills update --tools opencode --yes',
      '  laraskills update --dry-run',
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
  const allArgs = args.slice(1);
  const flags = parseFlags(allArgs);

  // Repair mode: init --repair
  if (flags.repair) {
    cmdRepair(target, flags);
  } else if (flags.yes || flags.y) {
    const { assistants, integration, profile } = resolveInitOptions(flags);
    const installProject = shouldInstallProjectFiles(integration);
    const toolIds = getAssistantToolIds(assistants, integration);
    install(target, profile, toolIds, { ...flags, installProjectFiles: installProject, integration, assistants });
  } else if (!isTerminalInteractive()) {
    err('Terminal is not interactive. Use --yes for non-interactive mode:\n  laraskills init --assistants opencode,codex --integration full --profile core --yes');
  } else {
    const { assistants, integration, profile } = resolveInitOptions(flags);
    const installProject = shouldInstallProjectFiles(integration);
    const toolIds = getAssistantToolIds(assistants, integration);
    runInteractiveInit({ target, flags: { ...flags, assistants: flags.assistants || null, integration, profile } })
      .then((result) => {
        if (result.cancelled) return;

        if (!result.isLaravel && !flags.yes && !flags.y) {
          console.log('');
          warn('Current directory does not appear to be a Laravel project.');
          console.log('  Proceeding anyway. Some Laravel-specific checks may be skipped.');
          console.log('');
        }
        install(target, result.profile, result.toolIds, {
          ...result,
          installProjectFiles: result.installProject,
          integration: result.integration,
          assistants: result.assistants,
        });
      })
      .catch(e => {
        err(e.message);
      });
  }
} else if (args[0] === 'install') {
  const allArgs = args.slice(1);
  const flags = parseFlags(allArgs);
  const profile = flags.profile || 'core';
  const toolIds = parseToolList(flags.tools || flags.tool || '');
  console.log('');
  log('Tip: `laraskills init` is now the recommended command for preparing a project.');
  console.log('');
  install(target, profile, toolIds, flags);
} else if (args[0] === 'add') {
  const component = args[1];
  if (!component) {
    err('Usage: npx laraskills add <component>');
  }
  addComponent(target, component);
} else if (args[0] === 'update') {
  const allArgs = args.slice(1);
  const flags = parseFlags(allArgs);
  const toolIds = parseToolList(flags.tools || flags.tool || '');
  doUpdate(target, {
    ...flags,
    tools: flags.tools || flags.tool || '',
  });
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
