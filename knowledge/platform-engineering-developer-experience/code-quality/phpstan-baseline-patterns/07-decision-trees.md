# 07-Decision Trees: PHPStan Baseline Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | phpstan-baseline-patterns |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Baseline Necessity | Whether to use a baseline at all | Can we fix all errors now, or do we need incremental adoption? |
| D02 | Baseline Generation Level | What strictness level to generate baseline at | Do we capture all debt at target level or at current level? |
| D03 | Baseline Refresh Cycle | How often and when to regenerate baseline | How do we keep baseline accurate and avoid staleness? |
| D04 | CI Baseline Enforcement | How to enforce baseline in CI pipeline | Do we fail CI on new errors, track size, or both? |

## Architecture-Level Decision Trees

### D01: Baseline Necessity

```
START: Should we use a PHPStan baseline?
│
├── New project (greenfield)
│   ├── Enforce strict level from day one
│   ├── Fix all errors before merge
│   └── No baseline needed — maintain zero-error policy
│
├── Existing project with 0 errors
│   └── No baseline needed — already at target level
│
└── Existing project with errors (most common case)
    ├── Can we fix all errors immediately?
    │   ├── Yes → Fix now, no baseline, commit zero-error state
    │   └── No → Generate baseline
    │       ├── Run at TARGET level (e.g., level 6), not current level
    │       ├── This captures full debt scope
    │       ├── Commit phpstan-baseline.neon to VCS
    │       └── Set reduction targets from day one
    │
    Key considerations:
    - Baseline is temporary debt tracking, not permanent exemption
    - Must have active reduction plan
    - Without reduction targets, baseline becomes permanent tech debt
```

### D02: Baseline Generation Level

```
START: At what PHPStan level should we generate the baseline?
│
├── Generate at current project level (e.g., level 2)
│   ├── Pro: captures only errors at today's level
│   ├── Con: when you increase level, you get a new wave of errors
│   └── Multi-round: level 2 → baseline → fix → level 4 → baseline
│
├── Generate at target strict level (recommended)
│   ├── Pro: captures ALL debt at once — full picture
│   ├── Con: larger baseline, more daunting
│   └── Action: set target level (min 6), generate baseline at that level
│
└── Multi-stage graduation (common approach)
    1. Target: level 6 within 12 months
    2. Month 1: baseline at level 6
    3. Month 1-12: fix errors, regenerate baseline monthly
    4. When baseline hits zero → enable level 6 with no baseline
    └── Repeat for level 7, 8, 9 if desired
```

### D03: Baseline Refresh Cycle

```
START: How often should we refresh the baseline?
│
├── On-demand (every PR)
│   ├── Too frequent — regenerates stable entries unnecessarily
│   └── Only when fixing baseline errors
│
├── Monthly schedule (recommended)
│   ├── Regenerate: phpstan analyse --generate-baseline
│   ├── Removes stale entries (errors already fixed)
│   ├── Tracks progress (baseline size shrinks)
│   ├── Review regenerated diff before committing
│   └── Cron job on main branch
│
├── Quarterly deep review
│   ├── Review remaining baseline entries
│   ├── Assign ownership for largest file groups
│   ├── Celebrate if size decreased >15%
│   └── Adjust targets if not on track
│
└── Trigger-based refresh
    ├── After large refactoring efforts
    ├── After PHPStan/Larastan version upgrades
    ├── After level increases
    └── When PHPStan warns of stale entries
```

### D04: CI Baseline Enforcement

```
START: How should CI enforce the baseline?
│
├── Fail on new errors (minimum)
│   ├── Run: phpstan analyse (with baseline included)
│   ├── New errors beyond baseline → exit 1
│   ├── Requires monthly regeneration to avoid staleness
│   └── Catches regression immediately
│
├── Fail + size tracking (recommended)
│   ├── Same as above + track baseline line count
│   ├── Alert if baseline size increases (new files added with errors)
│   ├── Dashboard or CI annotation with size trend
│   └── Block merge if baseline exceeds threshold
│
├── Graduated enforcement (advanced)
│   ├── Level 6 with baseline for app/
│   ├── Level 9 with baseline for critical modules
│   ├── Separate baselines per directory
│   └── Different reduction targets per module
│
└── Setup steps
    1. Include baseline: phpstan.neon → includes: [phpstan-baseline.neon]
    2. Run: phpstan analyse --memory-limit=1G in CI
    3. Monthly: automated baseline regeneration on main branch
    4. Fail CI if regeneration produces different baseline
```
