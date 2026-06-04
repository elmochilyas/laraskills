# 04-Standardized Knowledge: Laravel PHPStan

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | laravel-phpstan |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | phpstan-config-for-laravel, phpstan-neon-configuration, phpstan-baseline-patterns |
| **Framework/Language** | PHPStan, Larastan, PHP, Laravel |

## Overview

Laravel PHPStan (via Larastan) brings static analysis to Laravel applications, detecting type errors, undefined methods, missing return types, and incorrect facade calls. Larastan provides extensions that understand facades, Eloquent models, helpers, and service container resolution. It supports levels 0-9, baseline for incremental adoption, and result caching. Larastan is maintained by the Laravel community and is the standard static analysis tool for Laravel.

## Core Concepts

- **Static Analysis**: finds errors without executing code — examines types, calls, return values, control flow
- **Larastan Extensions**: teach PHPStan about Laravel-specific patterns (facades, Eloquent, helpers, macros)
- **Analysis Levels**: 0 (easiest) to 9 (strictest); each level adds more checks
- **Baseline File**: records current errors as known issues for incremental adoption
- **PHPDoc Support**: reads `@param`, `@return`, `@var`, `@property`, `@method` annotations
- **Generics Support**: understands `Collection<User>`, `array<string, User>`

## When to Use

- Every Laravel project for catching type errors before runtime
- CI pipeline as a quality gate before deployment
- Incremental adoption on legacy codebases via baseline
- Critical systems where type safety is paramount

## When NOT to Use

- Prototypes or throwaway code
- Codebases with extensive dynamic/magic behavior that can't be annotated
- Projects not yet ready to invest in type annotations

## Best Practices (WHY)

- **Start at level 6**: catches mixed type issues without excessive ceremony
- **Use baseline for existing code**: capture current errors, fix new code strictly
- **Add PHPDoc to models**: `@property` and `@method` annotations help PHPStan understand Eloquent
- **Use generic collections**: `@return Collection<User>` over `@return Collection`
- **Run in CI with `--memory-limit=1G`**: prevents OOM crashes
- **Lock Larastan version**: prevent analysis changes from breaking CI unexpectedly

## Architecture Guidelines

- PHPStan configuration in `phpstan.neon` or `phpstan.neon.dist`
- Exclude `vendor/`, `storage/`, `bootstrap/cache/` from analysis
- Run PHPStan after Pint (style) but before PHPUnit (tests) in CI
- Use `--generate-baseline` to create initial baseline for existing projects
- Cache analysis results — configure `tmpDir` for persistent storage

## Performance Considerations

- Analysis time: medium app (500 files) 30-120s; large app (2000+ files) 5-15 min
- Memory: 256-512MB medium, 1-2GB large apps
- Level impact: level 1 vs 6 difference is ~5-10% runtime
- Result cache: subsequent runs (no changes) are 10-50x faster

## Security Considerations

- PHPStan can't analyze runtime-generated code or Blade templates
- Dynamic method calls (`__call`, `__get`) may produce false negatives
- Third-party packages without type stubs may have incomplete analysis

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Running at too low a level | Level 1 catches little | Not understanding levels | False sense of security | Minimum level 6 |
| Ignoring baseline | Never reviewing baseline | Forgetting | Stale errors hidden | Schedule baseline review |
| No memory limit in CI | OOM crashes | Default 128MB limit | Analysis fails | Set --memory-limit=1G |
| Not updating Larastan | New Laravel features not covered | Version drift | Gaps in analysis | Upgrade together |
| No result cache in CI | Full reanalysis each run | Not configuring | Slow CI | Enable result cache |

## Anti-Patterns

- **Level 0 in Production**: using the lowest level provides minimal value
- **Infinite Baseline**: never fixing baseline entries — accumulated technical debt
- **Ignoring False Positives**: marking everything as "ignore" instead of understanding the issue
- **No PHPDoc on Models**: leaving PHPStan blind to Eloquent magic

## Examples

```neon
# phpstan.neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    level: 6
    paths:
        - app/
        - config/
        - database/
    tmpDir: storage/framework/cache/phpstan
    memoryLimit: 1G

    # Larastan-specific configuration
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: false
```

## Related Topics

- phpstan-config-for-laravel — Larastan-specific configuration
- phpstan-neon-configuration — PHPStan configuration syntax
- phpstan-baseline-patterns — baseline management
- static-analysis-ci-integration — CI pipeline setup

## AI Agent Notes

- Larastan was created by Can Vural, maintained by Nuno Maduro (Laravel core team)
- Larastan v2.x uses PHP 8.1 features; v3.x supports PHPStan 2.0
- Result cache stored in `tmp/phpstan` by default — exclude from VCS
- For Eloquent models, prefer `@property` annotations over inline PHPDoc

## Verification

- [ ] PHPStan level 6+ passes on codebase
- [ ] Baseline generated for existing errors
- [ ] CI step runs phpstan analyse with memory limit
- [ ] Model PHPDoc annotations for dynamic properties
- [ ] Result caching enabled for faster analysis
- [ ] Larastan version locked in composer.json
- [ ] No false positives suppressed without understanding
- [ ] Scheduled baseline review cadence established
