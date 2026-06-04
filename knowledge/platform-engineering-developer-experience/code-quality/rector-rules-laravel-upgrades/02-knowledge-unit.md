# Knowledge Unit: Rector Rules for Laravel Upgrades

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/rector-rules-laravel-upgrades
- **Maturity:** Maturing
- **Related Technologies:** Rector, Laravel, PHP, Automated Refactoring

## Executive Summary

Rector provides a set of Laravel-specific rules (via `rectorphp/rector-laravel`) that automate code transformations for Laravel version upgrades and best practice adoption. These rules cover: deprecated method replacements (e.g., `env()` helper to config in production code), renamed classes and interfaces (e.g., `Mailable::from()` signature changes), facade-to-helper conversions, route definition changes, middleware registration changes, and migration-related transformations. The rule sets are organized by Laravel version (`SetList::LARAVEL_100` for Laravel 10 upgrades, `SetList::LARAVEL_110` for Laravel 11 upgrades, etc.). Each rule set contains multiple individual rules that target specific upgrade-related changes. Rector's Laravel rules are maintained by the community and run alongside Rector's general PHP version upgrade rules for comprehensive project modernization.

## Core Concepts

- **Laravel Set Lists:** Predefined collections of rules for each Laravel major version upgrade: `LARAVEL_80`, `LARAVEL_90`, `LARAVEL_100`, `LARAVEL_110`
- **Individual Rules:** Single transformations: `ChangeQueryBuilderCallToEagerLoadRector`, `AddArgumentToResourceCollectionRector`, `MigrateToSimplifiedWebRoutesRector`
- **Deprecation Rules:** Rules that replace deprecated Laravel methods and patterns with their modern equivalents
- **Config Transformations:** Rules that update configuration structures (e.g., `config/app.php` provider array to autodiscovery)
- **Structural Changes:** Rules that modify directory structure (e.g., removing `Http/Kernel`, `Console/Kernel` in Laravel 11)
- **Helper Updates:** Rules that transform helper function usage (e.g., `session()->flash()` to `session()->flash()` parameter changes)

## Mental Models

## Internal Mechanics

## Patterns

- **Incremental Version Upgrade Pattern:** Apply one major version upgrade at a time: first run `LARAVEL_90` set, test, then `LARAVEL_100`, test, then `LARAVEL_110`. Each upgrade is smaller and easier to debug.
- **Dry Run First Pattern:** Always run `vendor/bin/rector process --dry-run` with Laravel sets to review proposed changes before applying. Output the diff for code review.
- **Selective Rule Application Pattern:** Instead of running the full Laravel set, apply individual rules that match the project's upgrade needs. Use `$rectorConfig->rule()` for specific rules and `$rectorConfig->skip()` for rules that don't apply.
- **Combined PHP + Laravel Upgrade Pattern:**
```php
$rectorConfig->sets([
    SetList::PHP_82,
    SetList::LARAVEL_110,
]);
```
This upgrades both the PHP version usage and Laravel patterns in one run.
- **Custom Laravel Upgrade Pattern:** Create project-specific Rector rules for internal framework migrations (e.g., replacing a legacy internal package with a new one) that follow the same pattern as Rector's Laravel rules.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Rule source | rector-laravel vs custom rules vs Shift | rector-laravel for standard upgrades; custom rules for project-specific migrations; Shift for comprehensive paid upgrades |
| Upgrade approach | Sequential versions vs direct jump | Sequential (safer, easier to debug); direct only for simple projects with few customizations |
| Rule verification | Dry run only vs diff review vs test suite | Dry run + test suite (dry run shows changes; test suite verifies correctness) |
| CI integration | On-demand only vs scheduled (monthly) | On-demand for version upgrades; scheduled for deprecation detection |

## Tradeoffs

- **Rector Rules vs Laravel Shift:** Rector rules are free and cover common upgrade patterns but may miss project-specific edge cases. Shift is paid but provides comprehensive, human-reviewed upgrade scripts that cover more patterns. Rector is better for teams with dedicated upgrade expertise; Shift is better for teams wanting a hands-off upgrade experience.
- **Full Set vs Individual Rules:** Running a full set is comprehensive but may apply transformations that the project doesn't need (creating unnecessary diffs). Individual rules are targeted but require knowledge of which rules apply. Start with the full set and use `skip` to exclude irrelevant rules.
- **Automated vs Manual Upgrade Steps:** Some Laravel upgrades require manual steps (database changes, configuration decisions, third-party compatibility checks) that Rector cannot automate. Rector handles the code-level 80%; manual work covers the remaining 20%.

