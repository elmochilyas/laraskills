# Knowledge Unit: Laravel Shift

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/laravel-shift
- **Maturity:** Mature
- **Related Technologies:** Laravel Shift, Rector, PHP, Laravel, Automated Upgrades

## Executive Summary

Laravel Shift is a commercial automated upgrade service that analyzes Laravel applications and applies version-to-version upgrade changes. Shifts handle: composer dependency updates (Laravel version bump, third-party package compatibility), configuration file migrations (config/ changes between versions), code transformations (deprecated method replacements, API changes), facade-to-helper conversions, and structural changes (directory layout, service provider registration). Each Shift is a PHP script that uses static analysis to identify code patterns that need updating and applies codemod-style transformations. The service runs in a temporary Git branch, allowing developers to review all changes before merging. Beyond version upgrades, Shift also offers: Laravel Linter (best practice analysis), Laravel for Beginners (initialization analysis), and Laravel Workbench (automated package testing). Shift has processed over 1 million individual upgrades and is maintained by the same team behind Blueprint.

## Core Concepts

- **Shift Scripts:** PHP scripts that perform codemod transformations on Laravel codebases; each version upgrade has a dedicated Shift script
- **Git-Based Workflow:** Shift creates a new branch, commits upgrade changes in atomic commits, and preserves the original branch untouched for comparison
- **Automated Code Analysis:** Shift analyzes the entire codebase for patterns that need updating: deprecated methods, renamed classes, changed interfaces, removed features
- **Human Review Layer:** All Shift-generated changes are intended for human review before merging; Shift handles the mechanical upgrades, humans handle the semantic decisions
- **Shift Blueprint:** The underlying engine that powers Shift's transformation capabilities; also available as the open-source Blueprint tool for code generation
- **Shift Workbench:** A related service for testing Laravel packages against multiple Laravel versions in CI

## Mental Models

- **Shift as Automated Migration Script:** Each Shift is like a database migration but for application code—it transforms the codebase from one version's patterns to the next
- **Shift as Upgrade Journal:** Shift's atomic commits document every change needed for the upgrade, serving as a journal of what changed and why
- **Shift as Senior Developer:** Shift applies the knowledge of what changes between Laravel versions automatically, like having a senior developer who's memorized every upgrade guide and applies the changes

## Internal Mechanics

1. **Code Upload:** The developer provides access to their repository (via GitHub OAuth, GitLab, or manual zip upload) for analysis
2. **Static Analysis:** Shift parses the codebase using PHP-Parser (abstract syntax tree), identifying patterns that need upgrading: method calls, class references, configuration keys, route definitions
3. **Codemod Application:** Each upgrade transformation is a discrete codemod: rename class, change method signature, update config structure, replace facade call pattern
4. **Git Commit Generation:** Changes are committed in logical groups: "Update composer dependencies", "Migrate config files", "Apply code transformations", "Update tests"
5. **PR Creation:** A pull request is created with the upgrade changes, including a summary of what was changed and any manual steps still required
6. **Diff Analysis:** The developer reviews the PR, test the application, and merge the upgrade changes

## Patterns

- **Incremental Upgrade Pattern:** Upgrade through each major version sequentially (8→9, 9→10, 10→11) rather than jumping multiple versions; each Shift builds on the previous upgrade's output
- **Shift + Manual Polish Pattern:** Apply Shift for the mechanical 80% of upgrade changes, then manually handle the 20% that requires semantic decisions (business logic implications, third-party integrations)
- **Shift as CI Step Pattern:** Run Shift in CI as a scheduled task (e.g., monthly) to detect deprecated usage and generate upgrade-ready changes proactively
- **DIff Review Pattern:** Always run tests after Shift application; Shift generates syntactically correct code but can't verify business logic correctness post-upgrade
- **Incremental Testing Pattern:** After each Shift commit group, run tests incrementally to isolate issues: test composer update first, then config changes, then code transformations

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Upgrade strategy | Sequential version upgrades vs single jump | Sequential (each major version separately) for safety; single jump for well-tested applications |
| Repository access | GitHub OAuth vs self-hosted vs manual upload | GitHub OAuth for convenience; self-hosted for security/compliance; manual upload for isolated environments |
| Review approach | PR review vs local review vs CI pipeline | PR review for most projects; add CI pipeline for integration testing after Shift |
| Shift frequency | Per-release vs quarterly vs annually | Per-major-release (timely upgrades) vs quarterly (manageable change volume) |

## Tradeoffs

