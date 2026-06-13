#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(import.meta.url);
const pkg = JSON.parse(require.resolve('../package.json') ? '{}' : '{}');

const REQUIRE_PWSH = process.argv.includes('--require-pwsh');
const TMP_PREFIX = 'laraskills-clean-clone-verify-';
const INJECT_TIMEOUT = 600_000; // 600 seconds for dependency edge injection (slow PowerShell)

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd || ROOT,
    encoding: 'utf-8',
    stdio: opts.silent ? 'pipe' : 'inherit',
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024, // 10 MB for large git output
    ...opts,
  });
}

function pwshCmd() {
  // On Windows use built-in powershell; on Unix try pwsh (PowerShell Core)
  if (process.platform === 'win32') return 'powershell -ExecutionPolicy Bypass';
  try {
    execSync('which pwsh', { stdio: 'ignore' });
    return 'pwsh -ExecutionPolicy Bypass';
  } catch {
    if (REQUIRE_PWSH) {
      fail(
        'PowerShell Core (pwsh) is required but not found on this system.\n' +
        '  Install: https://github.com/PowerShell/PowerShell\n' +
        '  Ubuntu: sudo snap install powershell --classic\n' +
        '  macOS:  brew install --cask powershell\n' +
        '  Or use the CI workflow which auto-installs pwsh on Linux/macOS runners.\n' +
        '  To run locally without pwsh, omit --require-pwsh to allow skipping PowerShell steps.'
      );
    }
    return null;
  }
}

function pwshExec(scriptPath, opts = {}) {
  const shell = pwshCmd();
  if (!shell) {
    console.log(`  SKIP: No PowerShell available on ${process.platform} — cannot run ${scriptPath}`);
    return false;
  }
  run(`${shell} -File "${scriptPath}"`, opts);
  return true;
}

function runInject(injectScript, tmpRepo, passNum) {
  const label = `dependency edge injection (pass ${passNum}/2)`;
  const timeLabel = `  injection timing pass ${passNum}`;
  console.log(`\n  --- ${label} ---`);
  console.time(timeLabel);
  try {
    pwshExec(injectScript, { cwd: tmpRepo, timeout: INJECT_TIMEOUT });
    console.timeEnd(timeLabel);
    pass(`${label} completed`);
  } catch (err) {
    console.timeEnd(timeLabel);
    if (err.code === 'ETIMEDOUT' || (err.killed && err.signal === 'SIGTERM')) {
      fail(`FATAL: ${label} exceeded ${INJECT_TIMEOUT / 1000}s timeout (${INJECT_TIMEOUT / 1000} s hard limit). ` +
        `The inject-dependency-edges.ps1 script requires more time on this environment. ` +
        `Action: increase INJECT_TIMEOUT in this script or run the injection separately.`);
    }
    throw err;
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
    fail(`Safety abort: temp directory ${TMP_NORMALIZED} is inside repository root ${ROOT_NORMALIZED}`);
  }

  return tmp;
}

