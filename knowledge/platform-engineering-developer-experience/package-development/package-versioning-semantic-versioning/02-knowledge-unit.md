# Knowledge Unit: Package Versioning & Semantic Versioning

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-versioning-semantic-versioning
- **Maturity:** Mature
- **Related Technologies:** Composer, SemVer, Git Tags, Composer Version Constraints

## Executive Summary

Semantic Versioning (SemVer) for Laravel packages follows the MAJOR.MINOR.PATCH convention where MAJOR increments for breaking changes, MINOR for backward-compatible features, and PATCH for backward-compatible bug fixes. For Laravel packages specifically, versioning extends beyond the package's own API to include compatibility with Laravel and PHP versions. The Laravel ecosystem has established conventions for version alignment (e.g., `1.x` for Laravel 11 compatible, `2.x` for Laravel 12 compatible) and version constraint best practices in `composer.json`. Proper versioning enables Composer's dependency resolution to safely manage updates across thousands of interdependent packages.

## Core Concepts

- **MAJOR.MINOR.PATCH:** `1.4.2` = MAJOR 1 (breaking changes), MINOR 4 (new features, backward compatible), PATCH 2 (bug fixes, backward compatible)
- **Pre-release Tags:** `-alpha.1`, `-beta.2`, `-rc.1` appended to version for unstable releases; Composer gives pre-releases lower priority than stable releases
- **Version Constraints:** `^1.2` (>=1.2.0, <2.0.0), `~1.2.3` (>=1.2.3, <1.3.0), `1.*` (>=1.0.0, <2.0.0), `>=1.0` with explicit lower and upper bounds
- **Dev Stability:** `dev-master`, `dev-feature-branch` for development versions; require `minimum-stability: dev` or `@dev` constraint suffix in composer.json

## Mental Models

- **SemVer as a Contract:** Each version number communicates the scope of change to consumers; MAJOR bump means "read the changelog, your code may break"; PATCH means "safe to update"
- **Version as a Promise:** Publishing a version is a promise that the package API won't change incompatibly within the same MAJOR version scope
- **The 1.0.0 Barrier:** Before 1.0.0 (0.x), anything can change at any time; reaching 1.0.0 signals API stability and commitment to SemVer discipline
- **Constraint as a Safety Net:** Version constraints in `composer.json` define the allowable version range; `^` says "compatible with this version and any future version within the same major"

## Internal Mechanics

1. **Git Tag Versioning:** Each version is a Git tag prefixed with `v` (e.g., `v1.2.3`); Composer reads tags from the repository, strips the `v` prefix, and parses the SemVer string.
2. **Composer Version Resolution:** `composer install/update` reads constraints from `composer.json`, queries repositories for available versions, and solves the dependency graph to find a mutually compatible set of versions.
3. **Version Comparison:** Composer uses PHP's `version_compare()` with custom logic for stability modifiers; stable > RC > beta > alpha > dev.
4. **Lock File:** `composer.lock` records the exact version of every installed package; `composer install` reads from lock file, `composer update` recomputes dependencies within constraint boundaries.
5. **Tagged vs Branch Aliases:** `dev-master` can be aliased to a version (e.g., `1.x-dev`) in `composer.json` `extra.branch-alias` for development workflow compatibility.

## Patterns

- **Laravel Version Alignment:** When the package requires a specific Laravel major version, use the version constraint in composer.json (`"require": {"laravel/framework": "^11.0"}`) and consider aligning the package's MAJOR version with Laravel's MAJOR.
- **Dependency Bumping Pattern:** When updating a dependency that changes its own MAJOR version, evaluate whether the package itself needs a MAJOR bump (breaking change in public API) or just a MINOR/PATCH (internal adaptation only).
- **LTS Alignment Pattern:** For packages with long-term support promises, align version support with Laravel's LTS releases (currently 11); tag LTS-compatible versions and continue backporting security fixes.
- **Changelog-Driven Versioning:** Before each release, update `CHANGELOG.md` with the planned version number and list of changes; the version number should emerge from the changelog content rather than being arbitrary.
- **Major Version Preparation:** Before releasing a MAJOR version: deprecate APIs in MINOR versions with `@deprecated` annotations and trigger deprecation warnings, provide migration guides, and maintain a MAJOR version branch for backports.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Version alignment | Independent versioning vs aligned with Laravel | Independent for general packages; aligned for Laravel-bridge packages |
| Pre-release strategy | Semantic pre-releases vs beta channels | RC pre-releases for broad testing; alpha for internal testing only |
| Backport policy | Backport to all MAJOR versions vs latest only | Security backports to latest MAJOR only; LTS backports to LTS branch |
| Deprecation period | One MINOR cycle vs one MAJOR cycle | One full MAJOR cycle: deprecate in MINOR, remove in next MAJOR |

## Tradeoffs

