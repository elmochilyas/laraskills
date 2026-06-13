# Clean-Clone Reproducibility

## Strategy

The `scripts/verify-clean-clone.mjs` script proves that a fresh checkout of the repository
produces identical results on any machine:

1. **Copy tracked state** — Uses `git ls-files` to enumerate all tracked files and copies
   them into an isolated temporary directory. This avoids dependency on the developer machine's
   `.git` hooks, stash, or untracked files.

2. **Install dependencies** — Runs `npm ci` in the temp clone for a deterministic install.

3. **Rebuild intelligence layer** — Runs the project's existing rebuild pipeline (detected
   automatically from `tools/` or `scripts/`).

4. **Validate** — Runs `node ./scripts/laravel-ecc.mjs validate` to confirm the intelligence
   layer is structurally sound.

5. **Record hashes** — SHA-256 hashes of all `intelligence/json/*.json` files are recorded.

6. **Second rebuild** — The rebuild pipeline runs again.

7. **Deterministic check** — Hashes from the first and second rebuild are compared. Any
   difference means the rebuild is not deterministic and must be fixed.

8. **Test suite** — `npm test` runs all 190+ tests.

9. **Benchmarks** — `npm run benchmark` confirms 72/72 benchmarks pass.

10. **Cleanup** — All temporary files are removed in a `finally` block.

## Rebuild Pipeline Used

The script automatically detects the existing rebuild pipeline by checking:

- `tools/generation/rebuild-intelligence.mjs`
- `tools/rebuild-intelligence.ps1`
- `tools/rebuild-intelligence.sh`
- `scripts/rebuild-intelligence.mjs`

If no rebuild script is found, it skips the rebuild step and uses pre-built intelligence.

## Deterministic Second-Rebuild Requirement

The second rebuild must produce no diff in the generated intelligence JSON files.
This proves that:

- The rebuild pipeline is idempotent
- No machine-specific data enters generated files
- Timestamps or randomness do not affect output
- The CI environment is fully reproducible

## Cross-Platform Compatibility

The script uses:
- `process.env.RUNNER_TEMP || process.env.TMPDIR || process.env.TMP || '/tmp'` for temp directory
- Node.js built-in APIs only (no shell-specific commands)
- `execSync` with explicit `cwd` and `encoding`
- `rmSync` with `force: true` for cross-platform cleanup
