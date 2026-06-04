# Experience Curation: Dependency Management Across Monorepo

## Metadata
- **KU ID:** monorepo-management/dependency-management-across-monorepo
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** composer-path-repository-usage, monorepo-ci-optimization, shared-library-extraction-patterns
- **Related Technologies:** Composer, Laravel, SemVer, symplify/monorepo-split
- **Target Audience:** Laravel developers, monorepo managers, platform engineers

## Overview

Dependency management in a Laravel monorepo involves ensuring all packages within the monorepo use compatible versions of shared dependencies (Laravel framework, common libraries), that inter-package dependencies are resolved locally during development, and that the root `composer.lock` reflects a consistent dependency state. The core challenge is Composer's lack of native workspace support (unlike npm workspaces), requiring manual coordination of dependency versions across packages. Best practices include: a root `composer.json` that requires all packages' dependencies at compatible versions, path repositories for inter-package links, and CI validation of cross-package dependency consistency.

## Core Concepts

- **Dependency Synchronization:** Ensuring all packages use the same version constraint for shared dependencies (e.g., all require `laravel/framework ^11.0`)
- **Inter-Package Dependencies:** One monorepo package requiring another; resolved via path repository locally and via Packagist in production
- **Root Dependency Consolidation:** The root `composer.json` requires all dependencies needed by any package, enabling a single `composer install` at root level
- **Version Constraint Alignment:** All packages must agree on shared dependency versions; incompatible requirements prevent coexistence in the same monorepo
- **Single Version Policy:** Enforcing one version of each shared dependency across all packages for consistency
- **Root Package as Meta-Package:** The monorepo root depends on all sub-packages, acting as an umbrella for consistent dependency resolution

## When To Use

- Monorepo with 2+ packages sharing dependencies (Laravel framework, common libraries)
- Team wants consistent dependency resolution across all packages
- Need to ensure package combinations are always compatible
- CI should validate cross-package dependency consistency
- Organization wants to prevent "works on my machine" issues from independently versioned packages

## When NOT To Use

- Packages have fundamentally incompatible dependency requirements (different Laravel versions)
- Monorepo has a single package with no shared dependencies
- Packages need to evolve dependency versions independently
- Organization prefers per-package lock files and independent CI resolution
- Monorepo is simply a collection of unrelated packages (not sharing dependencies)

## Best Practices (WHY)

1. **Enforce Single Version Policy for Core Dependencies (Why):** For shared dependencies like Laravel framework and PHP version, enforce a single version across all monorepo packages. Incompatible versions (Package A uses Laravel 10, Package B uses Laravel 11) prevent them from coexisting. Document approved versions in a central `VERSIONS.md`.

2. **Commit the Root composer.lock (Why):** The root lock file ensures reproducible builds across all developer machines and CI environments. Without it, different machines may resolve different dependency versions, leading to "works on my machine" issues.

3. **Automate Version Bumps Across Packages (Why):** When updating a shared dependency (e.g., `laravel/framework` from `^10.0` to `^11.0`), update the version constraint in all packages simultaneously. Manual per-package updates risk missing some packages, creating inconsistent states that only surface at the next root install.

4. **CI-Validate Dependency Consistency (Why):** In CI, validate: all packages use consistent versions of shared dependencies, no circular dependencies exist, and the lock file is current with all `composer.json` files. Catch inconsistencies before they reach production.

5. **Document Major Dependency Decisions (Why):** Use Architecture Decision Records (ADRs) for major dependency version decisions. When a package needs a different version of a shared dependency, the ADR explains the rationale and impact. This prevents "why did we use this version" questions later.

## Architecture Guidelines

- **Root composer.json:** Requires all packages' dependencies at compatible versions. Uses `replace` for local packages. Defines path repositories.
- **Version Alignment:** Single version for framework/PHP. Per-package versions for minor libraries with unrelated purposes.
- **Dependency Update Process:** Automated PRs (Renovate/Dependabot) with monorepo-aware configuration that updates all packages simultaneously.
- **Conflict Resolution:** When a dependency version conflict arises, upgrade all packages to a compatible version. Use `replace` or alias only as a last resort.
- **Lock File Strategy:** Single root `composer.lock` committed to version control. Per-package lock files in split repositories.
- **CI Validation:** Run `composer validate` and `composer install --locked` to ensure consistency. Audit all packages' composer.json for version alignment.

## Performance

- **Composer Resolution Time:** Monorepo with 20 packages and 100+ dependencies: 30-60 seconds for initial resolution.
- **Lock File Size:** 2-5x larger than single-package lock file. Affects git operations slightly.
- **Dependency Update Duration:** Full re-resolution on shared dependency updates: 2-5 minutes.
- **Use `composer why-depends`:** Before updating a shared dependency, run from root to see which packages and dependencies would be affected.

