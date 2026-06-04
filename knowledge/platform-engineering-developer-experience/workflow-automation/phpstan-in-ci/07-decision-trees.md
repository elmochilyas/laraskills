# 07-Decision Trees: PHPStan in CI

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | phpstan-in-ci |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Adoption Strategy | Baseline-first vs zero-baseline | How do we introduce PHPStan to an existing codebase with errors? |
| D02 | Level Selection | Which PHPStan level to enforce in CI | What strictness balances safety with practicality? |
| D03 | CI Integration | How to configure PHPStan in the CI pipeline | What settings and output format give the best CI experience? |
| D04 | Baseline Management | How to manage the baseline over time | How do we prevent baseline growth and encourage error reduction? |

## Architecture-Level Decision Trees

### D01: Adoption Strategy

```
START: How should we introduce PHPStan to our project?
│
├── New project (greenfield)
│   ├── Set level 6 from day one
│   ├── Enforce: zero errors, no baseline
│   ├── Run: phpstan analyse on every PR
│   ├── Fail CI on any new error
│   └── Best for: new projects, strict type safety from start
│
├── Existing codebase with errors
│   ├── Step 1: Generate baseline at TARGET level
│   │   ├── phpstan analyse --level=6 --generate-baseline
│   │   ├── Captures all existing errors in phpstan-baseline.neon
│   │   └── Commit baseline to VCS
│   ├── Step 2: Enable CI check with baseline
│   │   ├── Command: phpstan analyse (uses baseline)
│   │   ├── Fails: only on NEW errors (beyond baseline)
│   │   └── Result: no new type debt introduced
│   └── Step 3: Reduce baseline over time
│       ├── Fix errors, regenerate baseline
│       ├── Track baseline size reduction
│       └── Goal: zero baseline eventually
│
└── Wrong approach for legacy
    ├── Don't: require zero errors before enabling CI
    ├── Result: team disables PHPStan entirely
    └── Correct: baseline-first, incremental improvement
```

### D02: Level Selection

```
START: Which PHPStan level should we enforce in CI?
│
├── Level 5 (starting point for new teams)
│   ├── Catches: unknown types, wrong return types, dead code
│   ├── Practical: doesn't require PHPDoc on every parameter
│   └── Best for: teams new to static analysis, legacy codebases
│
├── Level 6 (recommended minimum)
│   ├── Catches: mixed type issues, generic type enforcement
│   ├── Balance: strict enough to catch real issues
│   ├── Practical: requires @param and @return on most methods
│   └── Best for: most Laravel projects — recommended minimum
│
├── Level 7-9 (strict)
│   ├── Catches: PHPDoc completeness, strict comparisons
│   ├── Strict: requires complete type annotations
│   ├── High overhead: more annotations, slower adoption
│   └── Best for: critical modules, high-compliance projects
│
└── Level progression strategy
    ├── Start at 5 → stabilize → increase to 6 → stabilize → 7+
    ├── Each level jump: generate baseline at new level
    ├── Fix errors incrementally over multiple sprints
    └── Timeline: 6-12 months to reach level 6 for most teams
```

### D03: CI Integration

```
START: How should PHPStan run in CI?
│
├── Command configuration
│   ├── Basic: vendor/bin/phpstan analyse --memory-limit=2G
│   ├── With cache: include .phpstan.result.cache caching
│   ├── With GitHub annotations: --error-format=github
│   └── Parallel: --parallel for large codebases (PHPStan 2.0+)
│
├── Job positioning
    ├── Run: as separate CI job (parallel to tests)
    ├── Order: fast check, runs in ~2min (cached)
    ├── Gate: required status check for merging
    └── After: Pint (style) but can run in parallel
│
├── Caching
    ├── Cache: .phpstan.result.cache between CI runs
    ├── Key: hash of modified PHP files + phpstan.neon
    ├── Effect: 2-5min full analysis → 2-10s incremental
    └── Essential for: CI speed — makes PHPStan practical
│
└── Reporting
    ├── GitHub Annotations: inline errors on PR diff
    ├── CLI output: in CI logs for debugging
    ├── Baseline: reduce noise by suppressing known errors
    └── Coverage: upload baseline size trend to dashboard
```

### D04: Baseline Management

```
START: How do we manage the PHPStan baseline over time?
│
├── Baseline as debt tracking
│   ├── Baseline size = type debt amount
│   ├── Track: wc -l phpstan-baseline.neon over time
│   ├── Goal: decrease 10-15% per quarter
│   └── Alert: if baseline grows (new errors added faster than fixes)
│
├── Baseline regeneration
    ├── Regular: monthly or quarterly
    ├── Trigger: after dedicated cleanup sprint
    ├── Command: phpstan analyse --generate-baseline
    ├── Commit: regenerated baseline as separate PR
    └── Review: diff shows which errors were fixed (deleted from baseline)
│
├── Don't regenerate to hide errors
    ├── Never: regenerate baseline to pass CI on new errors
    ├── Always: fix new errors, don't hide them
    ├── Police: CI should alert if baseline grows unexpectedly
    └── Culture: "baseline is temporary debt, not permanent exemption"
│
└── Baseline lifecycle
    ├── Month 1: 5000 errors in baseline
    ├── Month 3: 4000 errors (1000 fixed)
    ├── Month 6: 2000 errors
    ├── Month 12: 0 errors — milestone! Increase level
    └── Repeat: generate baseline at new level for continued improvement
```