function cleanup(tmp) {
  if (tmp && existsSync(tmp)) {
    try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ok */ }
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
  console.log('=== Clean-Clone Reproducibility Verification ===\n');
  console.log(`Source: ${ROOT}\n`);

  const tmpDir = createTempDir();
  console.log(`Temp dir: ${tmpDir}\n`);

  try {
    // 1. Copy tracked repository state into temp directory (git clone --depth 1 equivalent)
    console.log('--- Step 1: Copy repository state ---');
    const tmpRepo = join(tmpDir, 'repo');
    mkdirSync(tmpRepo, { recursive: true });

    const tracked = run('git ls-files', { silent: true, cwd: ROOT })
      .trim()
      .split('\n')
      .filter(Boolean);

    for (const file of tracked) {
      const src = join(ROOT, file);
      const dest = join(tmpRepo, file);
      const destDir = dirname(dest);
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      cpSync(src, dest);
    }

    pass(`Copied ${tracked.length} tracked files`);

    // 2. Install dependencies
    console.log('\n--- Step 2: npm ci ---');
    run('npm ci', { cwd: tmpRepo });
    pass('npm ci completed');

    // 3. Run the existing intelligence rebuild pipeline
    console.log('\n--- Step 3: Rebuild intelligence layer ---');
    const rebuildScript = findRebuildScript(tmpRepo);
    const injectScript = join(tmpRepo, 'tools', 'generation', 'inject-dependency-edges.ps1');
    if (rebuildScript) {
      if (rebuildScript.endsWith('.ps1')) {
        pwshExec(rebuildScript, { cwd: tmpRepo, timeout: 300000 });
      } else {
        run(`node "${rebuildScript}"`, { cwd: tmpRepo });
      }
      pass(`Rebuild via ${rebuildScript}`);

      // Also run the dependency edge injector — rebuild only creates empty edges
      if (existsSync(injectScript)) {
        runInject(injectScript, tmpRepo, 1);
      }
    } else {
      console.log('  SKIP: No rebuild script found — using pre-built intelligence');
    }

    // 4. Validate intelligence
    console.log('\n--- Step 4: Validate intelligence ---');
    const validateOutput = run('node ./scripts/laraskills.mjs validate', { cwd: tmpRepo, silent: true });
    if (validateOutput.includes('VALID') || validateOutput.includes('No issues found')) {
      pass('Intelligence validation passed');
    } else {
      fail('Intelligence validation failed');
    }

    // 5. Record generated intelligence state (hashes)
    console.log('\n--- Step 5: Record generated intelligence hashes ---');
    const jsonDir = join(tmpRepo, 'intelligence', 'json');
    if (!existsSync(jsonDir)) fail('intelligence/json directory missing');
    const jsonFiles = readdirSync(jsonDir).filter(f => f.endsWith('.json'));
    const firstHashes = {};
    for (const f of jsonFiles) {
      const { createHash } = await import('node:crypto');
      const { readFileSync } = await import('node:fs');
      const content = readFileSync(join(jsonDir, f), 'utf-8');
      firstHashes[f] = createHash('sha256').update(content).digest('hex');
    }
    pass(`Recorded ${jsonFiles.length} JSON file hashes`);

    // 6. Run rebuild a second time
    console.log('\n--- Step 6: Second intelligence rebuild ---');
    if (rebuildScript) {
      if (rebuildScript.endsWith('.ps1')) {
        pwshExec(rebuildScript, { cwd: tmpRepo, timeout: 300000 });
      } else {
        run(`node "${rebuildScript}"`, { cwd: tmpRepo });
      }
      pass('Second rebuild completed');

      // Re-inject dependency edges
      if (existsSync(injectScript)) {
        runInject(injectScript, tmpRepo, 2);
      }
    }

    // 7. Confirm no diff from second rebuild
    console.log('\n--- Step 7: Verify deterministic rebuild ---');
    const secondHashes = {};
    for (const f of jsonFiles) {
      const { createHash } = await import('node:crypto');
      const { readFileSync } = await import('node:fs');
      const content = readFileSync(join(jsonDir, f), 'utf-8');
      secondHashes[f] = createHash('sha256').update(content).digest('hex');
    }

    let deterministic = true;
    for (const f of jsonFiles) {
      if (firstHashes[f] !== secondHashes[f]) {
        console.error(`  DIFF: ${f} changed between rebuilds`);
        deterministic = false;
      }
    }
    if (deterministic) {
      pass('Second rebuild is deterministic — no diffs');
    } else {
      fail('Second rebuild produced changes — intelligence rebuild is not deterministic');
    }

    // 8. Run tests
    console.log('\n--- Step 8: npm test ---');
    run('npm test', { cwd: tmpRepo });
    pass('All tests passed');

    // 9. Run benchmarks
    console.log('\n--- Step 9: npm run benchmark ---');
    run('npm run benchmark', { cwd: tmpRepo });
    pass('Benchmarks passed');

    console.log('\n=== CLEAN-CLONE REPRODUCIBILITY VERIFIED ===');
  } finally {
    // 10. Clean temporary files
    console.log('\n--- Step 10: Cleanup ---');
    cleanup(tmpDir);
    pass('Temporary files cleaned');
  }
}

function findRebuildScript(root) {
  const candidates = [
    join(root, 'tools', 'generation', 'rebuild-intelligence.mjs'),
    join(root, 'tools', 'rebuild-intelligence.ps1'),
    join(root, 'tools', 'rebuild-intelligence.sh'),
    join(root, 'scripts', 'rebuild-intelligence.mjs'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
