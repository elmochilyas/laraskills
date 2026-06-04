# 07-Decision Trees: PHPStan Config for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | phpstan-config-for-laravel |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Config Structure | How to compose config files (single vs layered) | How many environments need different PHPStan settings? |
| D02 | Path Scoping | Which directories to include/exclude from analysis | What code should PHPStan analyze and skip? |
| D03 | Larastan Parameters | Which Laravel-specific settings to configure | What Laravel patterns need special PHPStan configuration? |
| D04 | CI Config Separation | Whether to have a separate CI config | Does CI need stricter settings than local development? |

## Architecture-Level Decision Trees

### D01: Config Structure

```
START: How should we structure PHPStan configuration?
│
├── Single file (phpstan.neon)
│   ├── Use for: simple projects, single environment
│   ├── Contains: level, paths, includes, parameters
│   └── Include baseline as separate file: includes: [phpstan-baseline.neon]
│
├── Layered configs (recommended for teams)
│   ├── Base config: phpstan.neon (shared settings)
│   │   └── level, paths, baseline, common excludes
│   ├── CI config: phpstan.ci.neon
│   │   └── extends base + stricter level, full paths, annotations
│   ├── Local config: phpstan.local.neon (gitignored)
│   │   └── extends base + local paths, dev settings
│   └── Include chain: phpstan.neon → phpstan.ci.neon
│
└── Include pattern:
    parameters:
        level: 6
    includes:
        - vendor/larastan/larastan/extension.neon
        - phpstan-baseline.neon
```

### D02: Path Scoping

```
START: Which directories should PHPStan analyze?
│
├── Must include
│   ├── app/ (application code)
│   ├── config/ (configuration files)
│   └── database/ (migrations, factories, seeders)
│
├── Must exclude
│   ├── vendor/ (third-party code, not ours to fix)
│   ├── storage/ (generated runtime files)
│   └── bootstrap/cache/ (compiled config, cached routes)
│
├── Consider including (optional)
│   ├── tests/ (at lower level or via separate config)
│   └── routes/ (if heavily typed with route model binding)
│
└── Test file strategy
    ├── Include tests at same level → strict test code
    ├── Include tests at lower level → mock patterns tolerated
    ├── Separate config for tests → test-specific level
    └── Exclude tests entirely → test quality not enforced
```

### D03: Larastan Parameters

```
START: Which Larastan-specific settings should we configure?
│
├── Model/database settings
    ├── databaseMigrations: true (analyze migration files)
    ├── customRulesImplemented: true (check custom rule contracts)
    └── modelDirectory: app/Models (optimize model analysis)
│
├── Performance settings
│   ├── tmpDir: storage/framework/cache/phpstan (persistent cache)
│   ├── memoryLimit: 1G (prevent OOM)
│   └── parallel: enabled for multi-core CI runners
│
├── Report settings
│   ├── reportUnmatchedIgnoredErrors: true (catch stale ignores)
│   ├── checkMissingIterableValueType: true (generic enforcement)
│   └── checkGenericClassInNonGenericObjectType: false (if noisy)
│
└── Bootstrap files
    ├── Do you have constants/globals defined in non-standard files?
    │   ├── Yes → Create phpstan-bootstrap.php, include in config
    │   └── No → No bootstrap needed
    └── Stub files for facades/macros
        ├── Do facades have dynamic methods not caught by Larastan?
        │   ├── Yes → Create stub files with PHPDoc
        │   └── No → Larastan extensions cover standard facades
```

### D04: CI Config Separation

```
START: Should CI have a separate PHPStan config?
│
├── No separate config
│   ├── Use case: CI uses same config as local
│   ├── Pro: simpler, consistent behavior
│   ├── Con: CI may need stricter paths or annotations
│   └── Best for: solo projects, simple CI
│
├── Separate CI config (phpstan.ci.neon)
│   ├── Use case: CI needs different settings
│   ├── Differences from local config:
│   │   ├── --error-format=github for annotations
│   │   ├── --no-progress for clean output
│   │   ├── Potentially stricter level on critical paths
│   │   └── Explicit memory limit
│   ├── Con: drift risk between local and CI behavior
│   └── Best for: teams, complex CI pipelines
│
└── Recommendations
    ├── Keep base config in phpstan.neon
    ├── CI overrides in phpstan.ci.neon via includes
    ├── Don't duplicate settings — use inheritance
    └── Test: CI should pass same checks as local
```
