# Knowledge Unit: Package Skeleton Structure

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-skeleton-structure
- **Maturity:** Mature
- **Related Technologies:** Spatie Package Skeleton, Composer, PHP, Laravel, Orchestra Testbench

## Executive Summary

A Laravel package skeleton provides the canonical directory structure, configuration files, and development tooling for creating a new package. The de facto standard is `spatie/package-skeleton-laravel`, which includes: PSR-4 autoloading configuration, GitHub Actions CI, PHP-CS-Fixer/Pint configuration, PHPStan configuration, Orchetra Testbench integration, and a `composer.json` with dependency boilerplate. The skeleton's structure—`src/`, `config/`, `database/migrations/`, `resources/views/`, `resources/lang/`, `tests/`—mirrors Laravel's own directory conventions, making package development feel consistent with application development.

## Core Concepts

- **PSR-4 Autoloading:** The `src/` directory maps to the package namespace; Composer's PSR-4 autoloading handles class loading without additional configuration
- **Testbench Configuration:** Orchestra Testbench is pre-configured as a dev dependency with a `CreatePackageTest` base class that bootstraps a Laravel application instance for testing
- **GitHub Actions CI:** Pre-configured workflows for running tests across multiple PHP versions (8.0-8.4) and Laravel versions; includes Pint and PHPStan steps
- **ConfigureSkeleton Script:** A CLI script that replaces placeholders (vendor name, package name, namespace, description) with actual values when creating a new package from the skeleton

## Mental Models

- **Skeleton as a Template Generator:** The skeleton is a template repository; running the configure script transforms the template into a specific package project
- **Skeleton as a Checklist:** The skeleton encodes all the files and configuration a well-structured Laravel package needs; it's a checklist in directory form
- **Skeleton as a Standard:** Using the skeleton (or adhering to its conventions) means the package will be immediately understandable to any Laravel developer familiar with Spatie-ecosystem packages
- **Skeleton as a CI Starter:** The pre-configured CI workflows provide immediate quality assurance without manual pipeline setup

## Internal Mechanics

1. **Skeleton Structure:** `src/` (package source code, service providers, commands), `config/` (default configuration), `database/migrations/` (migration files), `resources/views/` (Blade templates), `resources/lang/` (translation files), `tests/` (PHPUnit/Pest tests with Testbench), `docs/` (documentation), `.github/workflows/` (CI configuration).
2. **Configure Script:** Running `php ./configure.php` prompts for vendor name, package name, namespace, description, author, and Laravel version compatibility. It replaces all placeholders in files, renames directories, and deletes the configure script itself.
3. **Composer Configuration:** `composer.json` includes: `require` (laravel/framework, php), `require-dev` (orchestra/testbench, phpunit, phpstan, laravel/pint), `autoload` (PSR-4 mapping), `scripts` (test, lint commands), and `extra.laravel` (auto-discovery configuration).
4. **Testbench Setup:** `tests/TestCase.php` extends `Orchestra\Testbench\TestCase` which boots a full Laravel application; `getPackageProviders()` returns the package's service provider for automatic registration in test environment.

## Patterns

- **Flat Source Structure:** Place all package classes directly in `src/` or use subdirectories for organizational clarity (`src/Commands/`, `src/Models/`, `src/Http/Controllers/`); avoid deep nesting.
- **Config-First Design:** Always include a published config file with sensible defaults; document each configuration option with a comment explaining its purpose and acceptable values.
- **Service Provider in src/:** Place the service provider directly in `src/` (e.g., `src/PackageServiceProvider.php`); it's the single entry point for package registration.
- **Test Directory Mirroring:** Mirror the `src/` directory structure in `tests/`; `src/Commands/MyCommand.php` → `tests/Commands/MyCommandTest.php` for discoverable test organization.
- **Minimal Facades:** Only create facades for classes that are commonly injected or resolved; facades for internal-use classes add unnecessary API surface.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Skeleton base | Spatie skeleton vs custom vs laravel-shift blueprint | Spatie skeleton for most packages; custom for organization-specific conventions |
| Testing framework | PHPUnit vs Pest | Pest for modern packages; PHPUnit for compatibility with existing test suites |
| CI platform | GitHub Actions vs GitLab CI vs CircleCI | GitHub Actions for GitHub-hosted packages; match organization's CI platform |
| Documentation format | Markdown in repo vs dedicated docs site | Markdown in `/docs` directory with README as the index |

## Tradeoffs

