# Experience Curation: Package Skeleton Structure

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-skeleton-structure
- **Maturity:** Mature
- **Related Technologies:** Spatie Package Skeleton, Composer, PHP, Laravel, Orchestra Testbench
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
A Laravel package skeleton provides the canonical directory structure, configuration files, and development tooling for creating a new package. The de facto standard is `spatie/package-skeleton-laravel`, which includes: PSR-4 autoloading configuration, GitHub Actions CI, PHP-CS-Fixer/Pint configuration, PHPStan configuration, Orchestra Testbench integration, and a `composer.json` with dependency boilerplate. The skeleton's structure—`src/`, `config/`, `database/migrations/`, `resources/views/`, `resources/lang/`, `tests/`—mirrors Laravel's own directory conventions, making package development feel consistent with application development.

## Core Concepts
- **PSR-4 Autoloading:** The `src/` directory maps to the package namespace; Composer's PSR-4 autoloading handles class loading without additional configuration
- **Testbench Configuration:** Orchestra Testbench is pre-configured as a dev dependency with a `CreatePackageTest` base class that bootstraps a Laravel application instance for testing
- **GitHub Actions CI:** Pre-configured workflows for running tests across multiple PHP versions (8.0-8.4) and Laravel versions; includes Pint and PHPStan steps
- **ConfigureSkeleton Script:** A CLI script that replaces placeholders (vendor name, package name, namespace, description) with actual values when creating a new package from the skeleton
- **Skeleton as Template Generator:** The skeleton is a template repository; running the configure script transforms the template into a specific package project
- **Skeleton as Checklist:** The skeleton encodes all files and configuration a well-structured Laravel package needs; it's a checklist in directory form

## When To Use
- Creating a new standalone Laravel package from scratch
- Building internal shared packages for organizational use
- Starting a package that will be distributed via Packagist or private Packagist
- Establishing a consistent package structure across an organization's package ecosystem
- Creating packages that follow community conventions for maximum developer familiarity

## When NOT To Use
- Adding a simple trait or helper class to an existing project (use a namespace directory instead)
- Building a monorepo with multiple packages (custom monorepo skeleton is needed)
- Creating a package with unusual structure requirements (frontend-heavy, Inertia components, database factories) without adapting the skeleton
- Packages that exist solely as a configuration wrapper around a third-party service

## Best Practices
- **WHY:** Run the configure script immediately after cloning the skeleton; skipping it leaves placeholder text that prevents autoloading and publishing
- **WHY:** Maintain a `.gitattributes` with `export-ignore` rules for tests, docs, CI configuration, and the configure script to avoid packaging irrelevant files in distribution
- **WHY:** Use the skeleton as a living standard; periodically regenerate from upstream to incorporate improvements in CI workflows, tooling versions, and best practices
- **WHY:** For organizations building 5+ internal packages, maintain a private fork of the skeleton with organization-specific defaults (namespace prefix, CI template, code review checklist)
- **WHY:** Mirror the `src/` directory structure in `tests/` for discoverable test organization; `src/Commands/MyCommand.php` → `tests/Commands/MyCommandTest.php`
- **WHY:** Always include a published config file with sensible defaults even for simple packages; it documents configuration options and allows consumer customization

## Architecture Guidelines
- **Flat Source Structure:** Place all package classes directly in `src/` or use subdirectories for organizational clarity (`src/Commands/`, `src/Models/`, `src/Http/Controllers/`); avoid deep nesting
- **Service Provider in src/:** Place the service provider directly in `src/` (e.g., `src/PackageServiceProvider.php`); it's the single entry point for package registration
- **Minimal Facades:** Only create facades for classes that are commonly injected or resolved; facades for internal-use classes add unnecessary API surface
- **Config-First Design:** Place default config in `config/package-name.php` with documented options; use snake_case keys consistent with Laravel core
- **Testbench Setup:** `tests/TestCase.php` extends `Orchestra\Testbench\TestCase`; `getPackageProviders()` returns the package's service provider for automatic registration in test environment
- **Composer Configuration:** Include `require` (laravel/framework, php), `require-dev` (orchestra/testbench, phpunit, phpstan, laravel/pint), `autoload` (PSR-4 mapping), `scripts` (test, lint commands), and `extra.laravel` (auto-discovery configuration)

## Performance
- Dev dependencies don't affect production installations but increase `composer install` time and disk usage; prune unused dev dependencies
- Orchestra Testbench boots a full Laravel application for each test class (~100-200ms per class); use `setUp()` caching and careful test organization to minimize time
- CI pipeline runs tests on multiple PHP versions × multiple Laravel versions (8-15 parallel jobs, 2-5 minutes each); total time limited by CI runner availability
- No runtime performance impact from skeleton structure itself; all performance concerns are in dev tooling and CI

