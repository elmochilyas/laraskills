# 04-Standardized Knowledge: PHPStan Config for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | phpstan-config-for-laravel |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | phpstan-neon-configuration, phpstan-baseline-patterns, laravel-phpstan |
| **Framework/Language** | PHPStan, Larastan, PHP, NEON |

## Overview

PHPStan config for Laravel is defined in `phpstan.neon` using Larastan extensions. Specifies: level (0-9), scan paths, excluded paths, Larastan-specific parameters (database type, model directory), custom rules, baseline, memory limits, bootstrap files, and stub files. Production-grade setups include level selection based on maturity, path exclusions for generated files, stub files for facades/macros, and report-only rules.

## Core Concepts

- **phpstan.neon**: main config in NEON format with includes, parameters, services
- **Level**: 0-9 controlling strictness; 6 recommended minimum
- **Paths/ExcludedPaths**: scan and exclusion directories
- **Bootstrap Files**: PHP files executed before analysis for constants, functions
- **Stub Files**: PHPDoc stubs for types PHPStan can't analyze
- **Larastan Parameters**: databaseMigrations, customRulesImplemented, reportUnmatchedIgnoredErrors

## When to Use

- Every Laravel project for static analysis configuration
- Setting up Larastan for the first time on a project
- Configuring CI-specific analysis settings

## When NOT to Use

- Simple projects not using PHPStan yet
- Projects using alternative static analysis tools (Psalm)

## Best Practices (WHY)

- **Minimum level 6**: catches mixed type issues without excessive ceremony
- **Exclude vendor and storage**: prevents long analysis and false positives
- **Set explicit memory limit**: `memoryLimit: 1024M` prevents OOM crashes
- **Use separate baseline file**: `includes: [phpstan-baseline.neon]` for clean separation
- **Bootstrap for legacy code**: create `phpstan-bootstrap.php` for constants/globals
- **Separate CI config**: `phpstan.ci.neon` with stricter settings for pipeline

## Architecture Guidelines

- Level 6 for new projects; level 9 for critical modules
- Use includes hierarchy: base config → CI config → local overrides
- Exclude test files from strict rules (or use per-directory level configs)
- Register custom rules in services section with proper tags
- Enable parallel processing for large codebases

## Performance Considerations

- Path exclusion reduces scan time proportionally
- Memory limit: 1GB for medium apps, 2-4GB for large apps
- Bootstrap files add 1-5s startup time — keep minimal
- Parallel processing: 4 processes for typical CI runners

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Not excluding vendor/storage | Slow analysis, false positives | Long CI, noise | Add to excludedPaths |
| Level too low | Minimal value | False confidence | Minimum level 6 |
| Missing Larastan config | Database/model not configured | Missing Laravel patterns | Add Larastan-specific params |
| No memory limit set | OOM crash | Analysis fails | Always set explicit limit |
| Test files at strict level | Mock/facade patterns trigger errors | False positives | Separate config for tests |

## Examples

```neon
includes:
    - vendor/larastan/larastan/extension.neon
    - phpstan-baseline.neon

parameters:
    level: 6
    paths:
        - app/
        - config/
        - database/
    excludedPaths:
        - vendor/
        - storage/
        - bootstrap/cache/
    memoryLimit: 1G
    tmpDir: storage/framework/cache/phpstan
    databaseMigrations: true
```

## Related Topics

- phpstan-neon-configuration — NEON format syntax
- phpstan-baseline-patterns — baseline management
- laravel-phpstan — Larastan overview

## Verification

- [ ] phpstan.neon committed with correct settings
- [ ] Level 6+ configured
- [ ] Vendor, storage excluded
- [ ] Memory limit set
- [ ] Baseline file included
- [ ] Larastan extensions loaded
- [ ] CI config separate if needed
