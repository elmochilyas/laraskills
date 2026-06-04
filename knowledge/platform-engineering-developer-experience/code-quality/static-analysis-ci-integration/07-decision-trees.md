# 07-Decision Trees: Static Analysis CI Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | static-analysis-ci-integration |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Pipeline Stage Design | How to structure quality stages in CI | What order and independence should quality gates have? |
| D02 | Parallelism Strategy | Whether to run quality tools sequentially or in parallel | How to minimize total CI wall time while maintaining feedback? |
| D03 | Failure Handling | How to handle individual quality stage failures | Should we stop on first failure or report all results? |
| D04 | Cache Configuration | What tooling caches to configure in CI | How to speed up repeated CI runs for static analysis tools? |

## Architecture-Level Decision Trees

### D01: Pipeline Stage Design

```
START: How should we structure static analysis stages in CI?
│
├── Sequential stages (simple)
│   ├── Pint → PHPStan → Rector → Test
│   ├── Pro: clear ordering, fail fast
│   ├── Con: if Pint fails, you don't see PHPStan results
│   └── Best for: small projects, fast pipelines
│
├── Parallel stages (recommended)
│   ├── Stage 1: Pint (independent)
│   ├── Stage 2: PHPStan (independent, runs alongside tests)
│   ├── Stage 3: Rector --dry-run (independent)
│   └── Test suite runs in parallel with all analysis
│   ├── Pro: see all results in one CI run
│   └── Con: slightly more CI configuration
│
├── Independent jobs (best for teams)
│   ├── Job 1: Code Style (Pint)
│   ├── Job 2: Static Analysis (PHPStan)
│   ├── Job 3: Refactoring Check (Rector)
│   ├── Job 4: Tests (PHPUnit)
│   ├── Pro: independent status, full feedback
│   ├── Pro: can run matrix across PHP versions
│   └── Best for: all teams
│
└── Recommended pipeline:
    Composer Install
    ├── Pint --test (style)
    ├── PHPStan analyze (types)
    ├── Rector --dry-run (upgrade check)
    └── PHPUnit (behavior)
```

### D02: Parallelism Strategy

```
START: How should we parallelize static analysis in CI?
│
├── Tool-level parallelism
│   ├── Run Pint, PHPStan, Rector as separate jobs
│   ├── Each job runs on same checkout, independent caches
│   ├── Benefits: see all results, fail independently
│   └── Best for: all teams
│
├── PHP version matrix
│   ├── strategy.matrix.php: [8.2, 8.3] (supported versions)
│   ├── Run full pipeline per PHP version
│   ├── Catches version-specific issues before deployment
│   └── Cost: 2-4x total CI compute time
│
├── Tool-internal parallelism
│   ├── PHPStan: -j 4 (4 parallel processes)
│   ├── Rector: --parallel (multi-core processing)
│   ├── Reduces tool runtime 2-4x on multi-core CI runners
│   └── Configure based on CI runner CPU count
│
└── Wall time optimization
    ├── Sequential: Pint(10s) + PHPStan(3min) + Rector(3min) + Tests(2min) = ~8min
    ├── Parallel: max(Pint, PHPStan, Rector, Tests) = ~3min
    └── Improvement: 60%+ reduction in wall time
```

### D03: Failure Handling

```
START: How should CI handle individual stage failures?
│
├── Fail-fast (stop on first failure)
│   ├── If Pint fails → stop pipeline
│   ├── Pro: save CI compute on already-failed run
│   ├── Con: developer must fix, push, wait for next run to see other failures
│   └── Best for: time-constrained CI budgets
│
├── Continue on error (recommended)
│   ├── All stages run regardless of individual failures
│   ├── Developer sees ALL failures in one CI run
│   ├── Fix → push → all results visible
│   ├── Config: continue-on-error: true for non-blocking stages
│   └── Best for: teams wanting full feedback
│
├── Gate levels (graduated enforcement)
│   ├── Blocking gates: PHPStan (no new errors), Tests (all pass)
│   ├── Warning gates: Rector --dry-run (informs, doesn't block)
│   ├── Info gates: Pint style (recommends, blocks only in strict mode)
│   └── Configure per tool based on team maturity
│
└── Failure resolution (quick reference)
    ├── Pint failure → run pint locally, commit
    ├── PHPStan failure → fix type error or regenerate baseline
    ├── Rector failure → apply changes in separate PR
    ├── PHPStan OOM → increase --memory-limit
    └── Baseline staleness → regenerate baseline
```

### D04: Cache Configuration

```
START: What caches should we configure for static analysis tools?
│
├── PHPStan cache
│   ├── Cache: tmpDir (storage/framework/cache/phpstan)
│   ├── Restore from CI cache → saves 2-5min on repeated runs
│   ├── Cache key: PHP version + PHPStan version + config hash
│   └── Invalidate: when phpstan.neon or baseline changes
│
├── Pint cache
│   ├── Cache: .php-cs-fixer.cache
│   ├── Restore from CI cache → 50-80% faster on unchanged files
│   ├── Cache key: OS + PHP version + Pint version + pint.json hash
│   └── Invalidate: when pint.json or Pint version changes
│
├── Composer cache
│   ├── Cache: ~/.composer/cache
│   ├── Speeds up dependency install (shared across jobs)
│   └── Standard in most CI environments
│
└── Cache strategy
    ├── Restore before tool runs
    ├── Save after tool runs (or at end of job)
    ├── Separate cache keys per tool to avoid invalidation cascade
    ├── Cache size: 5-50MB per tool — well within CI cache limits
    └── Run: initial uncached run is slow; subsequent runs benefit
```