## Performance Considerations

- **Rule Processing Time:** Each additional rule adds processing time. A full Laravel set (~50 rules) adds 2-5 seconds to analysis time over no-Laravel analysis.
- **File Discovery:** Rector scans all configured paths for files matching rule criteria. Laravel rules typically scan `app/`, `config/`, `routes/`, and `tests/` directories.
- **Cache Warm-Up:** Rector's result cache significantly speeds up subsequent runs. After the first run (caches building), subsequent runs are 5-10x faster.

## Production Considerations

- **Version Locking:** Lock `rector/rector` and `rectorphp/rector-laravel` versions in `composer.json`. Rule behavior changes between versions, and unexpected rule application can break CI.
- **Post-Upgrade Testing:** After applying Rector's Laravel upgrade rules, run the full test suite. Automated transformations may introduce subtle issues, especially for edge cases.
- **Configuration Backup:** Back up the current `rector.php` before running major upgrades. Rule sets and configuration options change between Rector versions.
- **Incremental Application:** Apply Rector rules in separate commits by upgrade category (helpers first, facades second, configs third). This makes review manageable and simplifies reverting problematic transformations.

## Common Mistakes

- **Applying incompatible rule sets:** Running `LARAVEL_110` on a Laravel 9 codebase without first upgrading to Laravel 10; rules expect code patterns from an intermediate version
- **Not skipping false—positive rules:** Some rules may not apply to the project's specific patterns; not using `$rectorConfig->skip()` leads to incorrect transformations
- **Missing third-party package compatibility:** Rector updates Laravel patterns but not third-party package usage; packages may need separate updates
- **Over-relying on automated rules:** Thinking Rector handles all upgrade changes; manual upgrade guide review is still essential for architectural and configuration changes
- **Not testing directory-specific exclusions:** Tests and legacy code may need different rule sets; use per-directory Rector configuration for different code areas

## Failure Modes

- **Incorrect Transformation Applied:** A rule transforms code incorrectly, breaking functionality. Mitigate: always use `--dry-run` and review diffs; run comprehensive tests after applying.
- **Rule Conflicts:** Two rules attempt to modify the same code in incompatible ways, producing invalid PHP. Mitigate: apply rule sets separately to isolate conflicts.
- **Missing Rule for Project Pattern:** The project uses a Laravel pattern not covered by Rector's rules (custom facades, project-specific service providers). Mitigate: create custom Rector rules for project-specific patterns.
- **Version Incompatibility:** Rector version doesn't support the installed PHP version or Laravel version. Mitigate: check Rector's version requirements before upgrading.

## Ecosystem Usage

- **Laravel Version Upgrades:** The primary use case—teams use Rector to automate 80%+ of code changes between Laravel major versions
- **Continuous Modernization:** Teams run Rector's Laravel rules on a schedule (monthly) to detect and fix deprecated patterns as they're introduced
- **PHP + Laravel Combo:** Combined with PHP version sets, Rector handles both PHP version upgrades (8.1 → 8.2 features) and Laravel upgrades in a single pass
- **Laravel Package Maintenance:** Package maintainers use Rector rules to ensure their packages are compatible with multiple Laravel versions
- **Laravel Shift Integration:** Shift's upgrade service uses similar transformation patterns; teams using Rector replicate some Shift functionality in-house

## Related Knowledge Units

- laravel-rector
- laravel-shift
- phpstan-baseline-patterns
- automated-deployment-pipelines

## Research Notes

- `rectorphp/rector-laravel` is maintained by the community (not the Rector core team); rule coverage varies by Laravel version
- The Laravel rule sets are less comprehensive than Shift's curated rules but cover the most common upgrade patterns
- Rector 2.x introduced improved Laravel rules with better type resolution and more reliable transformations
- Key Laravel rules include: `AddArgumentToResourceCollectionRector`, `ChangeQueryBuilderCallToEagerLoadRector`, `MigrateToSimplifiedWebRoutesRector`, `SwapTaggedServiceAttributeRector`, `RenamePropertyAndMethodToMatchMigrationRector`
