# 07-Decision Trees: Laravel Pint

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | laravel-pint |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Enforcement Mode | Whether to gate on style or auto-fix in CI | Do we fail the build or auto-fix formatting issues? |
| D02 | Configuration Depth | How much to customize beyond preset defaults | Do we need custom rules or is the preset sufficient? |
| D03 | Pre-commit vs CI | Where to enforce formatting | Should formatting run locally before commit or in CI? |
| D04 | Full Format vs Dirty | Whether to format entire codebase or only changed files | Are we doing initial adoption or ongoing maintenance? |

## Architecture-Level Decision Trees

### D01: Enforcement Mode

```
START: How should Pint be enforced in CI?
│
├── Gate mode (strict enforcement)
│   ├── Run: pint --test in CI step
│   ├── Exit 1 on style issues → blocks PR merge
│   ├── Best for teams with strong style discipline
│   ├── Requires devs to run pint locally before pushing
│   └── Recommended for production codebases
│
├── Auto-fix mode (flexible enforcement)
│   ├── Run: pint (fix) then pint --test (verify)
│   ├── CI commits formatting fix back to PR branch
│   ├── Best for teams still building style habits
│   ├── Requires CI Git config for commit authorship
│   └── Warning: auto-fix commit triggers re-run (doubles CI time)
│
└── Hybrid (recommended)
    ├── PR pipeline: pint --test as gate
    ├── Scheduled: weekly auto-fix PR for accumulated issues
    └── Local: --dirty for pre-commit speed
```

### D02: Configuration Depth

```
START: How much should we customize beyond preset defaults?
│
├── Zero configuration
│   ├── Use laravel preset (default, no pint.json needed)
│   ├── Best for standard Laravel projects
│   └── No team debate about formatting rules
│
├── Minimal overrides (3-5 rules)
│   ├── Create pint.json with preset + few custom rules
│   ├── Focus on non-negotiable conventions:
│   │   └── single_quote, no_unused_imports, ordered_imports
│   ├── Document each override rationale
│   └── Recommended approach for most teams
│
├── Moderate customization (6-15 rules)
│   ├── For teams with strong style preferences
│   ├── Risk: debate over each rule slows decision-making
│   └── Mitigation: vote, document, move on
│
└── Heavy customization (15+ rules)
    ├── Anti-pattern — defeats Pint's simplicity
    ├── Consider: are we solving real problems or bike-shedding?
    └── Alternative: accept preset defaults for most rules
```

### D03: Pre-commit vs CI

```
START: Where should formatting enforcement happen?
│
├── CI-only enforcement
│   ├── Pro: zero dev setup, always consistent
│   ├── Con: feedback delay (push then wait)
│   ├── Best for: solo projects, small teams
│   └── Must: always use --test in CI
│
├── Pre-commit hooks (recommended for teams)
│   ├── Pro: instant feedback before commit
│   ├── Con: adds ~1s to commit time (staged only)
│   ├── Hook: pint --test --dirty on staged files
│   ├── Allow --no-verify for emergency commits
│   └── Best for: teams of 2+ developers
│
└── Both (maximum enforcement)
    ├── Pre-commit for immediate feedback
    ├── CI as safety net (catches missed hooks)
    └── CI and local must use same pint.json + version
```

### D04: Full Format vs Dirty

```
START: What scope should Pint operate on?
│
├── Full codebase format
│   ├── When: initial adoption, preset change, Pint upgrade
│   ├── Run: pint on entire project
│   ├── Commit: one isolated "Apply Pint formatting" commit
│   └── Use git-blame ignore revs file to skip in blame
│
├── Dirty files only (--dirty)
│   ├── When: daily development workflow
│   ├── Run: pint --dirty
│   ├── Scope: only Git-tracked uncommitted changes
│   ├── Speed: <1s for typical feature branch
│   └── Use: local pre-commit hooks, local formatting
│
└── Targeted files
    ├── When: specific file or directory cleanup
    ├── Run: pint app/Models or pint --filter=UserController.php
    └── Use: gradual adoption on legacy code
```
