# 07-Decision Trees: Laravel Shift

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-shift |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Shift vs Rector | Whether to use commercial Shift or open-source Rector | Do we prefer a paid automated service or self-managed open-source tool? |
| D02 | Upgrade Sequencing | How to sequence version upgrades | Do we upgrade one version at a time or multiple? |
| D03 | Review Process | How to review Shift-generated changes | How do we validate automated upgrade changes before merging? |
| D04 | Post-Upgrade Verification | What to check after Shift application | What steps ensure the upgraded application is production-ready? |

## Architecture-Level Decision Trees

### D01: Shift vs Rector

```
START: Should we use Laravel Shift or Rector for upgrades?
│
├── Laravel Shift (commercial service)
│   ├── Cost: paid per shift (freelance/project pricing)
│   ├── Coverage: 80-95% of upgrade changes automated
│   ├── Workflow: submit repo → receive PR with atomic commits
│   ├── Pro: comprehensive Laravel-specific rules
│   ├── Pro: atomic commits document each change
│   ├── Pro: battle-tested on 1M+ shifts
│   └── Best for: teams wanting maximum automation, minimal manual work
│
├── Rector with Laravel rules (open-source)
│   ├── Cost: free
│   ├── Coverage: 60-80% of upgrade changes automated
│   ├── Workflow: self-managed config → run locally or in CI
│   ├── Pro: free, customizable, no external access needed
│   ├── Pro: can be scheduled as CI task
│   ├── Con: less comprehensive than Shift
│   └── Best for: teams with Rector experience, budget-conscious
│
├── Combined approach (recommended for critical apps)
│   ├── Shift handles mechanical upgrades
│   ├── Rector handles ongoing code quality (monthly CI)
│   ├── Manual review handles remaining 5-10%
│   └── Full test suite verifies correctness
│
└── Decision factors
    ├── Budget → Shift vs Rector
    ├── Coverage needed → Shift more comprehensive
    ├── Control → Rector is fully configurable
    └── Frequency → Shift per upgrade, Rector for ongoing
```

### D02: Upgrade Sequencing

```
START: How should we sequence Laravel version upgrades?
│
├── One version at a time (strongly recommended)
│   ├── Example: 9 → 10 → 11 → 12 (not 9 → 12)
│   ├── Run Shift per version, review, test, deploy
│   ├── Pro: smaller diffs, easier debugging
│   ├── Pro: can deploy each intermediate version
│   ├── Pro: if bug occurs, you know which version caused it
│   └── This is the only safe approach
│
├── Skip intermediate versions (risky)
│   ├── Example: 9 → 11 (skipping 10)
│   ├── Risk: compound issues from multiple version changes
│   ├── Risk: missing intermediate deprecation notices
│   ├── Only consider: if survey says intermediate changes are minimal
│   └── Generally NOT recommended
│
└── Pre-upgrade checklist (before running Shift)
    ├── PHP version meets new Laravel requirements
    ├── All third-party packages compatible with target version
    ├── Full test suite passes on current version
    ├── No unresolved deprecation warnings
    ├── VCS clean (no uncommitted changes)
    └── Documented rollback plan
```

### D03: Review Process

```
START: How should we review Shift-generated changes?
│
├── Shift branch review workflow
│   ├── 1. Shift creates branch with atomic commits
│   ├── 2. Diff review: git diff main...shift-branch
│   ├── 3. Review categories:
│   │   ├── Composer.json changes (version bumps)
│   │   ├── Config file changes (new settings, structure changes)
│   │   ├── Code transformations (deprecated method replacements)
│   │   └── Structural changes (directory layout, service providers)
│   ├── 4. Run full test suite
│   └── 5. Manual verification of critical paths
│
├── What to focus review on
│   ├── Config changes (often contain important new defaults)
│   ├── Removed/renamed methods (might have callers Shift missed)
│   ├── Service provider registration changes
│   ├── Middleware signature changes
│   └── Authentication/authorization changes
│
├── Review team responsibility
│   ├── Lead developer: understands full scope
│   ├── Second reviewer: catches missed edge cases
│   └── QA: test critical user flows
│
└── Review time estimate
    ├── Small app (<20 models): 1-2 hours per version
    ├── Medium app (20-50 models): 2-4 hours per version
    └── Large app (50+ models): 4-8 hours per version
```

### D04: Post-Upgrade Verification

```
START: What verification is needed after Shift application?
│
├── Immediate verification (required)
│   ├── Full test suite passes (unit, feature, browser)
│   ├── PHPStan passes at project's configured level
│   ├── Critical path testing:
│   │   ├── Authentication (login, register, password reset)
│   │   ├── Authorization (policies, gates)
│   │   ├── Core CRUD operations
│   │   └── API endpoints
│   └── Dry-run deployment to staging environment
│
├── Staging verification
│   ├── Deploy upgraded app to staging
│   ├── Run integration tests against staging
│   ├── Manual smoke testing of key workflows
│   ├── Check error logs for deprecation warnings
│   ├── Verify email delivery (if upgraded mail config)
│   └── Performance benchmark comparison
│
├── Third-party package audit
│   ├── Verify every package supports new Laravel version
│   ├── Update packages that have new versions
│   ├── Replace packages that dropped Laravel support
│   └── Test package-specific features
│
└── Rollback readiness
    ├── Document rollback steps
    ├── Keep old deployment available
    ├── Database migration rollback tested
    └── Communicate rollback plan to team
```