- **Automated vs Manual Upgrades:** Shift handles 80-95% of upgrade changes automatically but cannot handle application-specific refactoring, architectural changes, or breaking changes in third-party packages. The remaining 5-20% requires manual work.
- **Commercial vs DIY Rector:** Shift is a paid service but provides comprehensive upgrades with human-quality PRs. DIY upgrade with Rector rules is free but requires setup, rule configuration, and more manual review.
- **Sequential vs Direct Upgrade:** Upgrading through each version sequentially (`composer require laravel/framework:^10.0`, run Shift, test, then `^11.0`) is safer but more time-consuming. Direct upgrades skip intermediate versions but have higher risk of missed changes.
- **Full vs Partial Shifts:** Full Shifts upgrade the entire application; partial Shifts target specific areas (config only, tests only). Choose based on upgrade scope and risk tolerance.

## Performance Considerations

- **Shift Duration:** A typical Shift takes 1-10 minutes for analysis and code generation (depending on codebase size). Complex applications with 500+ files may take longer.
- **Codebase Size Impact:** Larger codebases take longer to analyze. Applications with hundreds of PHP files, complex service providers, and extensive facades may require multiple Shift passes.
- **Test Suite Duration:** After Shift, running the full test suite is the primary time cost. Plan for test suite execution time and allow for iterative fixes.
- **Review Time:** Reviewing a Shift PR for a major version upgrade typically takes 2-8 hours for a medium-sized application. Plan review time accordingly.

## Production Considerations

- **Staging Testing:** Always test Shift-upgraded applications on a staging environment before production deployment. Version upgrades can introduce subtle behavioral changes.
- **Third-Party Package Compatibility:** Shift updates the Laravel framework version and core packages but cannot update all third-party packages. Check each third-party package's compatibility with the new Laravel version manually.
- **Laravel Version Support Window:** Laravel provides 18 months of bug fixes and 24 months of security fixes per major version. Plan upgrades to stay within the support window.
- **Database Migration:** Major Laravel upgrades rarely require database changes, but check the upgrade guide for any schema-related changes (index naming, character set defaults).
- **Deployment Strategy:** Use a blue-green or rolling deployment for the upgraded application. Have a rollback plan if the upgraded application has issues in production.

## Common Mistakes

- **Skipping intermediate versions:** Jumping from Laravel 8 (PHP 7.4) to Laravel 11 (PHP 8.2+) directly; infrastructure changes (PHP version, extension requirements) compound and make debugging difficult
- **Not running tests after Shift:** Assuming Shift's automated changes are correct without running the test suite; Shift can miss edge cases or introduce subtle bugs
- **Not reviewing Shift's config changes:** Shift updates config files for new structural changes; ignoring config diffs means missing new configuration options or deprecated settings
- **Merging before team review:** Merging Shift PRs without team review creates knowledge gaps; team members need to understand what changed for ongoing development
- **Over-customizing Shift output:** Heavily modifying Shift-generated code instead of accepting the standard upgrade path; custom modifications complicate future upgrades

## Failure Modes

- **Incomplete Transformation:** Shift misses a deprecated method call because of non-standard usage patterns (dynamic method names, magic methods). Mitigate: run static analysis post-Shift to catch remaining issues.
- **Third-Party Package Breaking Change:** A package used by the application doesn't support the new Laravel version yet. Mitigate: check package compatibility before upgrading; postpone upgrade if critical packages aren't ready.
- **PHP Version Incompatibility:** The new Laravel version requires a newer PHP version that introduces breaking changes (typed properties, named arguments). Mitigate: upgrade PHP in a separate step before the Laravel upgrade.
- **Custom Code Not Covered:** Application-specific patterns (custom facades, macro extensions, service container bindings) are not covered by Shift transforms. Mitigate: manually review these patterns against the upgrade guide.

## Ecosystem Usage

- **Laravel Community:** Laravel Shift is the standard tool used by the majority of Laravel teams for version upgrades, with over 1 million shifts processed
- **Laravel News:** Shift is regularly featured and discussed on Laravel News, with upgrade guides referencing Shift for automated changes
- **Blueprint:** The same team behind Blueprint maintains Shift; both tools share the underlying code transformation engine
- **Rector:** Shift's approach to codemods influenced Rector's Laravel rules; Rector can replicate some Shift transformations for teams that prefer open-source tools
- **Laravel Forge:** Forge's deployment scripts often include upgrade guidance that references Shift for codebase transformations

## Related Knowledge Units

- blueprint-code-generation
- rector-rules-laravel-upgrades
- stub-customization-laravel
- automated-deployment-pipelines

## Research Notes

- Laravel Shift was created by Jason McCreary, a Laravel core contributor and former Laravel team member, who also created Blueprint
- Shift has processed over 1 million individual upgrades since its launch, making it the most widely used Laravel upgrade tool
- The underlying Shift engine is a proprietary code transformation system that uses PHP-Parser for AST analysis and manipulation
- Shift v2 (2023+) added support for Laravel 11.x upgrades with the new directory structure (removal of Http/Kernel, Console/Kernel, and other structural changes)
- Shift offers "Laravel for Beginners" (codebase initialization analysis) and "Linter" (continuous code quality) as complementary services beyond version upgrades
