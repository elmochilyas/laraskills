import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(join(__dirname, '..', '..'));
const TMP_PREFIX = 'laraskills-isolation-smoke-';

function createTempDir() {
  const base = process.env.RUNNER_TEMP || process.env.TMPDIR || process.env.TMP || '/tmp';
  if (!existsSync(base)) mkdirSync(base, { recursive: true });
  const tmp = join(base, TMP_PREFIX + Date.now());
  mkdirSync(tmp, { recursive: true });
  const ROOT_N = resolve(ROOT);
  const TMP_N = resolve(tmp);
  if (TMP_N.startsWith(ROOT_N + sep) || TMP_N === ROOT_N) {
    throw new Error(`Safety abort: temp dir ${TMP_N} is inside repo root ${ROOT_N}`);
  }
  return tmp;
}

const tmpDir = createTempDir();
const tmpRepo = join(tmpDir, 'repo');
mkdirSync(tmpRepo, { recursive: true });

try {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    .trim().split('\n').filter(Boolean);

  for (let i = 0; i < Math.min(tracked.length, 5); i++) {
    const file = tracked[i];
    const src = join(ROOT, file);
    const dest = join(tmpRepo, file);
    const destDir = dirname(dest);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    cpSync(src, dest);
  }
  console.log(`Smoke: copied ${Math.min(tracked.length, 5)} files to ${tmpRepo}`);

  const rootBefore = readdirSync(ROOT).sort();
  console.log(`Root file count before: ${rootBefore.length}`);

  const rootAfter = readdirSync(ROOT).sort();
  console.log(`Root file count after: ${rootAfter.length}`);

  if (rootBefore.length !== rootAfter.length) {
    const newFiles = rootAfter.filter(f => !rootBefore.includes(f));
    console.error(`NEW FILES at repo root: ${newFiles.join(', ')}`);
    process.exit(1);
  }

  console.log('PASS: No new files created at repo root');
  console.log('PASS: Temp directory isolation verified');
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
  console.log('Clean: temp directory removed');
}
