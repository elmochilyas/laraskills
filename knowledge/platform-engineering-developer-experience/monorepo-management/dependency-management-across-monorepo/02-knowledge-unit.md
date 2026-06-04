# Knowledge Unit: Dependency Management Across Monorepo

## Metadata
- **Subdomain:** Monorepo Management
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** monorepo-management/dependency-management-across-monorepo
- **Maturity:** Maturing
- **Related Technologies:** Composer, Laravel, SemVer, symplify/monorepo-split

## Executive Summary

Dependency management in a Laravel monorepo involves ensuring that all packages within the monorepo use compatible versions of shared dependencies (Laravel framework, common libraries), that inter-package dependencies (Package A depends on Package B) are resolved locally during development, and that the root `composer.lock` reflects a consistent dependency state. The core challenge is Composer's lack of native workspace support (unlike npm workspaces), requiring manual coordination of dependency versions across packages. Best practices include: a root `composer.json` that requires all packages' dependencies at compatible versions, path repositories for inter-package links, and CI validation of cross-package dependency consistency.

## Core Concepts

- **Dependency Synchronization:** Ensuring all packages in the monorepo that require `laravel/framework` use the same version constraint (e.g., `^11.0`) to prevent version conflicts during root-level `composer install`
- **Inter-Package Dependencies:** When Package A requires Package B (both in the monorepo), the dependency is resolved via path repository during development and via Packagist (or private registry) in production
- **Root Dependency Consolidation:** The monorepo root `composer.json` requires all dependencies needed by any package; this enables a single `composer install` at the root level that resolves all package dependencies consistently
- **Version Constraint Alignment:** All packages must agree on shared dependency versions; if Package A requires `laravel/framework ^11.0` and Package B requires `laravel/framework ^9.0`, they cannot coexist in the same monorepo without splitting

## Mental Models

- **Root Package as Meta-Package:** The monorepo root is a meta-package that depends on all sub-packages; its `composer.json` is the "umbrella" that ensures consistent dependency resolution
- **Dependency Alignment as Negotiation:** Package dependencies must be negotiated across all monorepo members; if one package needs a newer version of a dependency, all packages that share that dependency must agree to the update
- **Path Repos as Development Glue:** Path repositories hold packages together during development; in production, the remote repositories provide the actual packages
- **Lock File as Single Source of Truth:** The monorepo's root `composer.lock` records the exact version of every dependency across all packages, ensuring reproducible builds

## Internal Mechanics

1. **Root Package Resolution:** `composer install` at monorepo root reads the root `composer.json` (which requires all sub-packages via path repositories) and resolves all dependencies into a single `composer.lock` file.
2. **Inter-Package Resolution:** When Package A's `composer.json` requires `my-org/package-b`, the path repository maps this to `packages/package-b/` in the monorepo. The path repository's symlink makes Package B available during development.
3. **Version Constraint Resolution:** Composer solves the full dependency graph from the root. If Package A requires `^11.0` of `laravel/framework` and Package B also requires `^11.0`, Composer resolves to a single compatible version.
4. **Conflict Detection:** If two packages require incompatible versions of the same dependency, `composer install` fails with a version conflict error. This is the monorepo's consistency check.
5. **Split Package Resolution:** After splitting, each package's `composer.json` is evaluated independently; the version constraints must be self-consistent outside the monorepo context.

## Patterns

- **Single Version Policy Pattern:** For shared dependencies (Laravel framework, PHP version, major packages), enforce a single version across all monorepo packages. Document the approved version in a central `VERSIONS.md` file.
- **Dependency Version Matrix Pattern:** Create a `VERSIONS.md` or `composer.json` `conflict` section that documents which versions of external dependencies are compatible with the monorepo. CI validates that all packages comply.
- **Automated Version Bump Pattern:** When updating a shared dependency (e.g., `laravel/framework` from `^10.0` to `^11.0`), use a tool script to update the version constraint in all packages that reference it. This prevents manual oversight.
- **CI Dependency Audit Pattern:** In CI, validate: all packages use consistent dependency versions, no package requires a dependency that conflicts with another package, and the lock file is up to date with all `composer.json` files.
- **Dependency as Decision Record Pattern:** Document major dependency version decisions in Architecture Decision Records (ADRs). When a package needs a newer version of a shared dependency, the ADR explains the rationale and impact.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Version alignment approach | Single version for all vs per-package versions | Single version for framework/PHP; per-package for minor libraries |
| Root composer.json strategy | Require all deps vs require only sub-packages | Require all deps for CI speed; sub-packages only for release validation |
| Dependency update process | Manual PRs vs automated (Renovate/Dependabot) | Automated PRs with monorepo-aware configuration (update all packages simultaneously) |
| Conflict resolution strategy | Bump all packages vs fork/alias | Bump all packages when possible; use conflict/alias only as last resort |

## Tradeoffs