- **Independent vs Laravel-Aligned Versioning:** Independent versioning gives flexibility (can release MAJOR bumps for non-Laravel reasons) but makes it harder for users to infer Laravel compatibility from version numbers. Laravel-aligned versioning simplifies compatibility but forces version bumps when you might not want them.
- **Strict vs Loose Constraints:** `^1.2` allows automatic minor/patch updates, keeping packages current but risking unforeseen issues. `"1.2.*"` prevents minor updates, providing stability but requiring manual update intervention.
- **Frequent Releases vs Stability:** Frequent releases (weekly) keep users on latest changes but create update fatigue. Infrequent releases (quarterly) are less disruptive but users wait longer for fixes.
- **Major Version Frequency:** Frequent MAJOR versions (yearly) are disruptive but keep the codebase modern. Infrequent MAJOR versions (multi-year) are less disruptive but accumulate significant breaking changes for each upgrade.

## Performance Considerations

- **Composer Resolution Time:** Broad version constraints (`*`, `>=1.0`) slow Composer's dependency resolution because it must evaluate more version combinations. Specific constraints (`^1.2 || ^2.0`) resolve faster.
- **Version Metadata Impact:** Each version tag adds metadata to the repository; thousands of version tags can slow Git operations. Use `git tag` wisely and clean up unnecessary tags.
- **Archive Caching:** Pre-built distribution archives (zip/tgz) for each version significantly reduce installation time compared to Git source cloning. Configure Satis or Packagist to generate archives.

## Production Considerations

- **Security Releases:** For security vulnerabilities, release a PATCH version with only the security fix; mention the security nature in the release notes but delay detailed disclosure per responsible disclosure practices (typically 30-90 days).
- **Emergency Version Patching:** For production-critical bugs, release a PATCH version ASAP but consider YANK (mark version as abandoned on Packagist) if a released version has a critical issue.
- **Version YANK:** Composer supports marking versions as "abandoned" to prevent new installations; existing installs continue working. Use sparingly for versions with critical security or functionality issues.
- **Update Migration:** When updating a package in a production application, test in a staging environment before deploying; `composer update --dry-run` shows the changes without applying them.

## Common Mistakes

- **Breaking changes in minor/patch versions:** The most common SemVer violation; adding required parameters, changing method signatures, or removing public methods in MINOR/PATCH breaks consumer code silently
- **Not specifying Laravel version constraints:** A package that works with Laravel 11 may not work with Laravel 12; explicitly constrain `"laravel/framework"` in require
- **Forgetting to tag releases:** Code changes are in the repository but no Git tag exists; Composer cannot resolve the version and `composer install` uses stale versions
- **Misusing ^ and ~ constraints:** `^` means "compatible with", which for pre-1.0 versions (0.x) means `^0.3` resolves to `<0.4`, not `<1.0`; many developers misunderstand this behavior
- **Not committing composer.lock:** For packages, `composer.lock` should be committed to ensure CI uses exact development dependencies; for applications, `composer.lock` is always committed

## Failure Modes

- **Dependency Hell:** Two packages require incompatible versions of a shared dependency. Mitigate: use `composer why <package>` to trace the conflicting dependency chain; consider requiring a mutually compatible version.
- **Split Brain in Constraints:** Composer resolves to a version that satisfies all constraints but is older than expected. Mitigate: `composer update --with-all-dependencies` forces a deeper update; also verify constraint syntax.
- **Version Tagging Error:** A Git tag points to the wrong commit or is missing. Mitigate: use annotated tags (`git tag -a`) with commit hash verification; CI can enforce tag correctness.
- **Accidental MAJOR Bump:** A dependency changes its MAJOR version, and the package must bump MAJOR even though no direct API changes were made. Mitigate: use `provide` to declare independent API, or bump MAJOR to reflect the compatibility change.

## Ecosystem Usage

- **Composer SemVer Implementation:** Composer's versioning logic implements the full SemVer spec with extensions for stability and pre-release handling
- **Packagist Version Display:** Packagist.org shows all versions with Dependents count and download statistics, helping package authors understand usage patterns
- **Dependabot/Renovate:** Automated dependency update tools that respect SemVer—safe updates (PATCH/MINOR) applied automatically, MAJOR updates require PR review
- **Laravel Shift:** Automates Laravel version upgrades using codemods and version-aware transformations; illustrates mature upgrade automation in the Laravel ecosystem

## Related Knowledge Units

- private-packagist-satis-setup
- package-skeleton-structure
- dependency-update-automation
- monorepo-management

## Research Notes

- Laravel's own release cadence (yearly MAJOR versions each February, two years of bug fixes, three years of security fixes) sets the pace for the package ecosystem
- The PHP ecosystem adopted SemVer later than some other languages (JavaScript, Rust); Laravel's advocacy for SemVer in package development has accelerated adoption
- Composer 2.x significantly improved dependency resolution performance, making SemVer-compliance more practical for complex dependency graphs
- The trend in 2024-2025 is toward automatic dependency updates (Dependabot, Renovate) with SemVer-aware automation, reducing manual version management burden
- The concept of "SemVer twin" (bumping MAJOR for both public API changes and Laravel version requirement changes) is a debated practice in the Laravel community
