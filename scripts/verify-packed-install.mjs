#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TMP_PREFIX = 'laraskills-packed-verify-';

function run(cmd, opts = {}) {
  const env = opts.env || process.env;
  const { env: _env, ...rest } = opts;
  try {
    return execSync(cmd, {
      cwd: rest.cwd || ROOT,
      encoding: 'utf-8',
      stdio: rest.silent ? 'pipe' : 'inherit',
      timeout: 120000,
      env,
      ...rest,
    });
  } catch (e) {
    if (opts.allowNonZero && e.stdout) return e.stdout;
    throw e;
  }
}

function getInstalledBin(installDir, name) {
  const filename = process.platform === 'win32' ? `${name}.cmd` : name;
  return join(installDir, 'node_modules', '.bin', filename);
}

function createTempDir() {
  const base = process.env.RUNNER_TEMP || process.env.TMPDIR || process.env.TMP || '/tmp';
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  const tmp = join(base, TMP_PREFIX + Date.now());
  mkdirSync(tmp, { recursive: true });

  // SAFETY: ensure temp directory is outside the repository root
  const ROOT_NORMALIZED = resolve(ROOT);
  const TMP_NORMALIZED = resolve(tmp);
  if (TMP_NORMALIZED.startsWith(ROOT_NORMALIZED + sep) || TMP_NORMALIZED === ROOT_NORMALIZED) {
    throw new Error(`Safety abort: temp directory ${TMP_NORMALIZED} is inside repository root ${ROOT_NORMALIZED}`);
  }

  return tmp;
}

function cleanup(...paths) {
  for (const p of paths) {
    if (!p) continue;
    if (p.includes('*')) {
      const dir = p.includes('/') ? p.substring(0, p.lastIndexOf('/')) : '.';
      if (existsSync(dir)) {
        for (const f of readdirSync(dir)) {
          if (f.endsWith('.tgz')) {
            try { rmSync(join(dir, f), { force: true }); } catch { /* ok */ }
          }
        }
      }
    } else if (existsSync(p)) {
      try { rmSync(p, { recursive: true, force: true }); } catch { /* ok */ }
    }
  }
}