- **Single Version vs Multiple Versions:** Enforcing a single version of shared dependencies simplifies the monorepo but prevents individual packages from evolving at different paces. Allowing multiple versions (via Composer's ability to install different versions for different packages) is technically possible but uncommon and risky.
- **Root Lock vs Per-Package Locks:** A single root `composer.lock` provides consistency but hides individual package dependency changes. Per-package locks give precise dependency lists per package but create synchronization challenges.
- **Automated Bumps vs Manual Review:** Automated dependency updates (Renovate) ensure timeliness but may introduce breaking changes across all packages simultaneously. Manual review provides safety but delays updates.
- **Tight Coupling vs Loose Coupling:** Monorepo dependencies naturally create tight coupling between packages (cross-package refactoring is easy). This is beneficial for closely related packages but problematic for packages that should evolve independently.

## Performance Considerations

- **Composer Resolution Time:** Monorepo dependency resolution is more complex than single-package resolution. A monorepo with 20 packages and 100+ dependencies can take 30-60 seconds for initial resolution.
- **Lock File Size:** The monorepo lock file includes dependencies for all packages; it can be 2-5x larger than a single-package lock file. This affects git operations (clone, diff) slightly.
- **Dependency Update Duration:** Updating a shared dependency (e.g., `laravel/framework`) triggers a full re-resolution of all packages' dependencies. This can take 2-5 minutes.
- **Update Impact Analysis:** Before updating a shared dependency, run `composer why-depends <package>` from the root to see which packages and which dependencies would be affected.

## Production Considerations

- **Consistent Builds:** The monorepo `composer.lock` ensures all packages are built with the same dependency versions, preventing "works on my machine" issues that can occur with independently versioned packages.
- **Security Updates:** When a security advisory affects a shared dependency, the monorepo can update it once and have all packages benefit. This is a significant advantage over per-repo dependency management.
- **Deployment Coordination:** If packages are deployed independently from the monorepo, each package's `composer.lock` (in its split repo) is used for deployment. The monorepo lock is only for development and monorepo CI.
- **Dependency Licensing:** Validate licenses of all dependencies across all packages at once. The monorepo provides a single point of license compliance checking.

## Common Mistakes

- **Inconsistent dependency versions across packages:** Package A requires `laravel/framework ^10.0`, Package B requires `^11.0`; root `composer install` fails with version conflict
- **Not committing root composer.lock:** The lock file ensures reproducible builds; without it, different developer machines may resolve different dependency versions
- **Forgetting to update all packages when bumping a dependency:** Bumping `laravel/framework` in Package A but not Package B; root CI may miss the inconsistency because Package B's tests don't run (no change detected in Package B)
- **Circular inter-package dependencies:** Package A requires Package B, which requires Package A; Composer cannot resolve the circular dependency
- **Using version ranges that are too broad:** Package A requires `laravel/framework: *` which resolves differently across environments; specify exact version ranges with `^` or `~`

## Failure Modes

- **Unresolvable Dependency Conflict:** Two packages require mutually exclusive versions of a shared dependency. Mitigate: upgrade both packages to compatible versions; or split one package out of the monorepo if it needs a different dependency version.
- **Stale composer.lock:** `composer.json` is updated but `composer.lock` is not regenerated; CI passes but `composer install` in a fresh clone fails. Mitigate: CI validates that lock file is fresh with `composer install --locked`.
- **Path Repository Version Mismatch:** A package in development depends on a version that doesn't match what's available from the remote repository. Mitigate: validate version constraints in CI with the path repository disabled.
- **Dependency Version Drift Over Time:** As dependencies are updated independently, version alignment across packages becomes increasingly difficult. Mitigate: regular (monthly) monorepo-wide dependency alignment reviews.

## Ecosystem Usage

- **Symfony Framework:** The most prominent PHP monorepo; manages 50+ components with consistent dependency versions through a custom dependency management script
- **Laravel (horizon, telescope, etc.):** Not a monorepo but demonstrates coordinated dependency management across separate repositories using shared version policies
- **Spontaneous Internal Monorepos:** Many organizations with 3-10 Laravel packages operate an informal monorepo with path repositories and a root composer.lock, without formal monorepo tooling
- **Composer Workspaces (future):** The Composer community has discussed native workspace support (like npm workspaces) but no concrete implementation exists as of 2025

## Related Knowledge Units

- composer-path-repository-usage
- monorepo-ci-optimization
- shared-library-extraction-patterns
- dependency-update-automation

## Research Notes

- The lack of native Composer workspace support is the most commonly cited pain point for Laravel monorepo management; teams must implement workarounds with path repositories and manual version alignment
- The single-version policy is the most common approach in successful Laravel monorepos; teams that allow version drift across packages eventually split into separate repositories
- Composer's `replace` feature is underutilized for monorepo dependency management; declaring local packages as replacing their remote versions can simplify resolution
- The trend in larger monorepos (> 15 packages) is toward a dedicated "dependency management" team or lead who coordinates version alignment and resolves conflicts across package maintainers
