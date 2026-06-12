#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TMP_PREFIX = 'laravel-ecc-packed-verify-';

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
  const eccRootDir = join(tmpDir, 'ecc-root');

  console.log(`Temp dir: ${tmpDir}\n`);

  // Isolate config from host machine
  const isolatedConfigDir = join(tmpDir, 'ecc-config');
  mkdirSync(isolatedConfigDir, { recursive: true });
  const testEnv = { ...process.env, LARAVEL_ECC_CONFIG_DIR: isolatedConfigDir };

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
      'package/scripts/laravel-ecc.mjs',
      'package/scripts/laravel-ecc-mcp.mjs',
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

    // 4. Verify heavy layers excluded
    console.log('\n--- Step 4: Verify heavy layers excluded ---');
    const excluded = ['package/knowledge/', 'package/intelligence/', 'package/tools/', 'package/tests/', 'package/examples/'];
    for (const prefix of excluded) {
      const matches = tarballList.filter(e => e.startsWith(prefix));
      if (matches.length > 0) fail(`Heavy layer ${prefix} has ${matches.length} entries in package`);
    }
    pass('Heavy layers excluded from package');

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

    const ECC_CLI = join(installDir, 'node_modules', 'laravel-ecc', 'scripts', 'laravel-ecc.mjs');

    // 6. Verify CLI --help
    console.log('\n--- Step 6: CLI --help ---');
    const helpOutput = run(`node "${ECC_CLI}" --help`, { cwd: installDir, silent: true, env: testEnv });
    if (helpOutput.includes('Laravel ECC') && helpOutput.includes('setup')) {
      pass('CLI --help works');
    } else {
      fail('CLI --help output unexpected');
    }

    // 7. Verify doctor before setup
    console.log('\n--- Step 7: Doctor before setup ---');
    const doctorOutput = run(`node "${ECC_CLI}" doctor`, { cwd: installDir, silent: true, allowNonZero: true, env: testEnv });
    if (doctorOutput.includes('ACTION REQUIRED') || doctorOutput.includes('NOT FOUND')) {
      pass('Doctor reports actionable guidance before setup');
    } else {
      fail('Doctor should report action required before setup');
    }

    // 8. Configure isolated user-config directory
    console.log('\n--- Step 8: Setup ECC root ---');
    mkdirSync(eccRootDir, { recursive: true });
    writeFileSync(join(eccRootDir, 'package.json'), JSON.stringify({ name: 'ecc-root-stub', version: '0.0.0' }, null, 2));

    // Create a minimal intelligence structure for doctor to pass
    const jsonDir = join(eccRootDir, 'intelligence', 'json');
    mkdirSync(jsonDir, { recursive: true });
    const emptyJson = { knowledge_units: [], generated_at: new Date().toISOString(), total_entries: 0 };
    for (const f of ['knowledge-units.json', 'dependencies.json', 'relationships.json', 'rules.json', 'skills.json', 'checklists.json', 'anti-patterns.json', 'decision-trees.json', 'aliases.json', 'external-concepts.json']) {
      writeFileSync(join(jsonDir, f), JSON.stringify(f.endsWith('.json') && (f === 'aliases.json' ? { aliases: [] } : f === 'external-concepts.json' ? { concepts: [] } : f === 'dependencies.json' ? { edges: [], knowledge_units: [] } : f === 'relationships.json' ? { edges: [] } : emptyJson)));
    }

    run(`node "${ECC_CLI}" setup --ecc-root "${eccRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    pass('Setup configured ECC root');

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
    const doctorAfter = run(`node "${ECC_CLI}" doctor --ecc-root "${eccRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (doctorAfter.includes('HEALTHY')) {
      pass('Doctor reports HEALTHY after setup');
    } else {
      fail(`Doctor does not report HEALTHY: ${doctorAfter.slice(0, 200)}`);
    }

    // 10. Run validate
    console.log('\n--- Step 10: Validate ---');
    const validateOutput = run(`node "${ECC_CLI}" validate --ecc-root "${eccRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (validateOutput.includes('VALID') || validateOutput.includes('No issues')) {
      pass('Validate passed');
    } else {
      fail('Validate failed');
    }

    // 11. Run CLI search table output
    console.log('\n--- Step 11: CLI search (table) ---');
    const searchOutput = run(`node "${ECC_CLI}" search "eloquent" --ecc-root "${eccRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (searchOutput.includes('Search Results') || searchOutput.includes('eloquent')) {
      pass('CLI search table output works');
    } else {
      fail('CLI search table output unexpected');
    }

    // 12. Run CLI search --json
    console.log('\n--- Step 12: CLI search --json ---');
    const searchJson = run(`node "${ECC_CLI}" search "tenant" --format json --ecc-root "${eccRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    const searchParsed = JSON.parse(searchJson);
    if (searchParsed.query && Array.isArray(searchParsed.results)) {
      pass('CLI search --json output parses correctly');
    } else {
      fail('CLI search --json output unexpected shape');
    }

    // 13. Run CLI retrieve
    console.log('\n--- Step 13: CLI retrieve ---');
    const retrieveOutput = run(`node "${ECC_CLI}" retrieve "Build a REST API" --mode compact --ecc-root "${eccRootDir}"`, { cwd: installDir, silent: true, env: testEnv });
    if (retrieveOutput.includes('ECC Context Bundle') || retrieveOutput.includes('knowledgeUnits') || retrieveOutput.includes('selectedDomains')) {
      pass('CLI retrieve works');
    } else {
      fail('CLI retrieve output unexpected');
    }

    // 14. Verify MCP tools/list
    console.log('\n--- Step 14: MCP tools/list ---');
    const mcpOutput = JSON.parse(run(`node "${join(installDir, 'node_modules', 'laravel-ecc', 'scripts', 'laravel-ecc-mcp.mjs')}" --ecc-root "${eccRootDir}"`, {
      cwd: installDir,
      silent: true,
      input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) + '\n',
      timeout: 30000,
      env: testEnv,
    }).trim().split('\n').filter(Boolean).pop());
    const toolNames = mcpOutput.result?.tools?.map(t => t.name) || [];
    const expectedTools = ['retrieve_context_bundle', 'search_ecc', 'get_knowledge_unit', 'get_graph_context', 'validate_ecc'];
    const missingTools = expectedTools.filter(t => !toolNames.includes(t));
    if (missingTools.length === 0) {
      pass(`MCP tools/list returns ${toolNames.length} expected tools`);
    } else {
      fail(`MCP tools/list missing: ${missingTools.join(', ')}`);
    }

    // 15. Verify MCP validate_ecc
    console.log('\n--- Step 15: MCP validate_ecc ---');
    const mcpValidate = JSON.parse(run(`node "${join(installDir, 'node_modules', 'laravel-ecc', 'scripts', 'laravel-ecc-mcp.mjs')}" --ecc-root "${eccRootDir}"`, {
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
    cleanup(tmpDir, join(ROOT, 'laravel-ecc-*.tgz'));
    pass('Temporary files cleaned');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
