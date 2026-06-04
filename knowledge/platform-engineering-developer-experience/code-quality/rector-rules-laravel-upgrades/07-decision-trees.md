# 07-Decision Trees: Rector Rules Laravel Upgrades

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | rector-rules-laravel-upgrades |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Upgrade Strategy | Incremental vs one-shot version upgrades | Do we apply upgrade rules one version at a time or all at once? |
| D02 | Rule Set Application | Which upgrade rule sets to apply and when | What Laravel version are we upgrading to and from? |
| D03 | PR and Review Workflow | How to structure upgrade changes for review | How do we make automated upgrade changes reviewable? |
| D04 | Post-Upgrade Cleanup | What to do after Rector upgrade changes are applied | How do we finalize and clean up after the upgrade? |

## Architecture-Level Decision Trees

### D01: Upgrade Strategy

```
START: How should we apply Laravel version upgrades?
│
├── Incremental (recommended)
│   ├── Apply one version jump at a time
│   ├── Example: L10 → L11 → L12 (not L10 → L12)
│   ├── Each jump: separate feature branch, review, merge
│   ├── Pro: smaller diffs, easier to debug issues
│   ├── Pro: intermediate versions can be deployed separately
│   └── Best for: all projects
│
├── One-shot (skip intermediate versions)
│   ├── Apply L10 → L12 in single pass
│   ├── Risk: missing intermediate changes compound
│   ├── Risk: debugging which version caused a bug is harder
│   ├── Only consider: if tests have full coverage
│   └── Generally NOT recommended
│
└── Preparation before upgrade
    ├── Ensure full test coverage of upgraded areas
    ├── Run current Rector upgrade sets as dry-run to preview
    ├── Remove deprecated usages proactively where possible
    └── Review Laravel upgrade guide for manual steps Rector can't automate
```

### D02: Rule Set Application

```
START: Which upgrade rule sets should we apply?
│
├── Version-specific sets
│   ├── Are we upgrading Laravel?
│   │   ├── Yes → Use LaravelSetList for target version
│   │   │   ├── LARAVEL_100 (Laravel 10 upgrade)
│   │   │   ├── LARAVEL_110 (Laravel 11 upgrade)
│   │   │   └── LARAVEL_120 (Laravel 12 upgrade)
│   │   └── Apply one version set at a time
│   └── No → Skip Laravel upgrade sets
│
├── Complementary sets
│   ├── Apply alongside upgrade:
    │   ├── SetList::PHP_82, SetList::PHP_83 (PHP modernization)
    │   └── SetList::CODE_QUALITY (general improvements)
│   └── Apply AFTER upgrade changes (separate pass)
│
├── Scope: apply to app/ only first
│   ├── Exclude vendor/, storage/, tests/ on first pass
│   ├── After app/ is clean, consider tests/ if needed
│   └── Never run upgrade rules on vendor/
│
└── Configuration per upgrade
    ├── Create temporary rector-laravel-upgrade.php
    ├── Only includes upgrade-specific rules
    ├── Remove after upgrade is complete
    └── Don't mix upgrade rules with ongoing code quality rules
```

### D03: PR and Review Workflow

```
START: How should we structure upgrade changes for review?
│
├── Per-version branches
│   ├── Branch: upgrade/laravel-11 (one version jump)
│   ├── Commit 1: Rector dry-run output (preview)
│   ├── Commit 2: Rector apply changes
│   ├── Commit 3 +: Manual adjustments from review
│   └── PR description: link Laravel upgrade guide
│
├── Review process
│   ├── Always --dry-run first → review diff → apply
│   ├── Review every Rector change (5-10% need manual adjustment)
│   ├── Run full test suite after application
│   ├── Run PHPStan to verify type correctness
│   ├── Manual review: check edge cases Rector might have missed
│   └── Two reviewers minimum for upgrade PRs
│
└── Large codebase strategy
    ├── Apply upgrade rules by directory (app/ first)
    ├── Each directory = separate commit or PR
    └── Review in logical groupings, not by file order
```

### D04: Post-Upgrade Cleanup

```
START: What cleanup is needed after Rector upgrade changes?
│
├── Immediate cleanup
│   ├── Remove temporary rector-laravel-upgrade.php config
│   ├── Remove upgrade-specific rules from main rector.php
│   ├── Run Pint (code style may have shifted)
│   ├── Run PHPStan (verify no new type issues)
│   ├── Run full test suite (behavior verification)
│   └── Deploy to staging for integration testing
│
├── Medium-term verification
│   ├── Monitor error logs for upgrade-related issues
│   ├── Watch for deprecation warnings from new version
│   ├── Review Laravel changelog for manual steps Rector missed
│   └── Update CI matrix if PHP version requirements changed
│
└── Long-term maintenance
    ├── Update composer.json with new Laravel version constraint
    ├── Update documentation, CONTRIBUTING.md
    ├── Update Docker/local environment if PHP version changed
    └── Schedule next upgrade awareness for future versions
```
