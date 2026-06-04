# Experience Curation: Package Versioning & Semantic Versioning

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-versioning-semantic-versioning
- **Maturity:** Mature
- **Related Technologies:** Composer, SemVer, Git Tags, Composer Version Constraints
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Semantic Versioning (SemVer) for Laravel packages follows the MAJOR.MINOR.PATCH convention where MAJOR increments for breaking changes, MINOR for backward-compatible features, and PATCH for backward-compatible bug fixes. For Laravel packages specifically, versioning extends beyond the package's own API to include compatibility with Laravel and PHP versions. The Laravel ecosystem has established conventions for version alignment and version constraint best practices in `composer.json`. Proper versioning enables Composer's dependency resolution to safely manage updates across thousands of interdependent packages.

## Core Concepts
- **MAJOR.MINOR.PATCH:** `1.4.2` = MAJOR 1 (breaking changes), MINOR 4 (new features, backward compatible), PATCH 2 (bug fixes, backward compatible)
- **Pre-release Tags:** `-alpha.1`, `-beta.2`, `-rc.1` appended to version for unstable releases; Composer gives pre-releases lower priority than stable releases
- **Version Constraints:** `^1.2` (>=1.2.0, <2.0.0), `~1.2.3` (>=1.2.3, <1.3.0), `1.*` (>=1.0.0, <2.0.0)
- **Dev Stability:** `dev-master`, `dev-feature-branch` for development versions; require `minimum-stability: dev` in composer.json
- **SemVer as a Contract:** Each version number communicates the scope of change; MAJOR bump means "read the changelog, your code may break"; PATCH means "safe to update"
- **Version as a Promise:** Publishing a version is a promise that the package API won't change incompatibly within the same MAJOR version scope

## When To Use
- Every package distributed via Packagist or a private registry (always required)
- Packages consumed by other packages (SemVer enables safe dependency resolution)
- Packages with public API that other code depends on
- Any package where consumers need to understand the impact of updating

## When NOT To Use
- Internal projects with no external consumers (simpler versioning may suffice)
- Packages still in heavy development before 1.0.0 (0.x allows breaking changes without MAJOR bumps)
- Single-use utility code that's not distributed as a package

## Best Practices
- **WHY:** Follow strict SemVer discipline; breaking changes in MINOR/PATCH versions silently break consumer code and erode trust in the package
- **WHY:** Always use version constraints in `composer.json` to declare Laravel and PHP compatibility; without explicit constraints, consumers may install incompatible versions
- **WHY:** Create a Git tag for every release (`git tag v1.2.3`); without tags, Composer cannot resolve the version and `composer install` uses stale versions
- **WHY:** Use a changelog-driven approach; before each release, update `CHANGELOG.md` with the planned version number and list of changes, letting the changelog content determine the version number
- **WHY:** Deprecate APIs for one full MAJOR cycle before removal; mark deprecated methods with `@deprecated` annotations and trigger deprecation warnings in MINOR versions, then remove in the next MAJOR version

## Architecture Guidelines
- **Laravel Version Alignment:** When the package requires a specific Laravel major version, use version constraints (`"require": {"laravel/framework": "^11.0"}`) and consider aligning the package's MAJOR version with Laravel's MAJOR
- **Dependency Bumping Pattern:** When updating a dependency that changes its own MAJOR version, evaluate whether the package needs a MAJOR bump (breaking API change) or just MINOR/PATCH (internal adaptation only)
- **LTS Alignment Pattern:** Align version support with Laravel's LTS releases; tag LTS-compatible versions and continue backporting security fixes
- **Changelog-Driven Versioning:** Update CHANGELOG.md before each release; version number emerges from changelog content rather than being arbitrary
- **Major Version Preparation:** Before releasing a MAJOR version: deprecate APIs in MINOR versions with `@deprecated` annotations, provide migration guides, and maintain a MAJOR version branch for backports
- **Tag Convention:** Use `v` prefix for Git tags (e.g., `v1.2.3`); Composer strips the prefix and parses the SemVer string

## Performance
- Broad version constraints (`*`, `>=1.0`) slow Composer's dependency resolution because it must evaluate more version combinations; specific constraints (`^1.2 || ^2.0`) resolve faster
- Each version tag adds metadata to the repository; thousands of tags can slow Git operations
- Pre-built distribution archives significantly reduce installation time compared to Git source cloning; configure Satis or Packagist to generate archives
- Composer 2.x significantly improved dependency resolution performance over 1.x

