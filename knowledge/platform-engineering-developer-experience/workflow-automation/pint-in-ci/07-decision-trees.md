# 07-Decision Trees: Pint in CI

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | pint-in-ci |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Check Mode | --test (gate) vs auto-fix (commit) | Should CI fail on style issues or fix them automatically? |
| D02 | Job Positioning | Where Pint runs in the CI pipeline | Should Pint run first, in parallel, or after other checks? |
| D03 | Configuration Consistency | Ensuring local and CI use the same style rules | How do we prevent style conflicts between developer machines and CI? |
| D04 | Version Pinning | Whether to pin Pint version | How do we prevent unexpected rule changes from breaking CI? |

## Architecture-Level Decision Trees

### D01: Check Mode

```
START: Should CI gate on style or auto-fix?
│
├── Gate mode (--test) — recommended
│   ├── Command: ./vendor/bin/pint --test
│   ├── Exit: 1 if style violations → fails CI
│   ├── Author: must run pint locally and re-push
│   ├── Pro: strict enforcement, clean git history
│   ├── Pro: developer learns to format before committing
│   └── Best for: internal team projects, disciplined teams
│
├── Auto-fix mode (commit)
│   ├── Command: ./vendor/bin/pint (no --test)
│   ├── Then: git-auto-commit-action commits fixes to PR
│   ├── Pro: zero developer friction
│   ├── Con: "fix formatting" commits in history
│   ├── Con: double CI run (push → auto-fix commit → re-run)
│   └── Best for: open-source projects, external contributors
│
└── Hybrid
    ├── Gate on --test for internal PRs
    ├── Auto-fix for external contributions
    └── Or: stage (dev) auto-fixes, production (main) gates
```

### D02: Job Positioning

```
START: Where should Pint run in the CI pipeline?
│
├── First job (recommended)
│   ├── Pint runs first, before tests and PHPStan
│   ├── Time: 1-5 seconds — very fast
│   ├── Fail fast: if style fails, developer knows immediately
│   ├── Dependency: other jobs depend on Pint? No, parallel
│   └── Best practice: early feedback on style issues
│
├── Parallel job (independent)
│   ├── Pint runs in parallel with tests and PHPStan
│   ├── All results visible in one run
│   ├── Pro: same wall time regardless of Pint position
│   └── Best for: optimized CI pipelines
│
├── Gating strategy
│   ├── Option A: Pint → tests → deploy (sequential gating)
│   ├── Option B: Pint || tests || PHPStan (parallel, all required)
│   └── Deployment: depends on all passing
│
└── Regardless of position: always run Pint before merge
    ├── Required status check for branch protection
    └── Style violations block merge
```

### D03: Configuration Consistency

```
START: How do we ensure consistent Pint configuration?
│
├── Commit pint.json to VCS (essential)
│   ├── Single source of truth for style rules
│   ├── CI reads pint.json from repo
│   ├── Developers read same pint.json
│   └── Without it: CI and local may behave differently
│
├── Document IDE setup (optional but helpful)
│   ├── Configure IDE to match Pint rules
│   ├── Or: rely on Pint exclusively (run before commit)
│   └── Common issues: tabs vs spaces, brace style, import ordering
│
├── Run Pint locally
│   ├── Suggested: pre-commit hook or manual run
│   ├── CI will catch what's missed
│   └── Goal: CI never fails on style (run locally first)
│
└── Enforcement
    ├── CI uses the same pint.json as local
    ├── If local and CI disagree: debug pint.json or Pint version
    └── Rule: "Pint decides, humans don't debate style in PRs"
```

### D04: Version Pinning

```
START: Should we pin the Pint version?
│
├── Pin to minor version (recommended)
│   ├── composer.json: "laravel/pint": "1.29.*"
│   ├── Effect: patch updates only (bug fixes, performance)
│   ├── No: unexpected rule changes from minor bumps
│   ├── Update: manually review minor version changes
│   └── Best for: most projects — balance of stability and updates
│
├── Pin to exact version (strict)
│   ├── composer.json: "laravel/pint": "1.29.0"
│   ├── Effect: zero unexpected changes
│   ├── Update: requires deliberate version bump
│   └── Best for: high-compliance, locked environments
│
├── No pinning (open range)
│   ├── composer.json: "laravel/pint": "^1.0"
│   ├── Risk: minor version updates may change rules
│   ├── Risk: CI breaks unexpectedly after composer update
│   └── Not recommended
│
└── Commit composer.lock
    ├── Locks exact Pint version across environments
    ├── CI and local use same Pint version
    └── Update: composer update laravel/pint deliberately
```
