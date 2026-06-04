# 07-Decision Trees: Git Hooks (CaptainHook)

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | git-hooks-captainhook |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Hook Selection | Which Git hooks to implement | What quality checks should run at each stage of the Git lifecycle? |
| D02 | Execution Speed | Pre-commit vs pre-push hook boundaries | How do we balance hook coverage with developer experience speed? |
| D03 | Auto-Installation | How to ensure hooks are installed for all devs | How do hooks get installed without manual developer setup? |
| D04 | Bypass Policy | When to allow --no-verify usage | How do we handle WIP commits and emergencies without losing hook benefits? |

## Architecture-Level Decision Trees

### D01: Hook Selection

```
START: Which Git hooks should we implement?
│
├── Pre-commit (fast checks, <30s)
│   ├── Pint --test --dirty on staged files
│   │   ├── Check: code style on changed files only
│   │   └── Time: 1-3 seconds
│   ├── PHPStan on staged files
│   │   ├── Check: type safety on changed files
│   │   └── Time: 5-15 seconds (with result cache)
│   └── CaptainHook: only run tools guaranteed by composer install
│
├── Commit-msg (enforce message format)
│   ├── Validate: Conventional Commits format
│   │   └── Pattern: type(scope): description (#issue)
│   ├── Block: commit if message doesn't match pattern
│   └── Reason: commit messages drive changelog automation
│
├── Pre-push (full checks, slower)
│   ├── Full test suite (PHPUnit/Pest)
│   │   └── Time: 1-10 minutes
│   ├── Full PHPStan analysis
│   │   └── Time: 30s-2min (with cache)
│   └── Run: only if CI is slow; otherwise rely on CI
│
└── Hook ordering by speed
    1. Pre-commit: fast checks first (Pint → PHPStan)
    2. Commit-msg: fast, runs after message typed
    3. Pre-push: slow checks (catching issues before CI)
```

### D02: Execution Speed

```
START: How fast should each hook be?
│
├── Pre-commit hooks (target: <30s total)
│   ├── MUST be fast — developer is waiting
│   ├── Use: staged-files-only execution (git dirty)
│   ├── Pint on staged: 1-3s
│   ├── PHPStan on staged: 5-15s
│   ├── If combined: target 20s max
│   ├── If exceeds 30s: move slowest check to pre-push
│   └── Risk: slow hooks = developers abuse --no-verify
│
├── Pre-push hooks (target: <5min)
│   ├── Developer not actively waiting (context switch allowed)
│   ├── Full test suite: 1-5min (faster with parallel)
│   ├── Full PHPStan: 30s-2min
│   └── Risk: if too slow, dev pushes without waiting
│
├── Performance techniques
│   ├── Staged-files-only: CaptainHook's git-dirty action
│   ├── Result caching: PHPStan cache for faster re-runs
│   ├── Parallel: run Pint and PHPStan in parallel within hook
│   └── Skip in CI: hooks don't run in CI; CI has its own checks
│
└── If hooks are consistently bypassed
    ├── Likely cause: hooks are too slow
    ├── Measure: actual hook execution time
    ├── Reduce: move slow checks to CI-only
    └── Goal: 95%+ of commits pass through hooks
```

### D03: Auto-Installation

```
START: How do we ensure hooks are installed for all devs?
│
├── Composer scripts (recommended)
│   ├── In composer.json:
│   │   "scripts": {
│   │       "post-install-cmd": [
│   │           "vendor/bin/captainhook install --force"
│   │       ],
│   │       "post-update-cmd": [
│   │           "vendor/bin/captainhook install --force"
│   │       ]
│   │   }
│   ├── Effect: hooks installed on every composer install
│   ├── Pro: automatic, no manual step
│   └── Exclude: from CI composer install (CI has own checks)
│
├── Manual installation (avoid)
│   ├── New dev needs to: vendor/bin/captainhook install
│   ├── Risk: frequently forgotten
│   └── Only if: composer scripts can't be modified
│
├── Documentation
│   ├── README: mention hooks are auto-installed
│   ├── README: mention --no-verify for emergencies
│   └── README: how to update hooks (composer update)
│
└── CI exclusion
    ├── Don't install CaptainHook in CI
    ├── CI runs its own validation steps
    └── Composer script: detect CI env, skip installation
```

### D04: Bypass Policy

```
START: When is it acceptable to bypass hooks?
│
├── Documented acceptable uses
│   ├── Emergency hotfix (production issue): --no-verify accepted
│   ├── WIP commit (saving progress): --no-verify accepted
│   ├── Post-deadline: --no-verify accepted with note in commit
│   └── After bypass: run checks manually or next commit catches them
│
├── Not acceptable
│   ├── Habitual bypassing (90%+ of commits)
│   ├── Bypassing because "hooks are annoying"
│   ├── Bypassing without acknowledging in commit message
│   └── Fix: if hooks are bypassed frequently, they're too slow or strict
│
├── Bypass tracking
│   ├── Can't technically track --no-verify usage
│   ├── But: CI catches what hooks would have caught
│   ├── High CI failure rate from style/type issues → hooks not running
│   └── Team health metric: if CI frequently catches hook-preventable issues
│
└── Policy documentation
    ├── CONTRIBUTING.md: document --no-verify policy
    ├── Include: acceptable use cases, expectation to re-enable
    └── Remind: hooks protect you, not restrict you
```
