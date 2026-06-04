# 04-Standardized Knowledge: Rector Rules Laravel Upgrades

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | rector-rules-laravel-upgrades |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-rector, rector-configuration, static-analysis-ci-integration |
| **Framework/Language** | Rector, PHP, Laravel |

## Overview

Rector provides preset rule sets for automatically upgrading Laravel between versions (Laravel 10→11→12). Rulesets cover: Facade-to-injection conversions, service provider registration changes, deprecated method replacements, configuration file changes, middleware signatures, authentication changes, session/cache driver migrations, collection method deprecations, query builder changes, Eloquent scope modifications, and helper function removals.

## Core Concepts

- **Version-Specific Sets**: `SetList::LARAVEL_100`, `SetList::LARAVEL_110` targeting specific upgrade paths
- **Progressive Sets**: cumulative rulesets that chain through intermediate versions
- **Deprecation Rules**: replace `@deprecated` methods with current equivalents
- **Facade-to-Injection**: converts `Facade::method()` to injected `$class->method()`
- **Config Migration**: updates config files to match new version file structure

## When to Use

- Major Laravel version upgrades (10→11, 11→12)
- Codebases with deprecated method usage
- Automated upgrade processing before manual verification
- Team alignment on current Laravel version best practices

## When NOT to Use

- Patch version upgrades (no API changes)
- Third-party package upgrades (use package-specific rectors)
- Projects already on latest version without deprecated usage

## Best Practices (WHY)

- **Run sets incrementally**: apply L10→L11 first, verify, then L11→L12 instead of one-shot
- **Review every change**: 5-10% of automated changes need manual adjustments
- **Version-specific config**: separate `rector-laravel-upgrade.php` config per upgrade
- **Use --dry-run first**: inspect changes before writing
- **Apply to app/ only**: don't run upgrade rules on vendor or tests first pass
- **Combine with code quality rules**: run coding-style rules after upgrade rules

## Architecture Guidelines

- One-time config per upgrade, removed after completion
- Process: dry-run → review → apply → commit → manual verification
- Run upgrade rules in feature branch, not main
- Apply style rules as separate step after upgrade changes

## Performance Considerations

- 1000-file Laravel app: 2-5 min full scan; 30-60s for app/ only
- Memory: 512MB-1GB for medium Laravel apps
- Incremental: Rector caches processed files for ~30% faster re-runs

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| One-shot all upgrades | Jumping multiple versions | Missing intermediate changes | Apply per-version sets sequentially |
| Trusting all changes blindly | 95% correct, 5% wrong | Subtle bugs | Review every diff |
| Running on vendor | Third-party code upgraded | Package conflicts | Exclude vendor from upgrade rules |
| No dry-run first | Immediate file modification | Hard to debug | Always --dry-run first |
| Not updating after upgrade | Old rules remain active | Outdated standards | Remove upgrade sets after completion |

## Examples

```php
// rector-laravel-upgrade.php
use Rector\Set\ValueObject\SetList;

return RectorConfig::configure()
    ->withPaths([__DIR__.'/app'])
    ->withSets([
        SetList::LARAVEL_110,
    ])
    ->withImportNames();
```

## Related Topics

- laravel-rector — Rector overview for Laravel
- static-analysis-ci-integration — CI pipeline setup
- coding-standards-documentation — documenting upgrade process

## Verification

- [ ] Upgrade sets applied incrementally per version
- [ ] Dry-run performed before write
- [ ] All changes reviewed
- [ ] Upgrade config removed after completion
- [ ] Vendor excluded from upgrade rules
- [ ] Tests pass after upgrade
