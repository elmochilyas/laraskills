# Skill: Scaffold a Laravel Package from the Standard Skeleton

## Purpose
Create a new Laravel package using the `spatie/package-skeleton-laravel` as the starting point, ensuring the package follows community conventions and includes all necessary tooling (CI, testing, code quality).

## When To Use
- Creating a new standalone Laravel package for distribution or internal use
- Starting a package that will be distributed via Packagist or private Packagist
- Establishing consistent package structure across an organization

## When NOT To Use
- Adding a simple trait or helper to an existing project (use a namespace directory instead)
- Building a monorepo with multiple packages (needs custom monorepo skeleton)
- Package that wraps a simple third-party service (adapt the skeleton)

## Prerequisites
- Composer installed globally
- PHP 8.0+ installed
- Git configured
- GitHub account (for forking/creating repository)

## Inputs
- Vendor name (organization prefix)
- Package name
- PHP namespace
- Package description
- Target Laravel version

## Workflow (numbered)
1. **Clone the skeleton** — `git clone git@github.com:spatie/package-skeleton-laravel.git your-package-name`
2. **Run configure script** — `php ./configure.php`; enter vendor name, package name, namespace, description when prompted
3. **Verify replacements** — Check `composer.json`, `src/PackageServiceProvider.php`, and `config/` for correct namespace and placeholder values
4. **Set up `.gitattributes`** — Verify `export-ignore` excludes tests, docs, `.github`, and configure script from distribution
5. **Configure `extra.laravel`** — Ensure `composer.json` has `extra.laravel.providers` and `extra.laravel.aliases` for auto-discovery
6. **Initialize git** — `git init` and create initial commit
7. **Run CI validation** — Push to GitHub and verify CI workflow passes for all target PHP/Laravel versions
8. **Create package content** — Start building package logic in `src/` with test coverage in `tests/` mirroring the structure

## Validation Checklist
- [ ] Configure script run and all placeholders replaced
- [ ] PSR-4 autoloading in composer.json matches `src/` directory structure
- [ ] `extra.laravel.providers` and `extra.laravel.aliases` configured
- [ ] `.gitattributes` includes `export-ignore` for non-essential files
- [ ] `tests/TestCase.php` extends `Orchestra\Testbench\TestCase` with `getPackageProviders()`
- [ ] Service provider exists in `src/` with package registration logic
- [ ] Config file exists at `config/package-name.php` with documented defaults
- [ ] CI workflow passes on initial push
- [ ] PHPStan and Pint configuration present and passing

## Common Failures
- **Not running configure script** — placeholder text in composer.json breaks autoloading
- **Missing extra.laravel configuration** — package requires manual provider registration
- **PSR-4 misconfiguration** — namespace mapping mismatch causes "class not found" errors
- **Ignoring Testbench setup** — missing integration test coverage for provider registration
- **Packaging skeleton files** — `.gitattributes` missing `export-ignore` for configure script and CI config

## Decision Points
- Fork vs clone: fork if you plan to contribute upstream improvements; clone for most internal packages
- Minimal vs opinionated: start with the standard skeleton; customize for org standards (namespace prefix, CI template) after first project
- Single package vs monorepo: standard skeleton for single packages; custom monorepo structure for multi-package repos

## Performance/Security Considerations
- Dev dependencies don't affect production; prune unused dev dependencies
- Testbench boots a full Laravel app per test class (~100-200ms); use caching for test speed
- Never include secrets, API keys, or credentials in skeleton defaults
- Include a SECURITY.md template for vulnerability reporting
- Tighten PHP/Laravel version constraints from skeleton defaults based on actual compatibility

## Related Rules (from 05-rules.md)
- SKELETON-RULE-001: Start from spatie/package-skeleton-laravel
- SKELETON-RULE-002: Run configure script immediately
- SKELETON-RULE-003: Maintain .gitattributes
- SKELETON-RULE-005: Include auto-discovery
- SKELETON-RULE-010: Not running configure script (most common mistake)

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- Test Laravel Packages with Orchestra Testbench
- Publish a Laravel Package to Packagist

## Success Criteria
- Package skeleton created with all placeholders replaced and CI passing
- Package autoloads correctly via Composer PSR-4 mapping
- Service provider auto-discovers when installed in a Laravel application
- All tests pass across target PHP and Laravel versions in CI
- Package published via Packagist or private Packagist within 1 hour of starting

---

# Skill: Maintain a Living Package Skeleton Standard

## Purpose
Establish a process for keeping the organization's package skeleton up to date with upstream changes, Laravel version releases, and evolving best practices.

## When To Use
- Organization maintains 5+ internal packages using the skeleton
- Team wants consistent updates across all internal packages when tooling changes
- Skeleton is forked and customized with org-specific defaults

## When NOT To Use
- Single package with simple requirements
- No organizational standard for package structure

## Prerequisites
- Fork of `spatie/package-skeleton-laravel` in organization GitHub
- CI pipeline for the skeleton repository
- Template update script or process

## Inputs
- Upstream skeleton changes (new CI workflows, tooling versions, best practices)
- Organization-specific requirements (namespace prefix, CI template, code review checklist)
- Laravel version release schedule

## Workflow (numbered)
1. **Fork upstream skeleton** — Create organization fork with custom namespace prefix, CI template, and code quality config
2. **Track upstream** — Configure GitHub upstream remote; periodically merge upstream changes
3. **Update org defaults** — After each Laravel version release, update skeleton defaults within 2 weeks
4. **Test skeleton** — CI validates all skeleton templates produce working packages
5. **Communicate changes** — Notify internal package maintainers of skeleton updates; provide migration guide for existing packages
6. **Version skeleton** — Tag skeleton releases; track which skeleton version each package was created from

## Validation Checklist
- [ ] Skeleton fork exists in organization GitHub with CI passing
- [ ] Upstream changes merged and tested within 4 weeks of release
- [ ] Skeleton updated within 2 weeks of Laravel version releases
- [ ] Notification sent to package maintainers for significant skeleton changes
- [ ] Skeleton version documented in generated package metadata

## Common Failures
- **Frozen skeleton** — not updated for 12+ months; generates packages with outdated tooling
- **Over-customization** — too many org-specific changes make upstream merging painful
- **No notification** — package maintainers don't know when skeleton standards change

## Decision Points
- Customization depth: minimal (just namespace and CI) vs opinionated (full org architecture patterns)
- Update frequency: per Laravel release vs quarterly vs on-demand
- Notification channel: internal mailing list, Slack, GitHub issue template

## Performance/Security Considerations
- Skeleton should enforce secure defaults: no credentials, dependency scanning, vulnerability reporting
- Maintain `.gitattributes` export rules in the fork; don't lose them in customization
- Upstream security patches should be merged within 1 week

## Related Rules (from 05-rules.md)
- SKELETON-RULE-015: Avoid over-customizing skeleton before first package
- SKELETON-RULE-001: Start from spatie/package-skeleton-laravel

## Related Skills
- Scaffold a Laravel Package from the Standard Skeleton
- Set Up a Package Service Provider with Spatie Tools

## Success Criteria
- Skeleton fork exists and is actively maintained
- Update latency: < 2 weeks for Laravel version releases, < 4 weeks for upstream changes
- All internal packages use skeleton version >= minimum required version
- Zero packages with outdated CI or tooling configurations