## Security

- **Centralized Scanning:** One `composer.lock` scan covers all packages. Security vulnerability in a shared dependency is detected once and patched for all.
- **License Compliance:** Validate licenses of all dependencies across all packages at once from the root.
- **Dependency Audit:** Run `composer audit` at root level to check for known vulnerabilities across all packages.
- **Consistent Patching:** Patch a vulnerability once in the root lock file; all packages benefit from the updated dependency.

## Common Mistakes

### Mistake 1: Inconsistent Dependency Versions
- **Description:** Package A requires `^10.0` of a library, Package B requires `^11.0`
- **Cause:** Independent package updates without cross-package coordination
- **Consequence:** Root `composer install` fails with version conflict
- **Better:** Enforce single version policy. Update all packages simultaneously.

### Mistake 2: Not Committing Root composer.lock
- **Description:** composer.lock in .gitignore because "path repos break it"
- **Cause:** Misunderstanding of lock file role in monorepo
- **Consequence:** Inconsistent dependency resolution across machines
- **Better:** Commit root composer.lock. Use separate CI job for remote resolution validation.

### Mistake 3: Circular Inter-Package Dependencies
- **Description:** Package A depends on Package B, which depends on Package A
- **Cause:** Poor package boundary design
- **Consequence:** Composer cannot resolve the circular dependency
- **Better:** Enforce acyclic dependency graph. CI validates no circular dependencies.

### Mistake 4: Version Ranges Too Broad
- **Description:** Using `*` or `>=` as version constraint
- **Cause:** Convenience, not specifying exact compatibility
- **Consequence:** Different environments resolve different versions
- **Better:** Use `^` or `~` for predictable version resolution

## Anti-Patterns

- **The Version Free-for-All:** Each package uses whatever dependency version it wants. Root install constantly fails. Enforce single version policy.
- **The Frozen Lock File:** `composer.lock` is never updated. Dependencies accumulate security vulnerabilities because the lock file is considered "too hard" to update.
- **The Ignored Conflict:** A dependency conflict is resolved by removing the conflicting package from the monorepo rather than aligning versions. This fragments the codebase.
- **The Manual Bump:** Engineer manually updates version constraints in 12 packages, misses 2, and the monorepo breaks. Automate version bumps.

## Examples

### Example 1: Consistent Version Policy
```json
// VERSIONS.md
| Dependency | Approved Version | Notes |
|-----------|-----------------|-------|
| php | ^8.3 | All packages must support 8.3 |
| laravel/framework | ^11.0 | All packages track latest Laravel |
| spatie/laravel-package-tools | ^1.16 | Latest stable |
| orchestra/testbench | ^9.0 | Matches Laravel 11 |
```

### Example 2: CI Dependency Audit
```yaml
name: Dependency Audit
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
      - run: composer validate
      - run: composer install --locked
      - run: composer audit  # Security advisory check
      # Custom script: verify version alignment across packages
      - run: php scripts/audit-dependency-versions.php
```

## Related Topics

- **composer-path-repository-usage:** Path repos for inter-package resolution
- **monorepo-ci-optimization:** CI strategies for dependency validation
- **shared-library-extraction-patterns:** Managing extracted package dependencies
- **dependency-update-automation:** Automated dependency updates with Renovate/Dependabot

## AI Agent Notes

- **Context Requirements:** When advising on monorepo dependency management, first determine the number of packages, shared dependencies, version alignment strategy, and CI validation approach. Composer's lack of workspace support is the primary constraint.
- **Key Decision Points:** Single vs multiple version policy, root lock vs per-package locks, automated vs manual dependency updates, conflict resolution strategy.
- **Common Pitfalls in AI Assist:** Don't recommend allowing version drift across packages. Always enforce lock file commitment. Remember Composer doesn't have native workspace support—acknowledge this limitation.
- **Laravel-Specific Nuances:** Composer's lack of workspace support is the most cited pain point. The `replace` feature is underutilized for monorepo dependency management. Single-version policy is the most common approach in successful Laravel monorepos.

## Verification

- [ ] KU accurately defines monorepo dependency management challenges
- [ ] Core concepts cover synchronization, alignment, consolidation
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize single version policy and lock files
- [ ] Architecture guidelines cover root composer.json and CI validation
- [ ] Performance addresses resolution time and lock file size
- [ ] Security covers centralized scanning and consistent patching
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify version free-for-all and frozen lock file
- [ ] Examples show version policy and CI audit workflow
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes address Composer-specific challenges
