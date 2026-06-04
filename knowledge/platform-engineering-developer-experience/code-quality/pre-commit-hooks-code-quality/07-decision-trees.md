# 07-Decision Trees: Pre-commit Hooks Code Quality

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pre-commit-hooks-code-quality |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Hook Selection | Which quality tools to run as pre-commit hooks | What level of validation should run before every commit? |
| D02 | Performance Strategy | How to make hooks fast enough for daily use | Full scan vs staged-only — how to balance speed and coverage? |
| D03 | Bypass Strategy | How and when to allow bypassing hooks | What mechanism allows urgent or WIP commits to skip hooks? |
| D04 | Team Setup | How to ensure all developers have hooks configured | How do we on-board new devs and maintain hook consistency? |

## Architecture-Level Decision Trees

### D01: Hook Selection

```
START: Which quality tools should run as pre-commit hooks?
│
├── Fast hooks (always)
│   ├── Pint --test --dirty (code style on staged files)
│   │   └── Time: <1s — always worth running
│   └── Must run before slow hooks (fail fast principle)
│
├── Medium hooks (recommended)
│   ├── PHPStan on staged files (static analysis)
│   │   └── Time: 5-30s for typical staged changes
│   └── Only run on changed files, not full codebase
│
├── Slow hooks (optional, for thorough teams)
│   ├── Rector --dry-run on staged files
│   │   └── Time: 10-60s
│   ├── PHPUnit tests for changed files
│   └── Consider: move to CI if pre-commit becomes too slow
│
└── Hook ordering
    1. Pint (fastest, catches style early)
    2. PHPStan (medium, catches types)
    3. Rector (slowest, catches upgrade issues)
    Order: fast hooks first so developer gets feedback immediately
```

### D02: Performance Strategy

```
START: How do we keep pre-commit hooks fast?
│
├── Staged files only (recommended)
│   ├── Run tools on git diff --cached files
│   ├── Pint --dirty flag targets staged changes automatically
│   ├── PHPStan: limit paths to staged directories
│   ├── Speed: 90%+ faster than full scan
│   └── Sufficient for catching new issues
│
├── Partial full scan (compromise)
│   ├── Run full scan on small projects (<100 files)
│   ├── Acceptable time: <30s total hooks
│   └── Risk: hooks become slow as project grows
│
├── Full scan in CI only
│   ├── Pre-commit: nothing (or Pint only)
│   ├── CI: full analysis
│   └── Trade-off: faster commits, delayed feedback
│
└── Performance comparison
    ├── Full scan Pint: 3-8s → Staged: <1s
    ├── Full scan PHPStan: 2-5min → Staged: 5-30s
    └── Rule: if hook takes >30s, consider moving to CI
```

### D03: Bypass Strategy

```
START: How should developers bypass hooks for urgent/WIP commits?
│
├── SKIP environment variable (recommended)
    ├── Usage: SKIP=pint-format,phpstan git commit -m "WIP"
    ├── Skips specific hooks by ID
    ├── Multiple: SKIP=hook1,hook2 git commit
    └── Document in commit message why hooks were skipped
│
├── --no-verify flag
│   ├── Usage: git commit --no-verify -m "urgent fix"
│   ├── Skips ALL hooks
│   └── Risk: used too frequently, always bypassing
│
└── Team norms for bypassing
    ├── Emergency hotfixes → --no-verify OK
    ├── WIP commits → SKIP individual hooks OK
    ├── Daily pattern → hooks too slow → reconsider hook selection
    └── Track bypass frequency in team health metrics
```

### D04: Team Setup

```
START: How do we ensure all developers have hooks configured?
│
├── Manual setup (fragile)
│   ├── Each dev runs: pre-commit install
│   ├── Risk: new devs forget → inconsistent enforcement
│   └── Document in onboarding checklist
│
├── Automated setup (recommended)
│   ├── Add to composer scripts: "post-install-cmd": "pre-commit install"
│   ├── Add to Makefile: make setup → installs deps + hooks
│   ├── Add to onboarding script: pip install pre-commit && pre-commit install
│   └── Hook installation becomes automatic on composer install
│
├── CI-enforced (safety net)
│   ├── Even if hooks are bypassed locally, CI catches issues
│   ├── Pre-commit reduces feedback time; CI is authoritative gate
│   └── Don't rely on pre-commit as sole enforcement
│
└── Configuration file (.pre-commit-config.yaml)
    ├── Commit to VCS (team-wide consistency)
    ├── Pin hook revisions to prevent unexpected changes
    └── Run pre-commit autoupdate periodically to stay current
```
