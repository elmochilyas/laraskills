# CI Matrix Design

## Operating Systems

| OS | Purpose |
|----|---------|
| `ubuntu-latest` | Primary Linux target (most CI runners) |
| `windows-latest` | Windows target (PowerShell 5.1+) |
| `macos-latest` | macOS target (zsh/bash) |

All three OSes are required to prove cross-platform reproducibility.

## Node.js Matrix

| Version | Reason |
|---------|--------|
| 18 | Minimum required by `package.json` engines (`>=18`) |
| 20 | Current active LTS (recommended for most users) |
| 22 | Latest LTS (forward compatibility) |

The `test-matrix` job runs all three Node versions on all three OSes.
The heavier `reproducibility`, `packed-install`, and `mcp-smoke` jobs use Node 20 on all three OSes.

## Commands Per Job

### test-matrix

```yaml
- npm ci
- npm test
- npm run benchmark
- node ./scripts/laravel-ecc.mjs validate
```

### reproducibility

```yaml
- npm ci
- npm run verify:clean-clone
```

### packed-install

```yaml
- npm ci
- npm run verify:packed-install
```

### mcp-smoke

```yaml
- npm ci
- npm run verify:mcp
```

## Caching

All jobs use the official `actions/setup-node@v4` cache:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node }}
    cache: npm
```

## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Design Decisions

- `npm ci` is used instead of `npm install` for deterministic installs
- `fail-fast: false` ensures all matrix combinations report results independently
- `timeout-minutes` prevents runaway jobs (15 min for tests, 20 min for heavier jobs)
- Cross-platform shell syntax (no bash-specific operators in shared steps)
