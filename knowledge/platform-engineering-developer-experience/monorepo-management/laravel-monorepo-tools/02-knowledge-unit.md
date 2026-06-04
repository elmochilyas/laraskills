# Knowledge Unit: Laravel Monorepo Tools

## Metadata
- **Subdomain:** Monorepo Management
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** monorepo-management/laravel-monorepo-tools
- **Maturity:** Maturing
- **Related Technologies:** symplify/monorepo-split, Composer, GitHub Actions, Git

## Executive Summary

Laravel monorepo tools manage multiple packages or applications within a single Git repository while enabling independent versioning and distribution of each component. The primary tool is `symplify/monorepo-split` (formerly `symplify/monorepo-builder`), which handles: split testing (splitting the monorepo's subdirectories into individual Git repositories), dependency management (keeping shared dependencies synchronized), and release management (tagging packages with independent versions). The tools operate on the principle that development happens in the monorepo, but CI/CD and publishing target the split repositories. The challenge for Laravel teams is managing Composer dependencies across packages that share the monorepo but have different Laravel version requirements.

## Core Concepts

- **Split Testing:** The process of pushing specific subdirectories of the monorepo to their own Git repositories; each split repo is a standalone package that can be released independently
- **Monorepo Builder:** Configuration file (`monorepo-builder.php`) that defines package directories, split repositories, and shared dependencies
- **Dependency Synchronization:** Ensuring all packages in the monorepo use compatible versions of shared dependencies (Laravel framework, common libraries)
- **Package Consolidation:** The monorepo's root `composer.json` typically requires all packages' dependencies at the top level to ensure consistent version resolution

## Mental Models

- **Monorepo as Development Hub:** All development, code review, and testing happens in the monorepo; the split repositories are distribution artifacts
- **Split as Publishing:** Splitting is like publishing—it takes the current state of a subdirectory and publishes it to a distribution repository
- **Monorepo as Dependency Graph:** The monorepo makes the dependency graph between packages visible: you can see all packages, their relationships, and ensure compatibility at a glance
- **Release Tags as Contracts:** Each split package has its own version tags, independent of the monorepo's root version; the monorepo itself may not have a version at all

## Internal Mechanics

1. **Monorepo Structure:** `/packages/` subdirectory containing each package (`packages/laravel-api`, `packages/laravel-admin`, `packages/shared-dtos`). Each package has its own `composer.json`, tests, and source code.
2. **Split Configuration:** `monorepo-builder.php` defines: `package_directories` (which subdirs are packages), `data_to_append` (autoload config, extra), `directories_to_repositories` (split dir → Git remote mapping).
3. **Split Execution:** Running `vendor/bin/monorepo-builder split` uses the `git subtree` or `git filter-branch` technique to extract a subdirectory's history and push it to the target repository.
4. **Dependency Resolution:** The monorepo's root `composer.json` requires all packages' dependencies in the `require` section, enforcing a single version for each shared dependency across all packages.
5. **Package Versioning:** Each package's `composer.json` defines its own version; the monorepo builder can synchronize `branch-alias` for development branches.

## Patterns

- **Composer Path Repository Pattern:** In the monorepo's root `composer.json`, use `repositories: [{type: path, url: "packages/*"}]` to symlink local packages; this enables real-time development without publishing.
- **Monorepo Root as Meta Pattern:** The root `composer.json` has `require` for all shared dependencies and `replace` for all packages in the monorepo; this allows running `composer install` once at the root level.
- **CI Matrix Pattern:** CI runs tests for each package independently (using `composer install` from the package directory) and also runs an integration test from the root with all packages combined.
- **Split-on-Tag Pattern:** Git tags in the monorepo trigger splits; tag names follow a convention like `{package-name}/{version}` (e.g., `laravel-api/1.2.0`), and the split script extracts the correct package for each tag.
- **Change-Detection Testing Pattern:** CI only runs tests for packages that have changed in a PR; this significantly reduces CI time for monorepos with many packages. Use tools like `dorny/paths-filter` in GitHub Actions.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Split tool | symplify/monorepo-split vs git-subtree vs custom scripts | symplify/monorepo-split for automation; git-subtree for manual ops |
| Package directory layout | `/packages/{name}` vs `/src/{name}` vs custom | `/packages/{name}` (standard convention) |
| Versioning strategy | Independent per package vs synchronized root version | Independent for packages with different release cadences; synchronized for tightly coupled packages |
| Root composer.json strategy | Require all deps at root vs per-package install | Root requires all for CI speed; per-package install for release validation |

## Tradeoffs

- **Split Testing Complexity vs Monorepo Benefits:** The split testing tooling adds complexity to CI/CD but provides the benefits of monorepo development (atomic commits, shared tooling, cross-package refactoring) with independent package distribution.
- **Single Version vs Independent Versioning:** Single-version monorepos are simpler (one version, one changelog) but force all packages to update together. Independent versioning matches each package's release cadence but requires more complex tooling.
- **Path Repository vs Split Publishing:** Path repositories are great for development (instant updates) but don't test the actual installation process. Split publishing tests the real installation flow but adds a CI step.
- **Monorepo vs Per-Repo Tooling:** Monorepo requires specialized tooling (monorepo-split, CI filters) that per-repo setups don't need. The complexity is worth it when packages change together frequently.

## Performance Considerations

- **CI Time in Monorepos:** Without change detection, monorepo CI runs all tests for all packages on every commit. This can be 10-50x slower than per-repo CI. Implement change detection and targeted test execution.
- **Split Operation Duration:** Splitting large repositories with long Git history can take 5-30 minutes. Use shallow splits or squash commits to reduce operation time.
- **Composer Install Time:** Installing dependencies for all packages from the root is faster than individual installs (shared lock file, shared cache). The monorepo root install is typically 1-3 minutes.
- **Repository Size:** Monorepos grow faster than single-package repos. Over time, this affects `git clone` time. Use `--depth 1` in CI and `git gc` periodically.

## Production Considerations

- **CI/CD Pipeline Design:** Design CI to: (1) detect changed packages, (2) run changed packages' tests, (3) run integration tests from root (if any changed), (4) on tag push to monorepo, split to package repos, (5) on split repo tag, publish to Packagist.
- **Deployment from Monorepo:** Deploy individual applications from the monorepo using Docker images or CI artifacts; each application's deployment pipeline watches its specific directory.
- **Authentication for Splits:** Split operations need push access to all target repositories. Use deploy keys or machine users with minimal permissions. Store credentials as CI secrets.
- **Backup and Recovery:** Maintain a backup of the monorepo; if split operations fail, the monorepo source is the authoritative reference. Package repos are derived artifacts.

## Common Mistakes

- **Not using path repositories in development:** Without path repositories, developers manually symlink or `composer update` repeatedly; path repos provide instant feedback for cross-package changes
- **Circular dependencies between monorepo packages:** Package A depends on B, B depends on A, creating a resolution deadlock; enforce acyclic dependency graph in CI
- **Forgetting to split before release:** Tagging a release in the monorepo but the split doesn't trigger, leaving split repos outdated; automate split on tag via CI
- **Oversized monorepo:** Including documentation, design files, and unrelated projects in the same monorepo; keep the monorepo focused on closely related packages
- **Not using dependency substitution in root:** Forgetting to add `replace` or path repositories for monorepo packages; Composer tries to install packages from Packagist instead of local, causing version conflicts

## Failure Modes

- **Split Conflict:** Two commits modify the same package in incompatible ways, and the split push fails. Mitigate: validate split before merge; enforce linear package history with rebase.
- **Dependency Version Drift:** Package A requires Laravel 11, Package B requires Laravel 12, both in the same monorepo. Mitigate: enforce consistent dependency requirements across all monorepo packages via CI.
- **Split Repository History Mismatch:** After a force push to the monorepo, split repos have diverged history. Mitigate: avoid force pushes to shared branches; use `--force` with caution on split operations.
- **Composer Resolution Timeout:** With 20+ packages in the monorepo, Composer resolution from the root may time out. Mitigate: use locking (composer.lock at root) and increase Composer timeout.

## Ecosystem Usage

- **Laravel Framework:** Laravel's own development uses a monorepo-like structure with separate packages (framework, telescope, horizon) in individual repositories but coordinated releases
- **Spatie:** Spatie maintains many packages across separate repositories (not monorepo), but offers an example of well-organized multi-package development
- **Symfony:** The Symfony framework uses a monorepo for all its components; the structure and split testing approach inspired symplify/monorepo-split
- **Laravel CMS Packages:** Organizations building a CMS or platform with multiple Laravel packages often adopt monorepo for consistency
- **syplify/monorepo-split:** The primary tool for Laravel monorepo management, used by several large open-source and internal Laravel projects

## Related Knowledge Units

- split-testing-monorepo-packages
- monorepo-ci-optimization
- composer-path-repository-usage
- dependency-management-across-monorepo

## Research Notes

- The symplify/monorepo-split tool was originally `symplify/monorepo-builder` and was split into a focused split tool; the old tool included many features that have been deprecated
- Laravel framework itself does not use a monorepo approach; each component (Horizon, Telescope, Sail, Pulse) is a separate repository with coordinated releases
- Monorepo adoption in the Laravel ecosystem is lower than in JavaScript (Turborepo, Nx) or Python ecosystems, but is growing for internal platform engineering
- The main challenge for Laravel monorepos is Composer's dependency resolution, which is less flexible than npm workspaces or pip's editable installs