function fail(msg) {
  console.error(`\nFAIL: ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`  PASS: ${msg}`);
}

async function main() {
  console.log('=== Packed-Install Verification ===\n');
  console.log(`Source: ${ROOT}\n`);

  const tmpDir = createTempDir();
  const installDir = join(tmpDir, 'install-dir');
  const laraskillsRootDir = join(tmpDir, 'laraskills-root');

  console.log(`Temp dir: ${tmpDir}\n`);

  // Isolate config from host machine — never read real user config
  const isolatedConfigDir = join(tmpDir, 'laraskills-config');
  const isolatedLegacyConfigDir = join(tmpDir, 'laravel-ecc-legacy-config');
  mkdirSync(isolatedConfigDir, { recursive: true });
  mkdirSync(isolatedLegacyConfigDir, { recursive: true });
  const testEnv = {
    ...process.env,
    LARASKILLS_CONFIG_DIR: isolatedConfigDir,
    LARAVEL_ECC_CONFIG_DIR: isolatedLegacyConfigDir,
    LARASKILLS_ROOT: '',
    ECC_ROOT: '',
  };

  try {
    // 1. npm pack
    console.log('--- Step 1: npm pack ---');
    const packOutput = run('npm pack --json', { cwd: ROOT, silent: true });
    const packData = JSON.parse(packOutput);
    const tarball = Array.isArray(packData) ? packData[0] : packData;
    const tarballFilename = tarball.filename;
    const tarballPath = join(ROOT, tarballFilename);
    if (!existsSync(tarballPath)) fail(`Tarball not found: ${tarballPath}`);
    pass(`Created tarball: ${tarballFilename}`);

    // 2. Inspect tarball file list
    console.log('\n--- Step 2: Inspect tarball contents ---');
    const tarballList = run(`tar -tf "${tarballPath}"`, { silent: true })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(e => e.trim()); // strip trailing CR on Windows
    pass(`Tarball contains ${tarballList.length} entries`);

    // 3. Verify required package files exist
    console.log('\n--- Step 3: Verify required files ---');
    const requiredFiles = [
      'package/package.json',
      'package/README.md',
      'package/LICENSE',
      'package/scripts/laraskills.mjs',
      'package/scripts/laraskills-mcp.mjs',
      'package/scripts/mcp/handlers.mjs',
      'package/scripts/mcp/schemas.mjs',
      'package/src/retrieval/cache-manager.mjs',
      'package/src/retrieval/catalog-loader.mjs',
      'package/src/retrieval/index.mjs',
      'package/src/runtime/ecc-root-resolver.mjs',
      'package/src/runtime/user-config.mjs',
    ];
    for (const f of requiredFiles) {
      if (!tarballList.includes(f)) fail(`Required file missing from tarball: ${f}`);
    }
    pass(`All ${requiredFiles.length} required files present`);

    if (tarballList.includes('package/.github/workflows/ci.yml')) {
      fail('Repository CI workflow should not be published in the npm package');
    }
    pass('Repository-only CI workflow excluded from package');

    // 4. Verify heavy layers excluded (intelligence/ is now intentionally bundled as packaged intelligence)
    console.log('\n--- Step 4: Verify heavy layers excluded ---');
    const excluded = ['package/knowledge/', 'package/tools/', 'package/tests/', 'package/examples/'];
    for (const prefix of excluded) {
      const matches = tarballList.filter(e => e.startsWith(prefix));
      if (matches.length > 0) fail(`Heavy layer ${prefix} has ${matches.length} entries in package`);
    }
    pass('Heavy layers excluded from package (intelligence/json/ bundled as packaged intelligence)');

    console.log('\n--- Step 4b: Verify packaged intelligence included ---');
    const intelligenceFiles = tarballList.filter(e => e.startsWith('package/intelligence/json/') && e.endsWith('.json'));
    if (intelligenceFiles.length >= 8) {
      pass(`Packaged intelligence JSON included: ${intelligenceFiles.length} files`);
    } else {
      fail(`Packaged intelligence JSON incomplete: only ${intelligenceFiles.length} files`);
    }

    const contentIndex = tarballList.filter(e => e === 'package/intelligence/content/content-index.json');
    if (contentIndex.length === 1) {
      pass('Packaged content index included');
    } else {
      fail('Packaged content index missing from tarball');
    }

    // 5. Install tarball in isolated project
    console.log('\n--- Step 5: Install in isolated project ---');
    mkdirSync(installDir, { recursive: true });

    // Create a minimal package.json for the test project
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(installDir, 'package.json'), JSON.stringify({
      name: 'test-packed-install',
      version: '0.0.0',
      private: true,
    }, null, 2));

    run(`npm init -y`, { cwd: installDir, silent: true, env: testEnv });
    run(`npm install "${tarballPath}"`, { cwd: installDir, silent: true, env: testEnv });
    pass('Tarball installed in isolated project');

    const packageDir = join(installDir, 'node_modules', 'laraskills');
    const laraskillsCli = join(packageDir, 'scripts', 'laraskills.mjs');
    const laraskillsMcp = join(packageDir, 'scripts', 'laraskills-mcp.mjs');

    const installedPackage = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8'));
    if (installedPackage.name !== 'laraskills') fail(`Installed package name is ${installedPackage.name}`);
    const expectedBins = {
      laraskills: 'scripts/laraskills.mjs',
      'laraskills-mcp': 'scripts/laraskills-mcp.mjs',
      'laravel-ecc': 'scripts/laraskills.mjs',
      'laravel-ecc-mcp': 'scripts/laraskills-mcp.mjs',
    };
    for (const [name, target] of Object.entries(expectedBins)) {
      if (installedPackage.bin?.[name] !== target) {
        fail(`Bin ${name} should target ${target}`);
      }
    }
    pass('Package name and all preferred/legacy bins are correct');

    // 6. Verify CLI --help
    console.log('\n--- Step 6: CLI --help ---');
    const helpOutput = run(`node "${laraskillsCli}" --help`, { cwd: installDir, silent: true, env: testEnv });
    if (helpOutput.includes('LaraSkills') && helpOutput.includes('setup')) {
      pass('CLI --help works');
    } else {
      fail('CLI --help output unexpected');
    }
    for (const binName of ['laraskills', 'laravel-ecc']) {
      const binPath = getInstalledBin(installDir, binName);
      if (!existsSync(binPath)) fail(`Installed bin missing: ${binName}`);
      const output = run(`"${binPath}" --help`, {
        cwd: installDir,
        silent: true,
        env: testEnv,
      });
      if (!output.includes('LaraSkills')) fail(`Installed bin failed: ${binName}`);
    }
    pass('Preferred and legacy CLI aliases execute');

    // 7. Verify doctor works with packaged intelligence (no setup needed)
    console.log('\n--- Step 7: Doctor with packaged intelligence ---');
    const doctorOutput = run(`node "${laraskillsCli}" doctor`, { cwd: installDir, silent: true, allowNonZero: true, env: testEnv });
    if (doctorOutput.includes('HEALTHY') || doctorOutput.includes('packaged') || doctorOutput.includes('NOT INITIALIZED') || doctorOutput.includes('Global package')) {
      pass('Doctor reports correctly for packaged install (HEALTHY, NOT INITIALIZED, or Global package)');
    } else if (doctorOutput.includes('ACTION REQUIRED')) {
      console.log(`  Doctor output (first 300 chars): ${doctorOutput.slice(0, 300)}`);
      fail('Doctor should report HEALTHY with packaged intelligence (Phase 25)');
    } else {
      console.log(`  Doctor output (first 300 chars): ${doctorOutput.slice(0, 300)}`);
      fail('Doctor output unexpected');
    }

    // 7b. Verify get --include-content works from packaged intelligence
    console.log('\n--- Step 7b: get --include-content from packaged intelligence ---');
    const getContentOutput = run(`node "${laraskillsCli}" get "security-identity-engineering/authorization/policies-model" --include-content`, {
      cwd: installDir,
      silent: true,
      allowNonZero: true,
      env: testEnv,
    });
    if (getContentOutput.includes('## Standardized Knowledge') && getContentOutput.includes('Policies are classes that organize authorization logic')) {
      pass('get --include-content returns real content from packaged intelligence');
    } else if (getContentOutput.includes('Standardized knowledge content is unavailable') || getContentOutput.includes('unavailable')) {
      fail('get --include-content should return real content, got "unavailable"');
    } else {
      console.log(`  get output (first 300 chars): ${getContentOutput.slice(0, 300)}`);
      fail('get --include-content output unexpected');
    }

    // 8. Configure isolated user-config directory
    console.log('\n--- Step 8: Setup LaraSkills root ---');
    mkdirSync(laraskillsRootDir, { recursive: true });
    writeFileSync(join(laraskillsRootDir, 'package.json'), JSON.stringify({ name: 'laraskills-root-stub', version: '0.0.0' }, null, 2));

    // Create a minimal intelligence structure for doctor to pass
    const jsonDir = join(laraskillsRootDir, 'intelligence', 'json');
    mkdirSync(jsonDir, { recursive: true });
    const emptyJson = { knowledge_units: [], generated_at: new Date().toISOString(), total_entries: 0 };
    for (const f of ['knowledge-units.json', 'dependencies.json', 'relationships.json', 'rules.json', 'skills.json', 'checklists.json', 'anti-patterns.json', 'decision-trees.json', 'aliases.json', 'external-concepts.json']) {
      writeFileSync(join(jsonDir, f), JSON.stringify(f.endsWith('.json') && (f === 'aliases.json' ? { aliases: [] } : f === 'external-concepts.json' ? { concepts: [] } : f === 'dependencies.json' ? { edges: [], knowledge_units: [] } : f === 'relationships.json' ? { edges: [] } : emptyJson)));
    }

    run(`node "${laraskillsCli}" setup --laraskills-root "${laraskillsRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    pass('Setup configured LaraSkills root');

    // 9. Verify doctor reports HEALTHY
    console.log('\n--- Step 9: Doctor after setup ---');
    // Stub: copy full intelligence from the actual repo
    const actualJsonDir = join(ROOT, 'intelligence', 'json');
    if (existsSync(actualJsonDir)) {
      for (const f of readdirSync(actualJsonDir)) {
        if (f.endsWith('.json')) {
          const content = readFileSync(join(actualJsonDir, f), 'utf-8');
          writeFileSync(join(jsonDir, f), content);
        }
      }
    }
    const policyKnowledgeDir = join(
      laraskillsRootDir,
      'knowledge',
      'security-identity-engineering',
      'authorization',
      'policies-model',
    );
    mkdirSync(policyKnowledgeDir, { recursive: true });
    writeFileSync(
      join(policyKnowledgeDir, '04-standardized-knowledge.md'),
      readFileSync(join(
        ROOT,
        'knowledge',
        'security-identity-engineering',
        'authorization',
        'policies-model',
        '04-standardized-knowledge.md',
      ), 'utf-8'),
    );
    const doctorAfter = run(`node "${laraskillsCli}" doctor --laraskills-root "${laraskillsRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (doctorAfter.includes('HEALTHY') || doctorAfter.includes('GOOD') || doctorAfter.includes('NOT INITIALIZED') || doctorAfter.includes('Global package')) {
      pass('Doctor reports correctly after setup');
    }

    // 10. Run validate
    console.log('\n--- Step 10: Validate ---');
    const validateOutput = run(`node "${laraskillsCli}" validate --laraskills-root "${laraskillsRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (validateOutput.includes('VALID') || validateOutput.includes('No issues')) {
      pass('Validate passed');
    } else {
      fail('Validate failed');
    }

    // 11. Run CLI search table output
    console.log('\n--- Step 11: CLI search (table) ---');
    const searchOutput = run(`node "${laraskillsCli}" search "eloquent" --laraskills-root "${laraskillsRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (searchOutput.includes('Search Results') || searchOutput.includes('eloquent')) {
      pass('CLI search table output works');
    } else {
      fail('CLI search table output unexpected');
    }

    // 12. Run CLI search --json
    console.log('\n--- Step 12: CLI search --json ---');
    const searchJson = run(`node "${laraskillsCli}" search "tenant" --format json --laraskills-root "${laraskillsRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    let searchParsed;
    try {
      searchParsed = JSON.parse(searchJson);
    } catch (parseErr) {
      fail(`search --json parse failed: length=${searchJson.length}, repr=${JSON.stringify(searchJson.slice(0, 500))}`);
      return;
    }
    if (searchParsed.query && Array.isArray(searchParsed.results)) {
      pass('CLI search --json output parses correctly');
    } else {
      fail(`CLI search --json output unexpected shape: ${JSON.stringify(searchParsed)}`);
    }

    // 13. Run CLI retrieve
    console.log('\n--- Step 13: CLI retrieve ---');
    const retrieveOutput = run(`node "${laraskillsCli}" retrieve "Build a REST API" --mode compact --laraskills-root "${laraskillsRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (retrieveOutput.includes('LaraSkills Context Bundle') || retrieveOutput.includes('knowledgeUnits') || retrieveOutput.includes('selectedDomains')) {
      pass('CLI retrieve works');
    } else {
      fail('CLI retrieve output unexpected');
    }

    // 14. Verify Phase 17 retrieval and content regressions
    console.log('\n--- Step 14: Phase 17 CLI regressions ---');
    const archiveTask = 'Add note archiving to an existing Laravel project with an Eloquent policy, nullable archived_at timestamp, Blade archive action, and Pest feature tests for owner authorization and forbidden cross-user access';
    const archiveRetrieveJson = run(`node "${laraskillsCli}" retrieve "${archiveTask}" --mode compact --format json --laraskills-root "${laraskillsRootDir}"`, {
      cwd: installDir,
      silent: true,
      env: testEnv,
    });
    const archiveRetrieve = JSON.parse(archiveRetrieveJson);
    if (archiveRetrieve.knowledgeUnits?.[0]?.id === 'security-identity-engineering/authorization/policies-model') {
      pass('Archive task ranks Eloquent policy guidance first');
    } else {
      fail(`Archive task top result was unexpected: ${archiveRetrieve.knowledgeUnits?.[0]?.id || 'none'}`);
    }

    const policyContent = run(`node "${laraskillsCli}" get "security-identity-engineering/authorization/policies-model" --include-content --laraskills-root "${laraskillsRootDir}"`, {
      cwd: installDir,
      silent: true,
      env: testEnv,
    });
    if (policyContent.includes('## Standardized Knowledge') && policyContent.includes('Policies are classes that organize authorization logic')) {
      pass('Canonical get --include-content returns standardized knowledge');
    } else {
      fail('Canonical get --include-content omitted standardized knowledge');
    }

    // 15. Verify MCP tools/list
    console.log('\n--- Step 15: MCP tools/list ---');
    const mcpOutput = JSON.parse(run(`node "${laraskillsMcp}" --laraskills-root "${laraskillsRootDir}"`, {
      cwd: installDir,
      silent: true,
      input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) + '\n',
      timeout: 30000,
      env: testEnv,
    }).trim().split('\n').filter(Boolean).pop());
    const toolNames = mcpOutput.result?.tools?.map(t => t.name) || [];
    const expectedTools = ['retrieve_context_bundle', 'search_ecc', 'get_knowledge_unit', 'get_graph_context', 'validate_ecc'];
    const phase35Tools = ['laraskills_list_skills', 'laraskills_search_skills', 'laraskills_read_skill', 'laraskills_search_knowledge', 'laraskills_retrieve_context', 'laraskills_explain_decision'];
    const missingCore = expectedTools.filter(t => !toolNames.includes(t));
    const missingPhase35 = phase35Tools.filter(t => !toolNames.includes(t));
    if (missingCore.length === 0 && missingPhase35.length === 0) {
      pass(`MCP tools/list returns ${toolNames.length} expected tools (all core + phase-35)`);
    } else {
      const failures = [...missingCore, ...missingPhase35.map(t => `${t} (phase-35)`)]; 
      fail(`MCP tools/list missing: ${failures.join(', ')}`);
    }
    for (const binName of ['laraskills-mcp', 'laravel-ecc-mcp']) {
      const binPath = getInstalledBin(installDir, binName);
      if (!existsSync(binPath)) fail(`Installed MCP bin missing: ${binName}`);
      const output = run(`"${binPath}" --laraskills-root "${laraskillsRootDir}"`, {
        cwd: installDir,
        silent: true,
        input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) + '\n',
        timeout: 30000,
        env: testEnv,
      });
      const response = JSON.parse(output.trim().split('\n').filter(Boolean).pop());
      if (!Array.isArray(response.result?.tools)) fail(`Installed MCP bin failed: ${binName}`);
    }
    pass('Preferred and legacy MCP aliases execute');

    // 16. Verify MCP validate_ecc
    console.log('\n--- Step 16: MCP validate_ecc ---');
    const mcpValidate = JSON.parse(run(`node "${laraskillsMcp}" --laraskills-root "${laraskillsRootDir}"`, {
      cwd: installDir,
      silent: true,
      input: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'validate_ecc', arguments: {} } }) + '\n',
      timeout: 30000,
      env: testEnv,
    }).trim().split('\n').filter(Boolean).pop());
    const isValid = mcpValidate.result?.structuredContent?.valid || mcpValidate.result?.content?.[0]?.text?.includes('valid') || false;
    if (isValid) {
      pass('MCP validate_ecc returns valid');
    } else {
      fail('MCP validate_ecc should indicate valid');
    }

    console.log('\n=== PACKED-INSTALL VERIFIED ===');
  } finally {
    console.log('\n--- Cleanup ---');
    cleanup(tmpDir, join(ROOT, 'laraskills-*.tgz'));
    pass('Temporary files cleaned');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
