# 04-Standardized Knowledge: Static Analysis CI Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | static-analysis-ci-integration |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-phpstan, phpstan-config-for-laravel, phpstan-baseline-patterns, pint-ci-integration |
| **Framework/Language** | PHPStan, Rector, GitHub Actions, PHP |

## Overview

Static analysis in CI enforces code quality gates on every push. Multi-stage pipeline: Pint (style, 10s) → PHPStan (analysis, 2-5min) → Rector (optional upgrade/quality check, 2-5min). Pipeline parallelism runs static analysis alongside tests. Matrix builds test multiple PHP versions. Artifact sharing caches results between stages. Gates should be independent to identify failures at the correct stage. Analysis warnings as PR annotations provide developer visibility.

## Architecture Guidelines

- **Separate stages**: style → static analysis → quality — each stage independent
- **Parallel execution**: static analysis runs alongside test suite
- **PHP matrix**: `strategy.matrix.php: [8.2, 8.3]` for multi-version compatibility
- **Cache strategy**: restore `.php-cs-fixer.cache`, `tmpDir` from previous run
- **PR annotations**: `--format=github` for PHPStan, `--format=github` for Pint
- **Baseline enforcement**: fail CI if new errors exceed baseline

## CI Pipeline Design

```
Composer Install (2min)
├── Pint --test (10s)
├── PHPStan (2-5min)
├── Rector --dry-run (2-5min)
└── PHPUnit (1-3min)
```

Stage independence: if Pint fails, PHPStan still runs (separate jobs or continue-on-error). This provides full feedback in one CI run instead of fix→push→wait cycles.

## Key Configurations

- **PHPStan CI config**: `phpstan.ci.neon` with stricter settings (level 9 on critical paths)
- **Memory limit**: explicit `--memory-limit=1G` prevents OOM
- **Timeout**: `--no-progress` and `--xdebug` disabled for CI reliability
- **Parallel processing**: `phpstan analyse -j 4` for multi-core CI runners
- **Baseline freshness**: regenerate baseline on main branch monthly via cron job

## Performance Optimization

- Cache restoration: 30s → 5s for successive runs at same SHA
- Incremental analysis: PHPStan's `--watch` not suitable; instead use cache
- Parallel jobs: static analysis + tests = 7min total wall time vs 12min sequential
- Matrix: 2 PHP versions × 2 dependency sets (lowest/latest) = 4 parallel jobs

## CI Failures and Resolution

| Failure | Common Cause | Resolution |
|---------|-------------|------------|
| Pint --test exits 1 | Unformatted code | Run pint, commit formatted code |
| PHPStan level failure | New type error | Fix type, or update baseline if pre-existing |
| PHPStan OOM | Memory limit too low | Increase --memory-limit or reduce scan paths |
| Baseline freshness | Stale baseline entries | Regenerate baseline |
| Rector --dry-run | Outdated code patterns | Apply Rector changes in separate PR |

## Examples

```yaml
# GitHub Actions workflow
jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3', tools: composer:v2 }
      - run: composer install
      - run: vendor/bin/pint --test --format=github
      - run: vendor/bin/phpstan analyse --memory-limit=1G --error-format=github
```

## Related Topics

- pint-ci-integration — Pint-specific CI integration
- phpstan-baseline-patterns — baseline management in CI
- pre-commit-hooks-code-quality — local pre-commit hooks

## Verification

- [ ] CI pipeline has separate static analysis stage(s)
- [ ] Pint, PHPStan, and Rector run in CI
- [ ] Cache configured for analysis tooling
- [ ] PR annotations enabled for inline feedback
- [ ] Baseline enforced (no new errors)
- [ ] PHP matrix configured for project PHP versions
- [ ] Pipeline completes within 10 minutes