## Security
- For security vulnerabilities, release a PATCH version with only the security fix; mention the security nature in release notes but delay detailed disclosure per responsible disclosure practices (typically 30-90 days)
- Mark versions as "abandoned" (YANK) on Packagist if a released version has a critical security or functionality issue; existing installs continue working but new installs are prevented
- Use `composer audit` to check for known security vulnerabilities in package dependencies
- Document security reporting process in SECURITY.md and include in release notes
- For emergency security releases, minimize changes to only the security fix; avoid including feature changes that complicate adoption

## Common Mistakes

### Breaking changes in minor/patch versions
- **Description:** Adding required parameters, changing method signatures, or removing public methods in MINOR/PATCH versions
- **Consequence:** Consumer code breaks silently on update; package loses trust and consumers pin to exact versions
- **Better Approach:** Breaking changes require a MAJOR version bump; deprecate for one full MAJOR cycle before removing

### Not specifying Laravel version constraints
- **Description:** Package works with Laravel 11 but doesn't constrain `"laravel/framework"` in composer.json
- **Consequence:** Composer may install the package with Laravel 12, where it breaks; consumer gets confusing errors
- **Better Approach:** Always specify the Laravel version constraint in `composer.json` `require` section

### Forgetting to tag releases
- **Description:** Code changes are committed but no Git tag exists for the version
- **Consequence:** Composer cannot resolve the version; `composer install` uses stale or wrong versions
- **Better Approach:** Create a Git tag for every release; automate tagging in CI/CD pipeline

### Misusing ^ and ~ constraints
- **Description:** Using `^0.3` expecting it to mean "compatible with 0.3 and above"
- **Consequence:** Composer resolves `^0.3` as `<0.4`, not `<1.0`; pre-1.0 SemVer behavior differs from post-1.0
- **Better Approach:** Understand that for 0.x versions, `^` means "within the same minor version"; use explicit constraints for pre-1.0 packages

### Not committing composer.lock for packages
- **Description:** Ignoring `composer.lock` in the package's repository
- **Consequence:** CI can use different dependency versions than local development; inconsistent test results
- **Better Approach:** Commit `composer.lock` for packages to ensure consistent development and CI environments

## Anti-Patterns
- **SemVer as marketing:** Using MAJOR version numbers as "market position" indicators rather than reflecting breaking changes
- **Major version churn:** Releasing MAJOR versions every month for minor changes; consumers stop updating
- **No version constraints:** Omitting `composer.json` constraints for PHP or Laravel versions; packages get installed on incompatible platforms
- **Silent breaking changes:** Changing public API without MAJOR bump because "no one is using that method"
- **Version tag drift:** Git tag pointing to a different commit than the actual release; consumers download wrong code

## Examples
- **Laravel Framework:** Strict SemVer with yearly MAJOR releases (11, 12, etc.), MINOR for features, PATCH for bug/security fixes
- **Spatie Packages:** Follow SemVer strictly with clear changelog-driven versioning; deprecation cycles span one MAJOR version
- **Composer Itself:** Demonstrates proper pre-release tagging (alpha, beta, RC) and stable release discipline
- **Dependabot/Renovate:** Automated dependency update tools that respect SemVer; safe updates applied automatically, MAJOR updates require PR review

## Related Topics
- private-packagist-satis-setup (private registries use versions for package resolution)
- package-skeleton-structure (skeleton includes composer.json with version constraints)
- dependency-update-automation (automated version management with Dependabot/Renovate)
- monorepo-management (versioning multiple packages together requires coordination)
- composer-basics (version constraint syntax and resolution)

## AI Agent Notes
- SemVer discipline is critical for package maintainers; breaking changes in MINOR/PATCH are the most common complaint in the Laravel package ecosystem
- The `^` constraint behavior with pre-1.0 versions is widely misunderstood; always clarify this when discussing versioning
- For new packages, recommend staying in 0.x until the public API stabilizes; the jump to 1.0.0 is a commitment to SemVer discipline
- Composer 2.x resolution improvements make SemVer-aware dependency management more practical than ever
- For organizational packages, establish a versioning policy that includes deprecation period, changelog requirements, and release cadence

## Verification
- [ ] `composer.json` has explicit version constraints for PHP and Laravel
- [ ] Git tags are created for every release (`git tag v1.2.3`)
- [ ] Breaking changes are only introduced in MAJOR version bumps
- [ ] Deprecated APIs have `@deprecated` annotations and trigger warnings
- [ ] `CHANGELOG.md` is updated before each release with version number and changes
- [ ] Pre-release versions use proper tags (`-alpha`, `-beta`, `-rc`)
- [ ] Version constraints use `^` or `~` correctly for the package's stability level
- [ ] `composer.lock` is committed for consistent development environments
- [ ] Security releases are clearly marked and follow responsible disclosure
- [ ] Migration guide is provided for MAJOR version upgrades
