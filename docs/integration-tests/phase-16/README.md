# Phase 16 — Cross-Platform CI and Clean-Clone Reproducibility

This phase adds GitHub Actions continuous integration across Windows, macOS, and Ubuntu,
clean-clone reproducibility verification, packed-install verification, MCP smoke testing,
and cache regression coverage.

## Contents

| File | Purpose |
|------|---------|
| `phase-16-ci-matrix.md` | CI matrix design, Node.js selection, per-job commands |
| `phase-16-clean-clone-reproducibility.md` | Clean-clone strategy and deterministic rebuild |
| `phase-16-final-report.md` | Implementation report and local validation status |

## CI Jobs

| Job | OS | Node | What It Runs |
|-----|----|------|-------------|
| `test-matrix` | ubuntu, windows, macos | 18, 20, 22 | `npm ci`, `npm test`, `npm run benchmark`, `validate` |
| `reproducibility` | ubuntu, windows, macos | 20 | `npm ci`, `npm run verify:clean-clone` |
| `packed-install` | ubuntu, windows, macos | 20 | `npm ci`, `npm run verify:packed-install` |
| `mcp-smoke` | ubuntu, windows, macos | 20 | `npm ci`, `npm run verify:mcp` |

## Phase 16.1: Inject-Dependency-Edges Optimization

The `tools/generation/inject-dependency-edges.ps1` script was optimized as part of Phase 16.
Cold injection improved from 461s to 118.5s (**3.9× faster**), warm injection from 276s to 52.8s
(**5.2× faster**). See `phase-16-final-report.md` for details.

## Verification Scripts

| Script | Purpose |
|--------|---------|
| `scripts/verify-clean-clone.mjs` | Clone repo into temp dir, install, rebuild, validate, confirm deterministic |
| `scripts/verify-packed-install.mjs` | Pack tarball, install in isolated project, verify CLI + MCP |
| `scripts/verify-mcp-smoke.mjs` | JSON-RPC smoke test of all 5 MCP tools |
| `tests/phase-15/cache-smoke.mjs` | Cache regression: isolation, same-size rewrite, rapid rewrites |

## Limitations

- Clean-clone verification runs `git ls-files` — only tracked files are copied
- Packed-install uses `npx --yes` which may resolve a cached version in CI
- Cache is in-process only; standalone CLI invocations do not share memory
- Very coarse timestamp filesystems (VFAT, exFAT) may need extra caution for same-size rapid rewrites