- **Spatie Skeleton Weight vs Lightweight:** The Spatie skeleton includes many dev dependencies (pint, phpstan, rector, phpunit, testbench) that may not all be needed. Strip unused dependencies rather than starting from nothing.
- **Convention vs Customization:** Following Spatie conventions makes the package familiar but may not fit unusual package structures (e.g., packages with frontend assets, Inertia components, or database factories).
- **Testbench vs Mocking:** Testbench provides a real Laravel application for integration testing, which is comprehensive but slower than unit tests with mocking. Use both: unit tests for isolated logic, Testbench for integration.
- **Monorepo vs Single Package Skeleton:** The skeleton is designed for standalone packages. For monorepo packages (multiple packages in one repo), a custom structure with shared CI is needed.

## Performance Considerations

- **Dev Dependencies:** Skeleton includes development-only dependencies; these don't affect production installations but increase `composer install` time and disk usage. Prune unused dev dependencies.
- **Testbench Boot Time:** Orchestra Testsbench boots a full Laravel application for each test class; this adds ~100-200ms per test class. Use `setUp()` caching and careful test organization to minimize time.
- **CI Pipeline Duration:** The skeleton's CI workflow runs tests on multiple PHP versions (4-5 versions) × multiple Laravel versions (2-3 versions) = 8-15 parallel jobs. Each job takes 2-5 minutes. Total pipeline time may be limited by CI runner availability.

## Production Considerations

- **Skeleton Maintenance:** The skeleton itself needs updating as Laravel versions, Testbench versions, and tooling evolve. Periodically regenerate the skeleton from the upstream repository to incorporate improvements.
- **Security Policy:** Include a SECURITY.md template that describes how to report security vulnerabilities; follow Laravel's security disclosure practices.
- **Version Constraints:** Skeleton defaults to broad PHP and Laravel version constraints; tighten these based on the package's actual compatibility to prevent installation on unsupported versions.
- **License and Copyright:** Include LICENSE file and copyright headers; the skeleton includes an MIT license by default but should be updated to match organizational policy.

## Common Mistakes

- **Not running the configure script:** Using the skeleton without running the configure script leaves placeholder text in composer.json and source files; package won't autoload or publish correctly
- **Ignoring the Testbench setup:** Testing packages without Testbench leads to poor integration test coverage; unit tests alone miss provider registration, routing, and configuration merging issues
- **Composer.json autoloading misconfiguration:** Incorrect PSR-4 namespace mapping in composer.json; package classes aren't autoloaded and tests fail with "class not found"
- **Accidentally packaging skeleton files:** Including the skeleton's configure script, .github directory, or test fixtures in the distributed package; these should be in .gitattributes export-ignore
- **Missing extra.laravel discovery:** Not adding auto-discovery configuration in composer.json; package requires manual provider registration, reducing developer experience

## Failure Modes

- **Skeleton Not Regenerated:** Using the same skeleton for multiple packages without reconfiguring; leftover placeholders or shared namespace cause autoloading conflicts. Mitigate: git clone skeleton fresh for each new package.
- **Testbench Version Mismatch:** Testbench version must match Laravel version; using wrong Testbench version causes boot errors. Mitigate: follow Testbench's version matrix documentation.
- **CI Matrix Explosion:** Testing across too many PHP × Laravel version combinations creates CI bottlenecks (30+ jobs). Mitigate: test against supported LTS versions only; test latest PHP with all Laravel versions, latest Laravel with all PHP versions.
- **Exporting Test Files:** .gitattributes doesn't exclude tests, docs, or CI configuration; production packages include unnecessary files. Mitigate: maintain .gitattributes with export-ignore rules for non-essential directories.

## Ecosystem Usage

- **Spatie Package Skeleton:** The canonical skeleton with 2k+ GitHub stars; used as the starting point for hundreds of packages
- **Laravel Package Template (by Laravel News):** Community-maintained skeleton with alternative conventions (Pest, Rector, Duster)
- **Internal Organization Skeletons:** Many organizations maintain private fork of the skeleton with organization-specific defaults (namespace prefix, CI template, code review checklist)
- **Orchestra Testbench:** The testing companion that makes the skeleton's test setup work; separate package maintained by the same community

## Related Knowledge Units

- spatie-laravel-package-tools
- package-service-provider-patterns
- package-testing-orchestra-testbench
- package-auto-discovery
- laravel-pint

## Research Notes

- Spatie's package skeleton is one of the most-forked repositories in the Laravel ecosystem; its configure.php script has been refined over 5+ years
- The skeleton has evolved from a simple directory structure to include CI workflows, Dependabot configuration, and static analysis tooling as standard features
- Organizations building 5+ internal packages should maintain their own version of the skeleton to encode internal standards (CI template, changelog format, code review requirements)
- The trend toward monorepos is challenging the single-package skeleton model; specialized monorepo package skeletons are emerging to address this need