## Security
- Include a SECURITY.md template describing how to report security vulnerabilities; follow Laravel's security disclosure practices
- Never include secrets, API keys, or credentials in skeleton defaults or config file templates
- Use `.gitattributes` `export-ignore` to exclude CI configuration, test fixtures, and development scripts from distribution packages
- Tighten PHP and Laravel version constraints from skeleton defaults based on actual package compatibility to prevent installation on unsupported versions

## Common Mistakes

### Not running the configure script
- **Description:** Using the skeleton without running the configure script leaves placeholder text in composer.json and source files
- **Consequence:** Package won't autoload or publish correctly; PSR-4 namespace mapping references placeholder values
- **Better Approach:** Run `php ./configure.php` immediately after cloning; the script replaces all placeholders and deletes itself

### Missing extra.laravel auto-discovery configuration
- **Description:** Not adding `extra.laravel` providers and aliases in composer.json
- **Consequence:** Package requires manual provider registration, reducing developer experience and increasing setup friction
- **Better Approach:** Always include `extra.laravel.providers` and `extra.laravel.aliases` in composer.json for automatic registration

### Composer.json autoloading misconfiguration
- **Description:** Incorrect PSR-4 namespace mapping in composer.json
- **Consequence:** Package classes aren't autoloaded and tests fail with "class not found" errors
- **Better Approach:** Verify PSR-4 mapping matches actual directory structure; run `composer dump-autoload` and test autoloading

### Ignoring Testbench setup
- **Description:** Testing packages without Testbench leads to poor integration test coverage
- **Consequence:** Unit tests alone miss provider registration, routing, and configuration merging issues that only manifest in a Laravel application context
- **Better Approach:** Use Testbench for integration tests and unit tests for isolated logic; both are needed

### Accidentally packaging skeleton files
- **Description:** Including the skeleton's configure script, .github directory, or test fixtures in the distributed package
- **Consequence:** Production installations download unnecessary files; configure script could be executed accidentally
- **Better Approach:** Maintain `.gitattributes` with `export-ignore` rules for all non-essential directories

## Anti-Patterns
- **Ignoring the skeleton entirely:** Building package structure manually from scratch for every package wastes time and misses important conventions
- **Deep nesting in src/:** Organizing package source code more than 2-3 levels deep (e.g., `src/Services/Core/Pipeline/Processors/`) creates confusing structure
- **Monorepo forced into single skeleton:** Trying to manage multiple packages in one repo using individual skeletons creates duplicate CI and autoloading issues
- **Over-customizing the skeleton:** Extensively modifying the skeleton before creating the first package makes it harder to track upstream changes

## Examples
- **Standard package structure:** `spatie/laravel-backup` follows the skeleton conventions with `src/`, `config/`, `database/migrations/`, `resources/views/`, `tests/`
- **Spatie skeleton repository:** `spatie/package-skeleton-laravel` on GitHub is the canonical reference for skeleton structure and CI configuration
- **Internal organization skeleton:** Many organizations maintain a private fork with custom namespace prefix, CI templates, and code quality tooling

## Related Topics
- spatie-laravel-package-tools (the companion package that makes service provider registration declarative)
- package-service-provider-patterns (service provider is the primary entry point in the skeleton)
- package-testing-orchestra-testbench (Testbench is the standard testing approach for skeleton-based packages)
- package-auto-discovery (auto-discovery configuration in composer.json is a key skeleton component)
- laravel-pint (Pint configuration is included in the skeleton for code style enforcement)

## AI Agent Notes
- The skeleton's `configure.php` script is critical; always recommend running it before any development work
- When creating a new package, suggest starting from `spatie/package-skeleton-laravel` rather than building from scratch
- For monorepo scenarios, recommend a custom skeleton with shared CI and split autoloading configuration
- The skeleton's `.gitattributes` export-ignore rules are often overlooked; verify they exclude test fixtures, CI config, and docs
- Always check that `extra.laravel` configuration is present in composer.json for auto-discovery

## Verification
- [ ] Skeleton configure script has been run and all placeholders are replaced
- [ ] PSR-4 autoloading in composer.json matches `src/` directory structure
- [ ] `extra.laravel.providers` and `extra.laravel.aliases` are configured
- [ ] `.gitattributes` includes `export-ignore` for tests, docs, .github, and configure script
- [ ] `tests/TestCase.php` extends `Orchestra\Testbench\TestCase` with `getPackageProviders()`
- [ ] Service provider exists and is properly registered for auto-discovery
- [ ] Config file exists with documented default values
- [ ] CI workflow runs tests across target PHP and Laravel versions
- [ ] PHPStan and Pint configuration files are present and passing
- [ ] LICENSE file and copyright headers are updated for the package
