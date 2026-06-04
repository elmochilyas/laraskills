# 07-Decision Trees: Laravel Rector

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | laravel-rector |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Apply vs Dry-Run | Whether to apply Rector changes or only preview | Are we ready to modify files or only checking compliance? |
| D02 | Incremental Adoption | How to apply Rector across a codebase | Do we apply all rules at once or incrementally? |
| D03 | Rule Set Selection | Which Rector rule sets to include | What upgrades or modernizations do we need? |
| D04 | Post-Rector Verification | How to validate Rector changes | What checks are needed after automated refactoring? |

## Architecture-Level Decision Trees

### D01: Apply vs Dry-Run

```
START: Should Rector apply changes or only preview?
│
├── Dry-run mode (--dry-run)
│   ├── Use for: CI compliance checks, previewing changes
│   ├── Command: vendor/bin/rector process --dry-run
│   ├── Exit 1 if changes needed → CI gate
│   ├── Safe for any environment
│   └── Recommended for CI (non-modifying)
│
├── Apply mode (write changes)
│   ├── Use for: intentional refactoring sessions
│   ├── Command: vendor/bin/rector process
│   ├── Always run --dry-run first, review diffs, THEN apply
│   ├── Apply in a feature branch, never on main
│   └── Recommended workflow:
│       1. Create branch
│       2. Dry-run, review, adjust config
│       3. Apply changes
│       4. Run test suite
│       5. Commit in logical increments
│
└── Decision factor: do you have test coverage?
    ├── Full coverage → safer to apply
    └── Minimal coverage → extra caution, manual review per change
```

### D02: Incremental Adoption

```
START: How should we apply Rector across the codebase?
│
├── One-shot (all rules, all directories)
│   ├── Risk: massive unreviewable diff, subtle bugs
│   ├── Only safe with: full test coverage, small codebase (<50 files)
│   └── Generally NOT recommended
│
├── By rule set (recommended)
│   ├── Apply one rule set at a time
│   ├── Example first pass: CODE_QUALITY rules only
│   ├── Example second pass: PHP_82 rules only
│   ├── Review diffs between each application
│   └── Each rule set = 1 separate commit
│
├── By directory
│   ├── Apply Rector to app/ first
│   ├── Then config/, then database/
│   └── Exclude vendor/ at all times
│
└── Best practice combination
    1. Dry-run on full codebase to see scope
    2. Apply one rule set to app/ only
    3. Review, test, commit
    4. Repeat for next rule set
    5. Continue for other directories
```

### D03: Rule Set Selection

```
START: Which Rector rule sets should we include?
│
├── Version upgrade sets
│   ├── Are we doing a Laravel version upgrade?
│   │   ├── Yes → Include LaravelSetList for target version
│   │   │   ├── LARAVEL_110 (Laravel 11→12 upgrade)
│   │   │   └── Apply one version jump at a time
│   │   └── No → Skip version upgrade sets
│   └── Remove upgrade sets after upgrade is complete
│
├── PHP version sets
│   ├── Target PHP version? (e.g., 8.2, 8.3)
│   ├── Include SetList::PHP_82 or PHP_83
│   └── Enables: readonly properties, typed properties, match expressions
│
├── Code quality sets
│   ├── SetList::CODE_QUALITY — general improvements
│   ├── SetList::DEAD_CODE — remove dead code
│   └── SetList::EARLY_RETURN — simplify control flow
│
└── Narrow scope: apply narrow rule sets first, expand over time
    ├── Month 1: CODE_QUALITY
    ├── Month 2: PHP_82 + CODE_QUALITY
    └── Month 3: Add Laravel upgrade sets as needed
```

### D04: Post-Rector Verification

```
START: How do we verify Rector didn't break anything?
│
├── Required checks (always)
│   ├── Run full test suite: vendor/bin/phpunit
│   ├── Run PHPStan: verify type correctness preserved
│   ├── Run Pint: ensure formatted after structural changes
│   └── Review diff: manually inspect 10-20% of changes
│
├── If tests fail
│   ├── Identify which Rector rule caused the failure
│   ├── Is the rule safe to apply in different order?
│   ├── Option A: Fix the test to match new pattern
│   ├── Option B: Exclude failing file from that rule
│   └── Option C: Revert and skip the problematic rule
│
├── CI integration
│   ├── Add --dry-run as CI gate (catches drift)
│   ├── Scheduled monthly: full apply PR
│   └── PR must pass all checks before merge
│
└── Long-term considerations
    ├── Lock Rector version in composer.json
    ├── Document which rule sets are applied
    ├── Track refactoring debt in team backlog
    └── Review rule set effectiveness quarterly
```
