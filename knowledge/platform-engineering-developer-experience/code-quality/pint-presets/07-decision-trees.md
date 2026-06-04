# 07-Decision Trees: Pint Presets

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | pint-presets |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Preset Selection | Choosing the right preset for the project | What framework or coding standard does the project follow? |
| D02 | Customization Depth | How much to customize beyond preset | Are preset defaults sufficient or do we need overrides? |
| D03 | Preset Migration | Switching presets mid-project | Do we need to change the preset on an existing codebase? |
| D04 | Monorepo Preset Strategy | Using different presets in one repository | Does each package need a different preset? |

## Architecture-Level Decision Trees

### D01: Preset Selection

```
START: Which preset should we use for this project?
│
├── Laravel application
│   └── Use laravel preset
│       ├── Ordered imports (facades before classes)
│       ├── Laravel helper spacing conventions
│       ├── PSR-12 compliant + Laravel ecosystem patterns
│       └── Code matches community expectations
│
├── Laravel package
│   ├── Publish to Packagist?
│   │   ├── Yes → Use laravel preset (ecosystem consistency)
│   │   └── No → Use laravel preset (internal consistency)
│   └── Laravel preset ensures package feels native
│
├── Framework-agnostic PHP library
│   ├── Use psr12 preset (widely compatible)
│   └── Use per preset (modern PSR evolution)
│
├── Symfony project
│   └── Use symfony preset
│
└── PHP tool/script (no framework)
    ├── Use psr12 or per preset
    └── Match target PHP version conventions
```

### D02: Customization Depth

```
START: How much should we customize beyond the chosen preset?
│
├── No customization
│   ├── No pint.json needed (or explicit preset declaration only)
│   ├── Accept preset defaults completely
│   ├── Pro: zero maintenance, zero team debate
│   └── Best for: projects where formatting is low priority
│
├── Minimal overrides (recommended)
│   ├── 3-5 custom rules on top of preset
│   ├── Only override rules where team has strong consensus
│   ├── Document rationale for each override
│   └── Run pint -v to verify effective rules
│
├── Heavy customization
│   ├── 30+ rules overriding preset → defeats purpose of presets
│   ├── Risk: conflicting rules, ongoing maintenance
│   ├── Prefer: using different preset instead of heavy overrides
│   └── Alternative: accept that presets don't cover every edge case
│
└── Rule semantics reminder
    ├── true = enable rule
    ├── false = disable rule (opposite of preset behavior)
    └── absent (null) = inherit preset default
```

### D03: Preset Migration

```
START: Should we switch presets on an existing codebase?
│
├── No, current preset is adequate
│   └── Stay with current preset, avoid unnecessary churn
│
├── Yes, we need to switch presets
│   ├── Only switch when: project framework changes or org standard changes
│   ├── Steps:
│   │   1. Update pint.json with new preset
│   │   2. Remove custom rules that conflict with new preset
│   │   3. Run pint on full codebase (commit as isolated change)
│   │   4. Add .git-blame-ignore-revs to skip the formatting commit
│   │   5. Verify: pint --test passes clean
│   ├── Impact: thousands of lines changed in single commit
│   └── Communication: notify team before switching
│
└── After switching
    ├── Review effective rules: pint -v
    ├── Adjust custom overrides for new preset
    ├── Update CONTRIBUTING.md with preset choice rationale
    └── Lock Pint version to prevent unexpected changes
```

### D04: Monorepo Preset Strategy

```
START: Does the monorepo need different presets per package?
│
├── All packages use the same framework
│   ├── Use same preset across all packages (e.g., laravel)
│   ├── Single pint.json at root
│   └── Consistent formatting across all packages
│
├── Different frameworks per package
│   ├── Root pint.json with project-default preset
│   ├── Nested pint.json per package with appropriate preset:
│   │   ├── packages/laravel-module/ → laravel preset
│   │   ├── packages/symfony-bridge/ → symfony preset
│   │   └── packages/php-library/ → psr12 preset
│   └── Each nested config overrides parent for that subtree
│
├── Org standard consistency
│   ├── Same preset across all organization Laravel projects
│   ├── Developers move between projects — no mental context switch
│   └── CI enforcement: same pint --test across all repos
│
└── Verification
    ├── Run pint from root to validate all nested configs
    ├── CI: run pint --test per package directory
    └── Review effective rules per package periodically
```
