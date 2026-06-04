# 07-Decision Trees: Laravel PHPStan

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | laravel-phpstan |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Analysis Level Selection | Choosing PHPStan strictness level 0-9 | How strict should our static analysis be? |
| D02 | Baseline Adoption | Whether to use baseline for incremental adoption | Can we fix all errors now, or need incremental approach? |
| D03 | CI Integration Depth | How to integrate PHPStan in CI pipeline | What level of enforcement runs in CI? |
| D04 | Model Annotation Strategy | How to document Eloquent models for PHPStan | How do we teach PHPStan about dynamic Eloquent properties? |

## Architecture-Level Decision Trees

### D01: Analysis Level Selection

```
START: What PHPStan level should we use?
│
├── New project / greenfield
│   ├── Team experienced with static analysis?
│   │   ├── Yes → Start at level 6 (catches mixed types, minimal ceremony)
│   │   └── No → Start at level 4, increase quarterly
│   └── Target: level 9 for critical modules, level 6 for rest
│
├── Existing codebase
│   ├── Do we have time to fix all errors now?
│   │   ├── Yes → Fix all, start at level 6+
│   │   └── No → Generate baseline at target level
│   │       ├── Level 2 → baseline → Level 4 → baseline → Level 6
│   │       └── Graduation schedule: increase level quarterly
│   └── Target: minimum level 6 within 12 months
│
└── Key considerations per level:
    ├── Level 0-1: Minimal checks — known types only
    ├── Level 2-3: Unknown types, death code — basic coverage
    ├── Level 4-5: Return types, dead branches — moderate
    ├── Level 6: Mixed types — recommended minimum
    └── Level 7-9: Strict comparisons, PHPDoc completeness — expert
```

### D02: Baseline Adoption

```
START: Should we use a PHPStan baseline?
│
├── New project with zero existing errors
│   └── No baseline needed — enforce strict level from day one
│
└── Existing codebase with existing errors
    ├── Can all errors be fixed immediately?
    │   ├── Yes → Fix all, no baseline needed
    │   └── No → Generate baseline
    │       ├── Run: phpstan analyse --level=6 --generate-baseline
    │       ├── Commit phpstan-baseline.neon to VCS
    │       ├── CI: fail on new errors exceeding baseline
    │       └── Schedule baseline review:
    │           ├── Regenerate monthly to remove stale entries
    │           ├── Track baseline size (wc -l) in team dashboards
    │           └── Set 10-15% quarterly reduction targets
    │
    Key considerations:
    - Generate baseline at target level, not lowest level
    - Baseline is visible debt — track size over time
    - Heed PHPStan staleness warnings and regenerate promptly
    - Dedicated cleanup PRs vs mixing with feature work
```

### D03: CI Integration Depth

```
START: How should PHPStan run in CI?
│
├── Minimum viable (baseline enforcement)
│   ├── Run: phpstan analyse --memory-limit=1G
│   ├── Fail CI if new errors exceed baseline
│   ├── Cache tmpDir for faster subsequent runs
│   └── ~2-5min for medium app
│
├── Standard (full analysis)
│   ├── Include --error-format=github for PR annotations
│   ├── Run in parallel with test suite for full feedback
│   ├── Enable result caching (restore from previous run)
│   └── PHP matrix: test against multiple PHP versions
│
└── Advanced (comprehensive quality gate)
    ├── Separate CI config: phpstan.ci.neon with stricter settings
    ├── Level 6 on app/, level 9 on critical modules
    ├── Scheduled monthly full analysis + baseline regeneration
    ├── Track level graduation progress in CI dashboard
    └── Block merge on new errors (not just warn)
```

### D04: Model Annotation Strategy

```
START: How do we document Eloquent models for PHPStan?
│
├── Simple models (no custom attributes/relationships)
│   ├── Use Larastan's built-in model reflection
│   └── No additional annotations needed for basic CRUD
│
├── Models with custom attributes
│   ├── Use @property annotations on model class
│   │   Example: @property string $email, @property Carbon $created_at
│   └── Run phpstan after adding annotations to verify coverage
│
├── Models with custom relationships
│   ├── Use @method annotations for relationship methods
│   │   Example: @method HasMany|Collection posts()
│   └── Use generic collections: @return Collection<User>
│
└── Best practices
    ├── Prefer @property over inline PHPDoc casts
    ├── Use ide-helper model PHPDoc generation as starting point
    ├── Review annotations when migrations add/change columns
    └── Lock Larastan version to prevent annotation interpretation changes
```
