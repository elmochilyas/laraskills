# Knowledge Unit: Composer Path Repository Usage

## Metadata
- **Subdomain:** Monorepo Management
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** monorepo-management/composer-path-repository-usage
- **Maturity:** Mature
- **Related Technologies:** Composer, Laravel, Git, PHP

## Executive Summary

Composer path repositories (`{"type": "path", "url": "packages/*"}`) enable local development of interdependent packages by symlinking the local package directory rather than downloading from a remote repository. In Laravel monorepos, path repositories are the primary mechanism for developing multiple packages simultaneously—when Package A depends on Package B, changes to Package B are immediately reflected in Package A without `composer update`. The path repository resolves to a local symlink (or copy) of the package, overriding the remote version constraint. This enables real-time feedback during cross-package development but requires careful management of version constraints and lock files for production deployment.

## Core Concepts

- **Path Repository Type:** A Composer repository type that points to a local directory or a glob pattern; Composer installs the package by creating a symlink (or copy if symlinks are not supported)
- **Symlink Resolution:** `composer install` creates a symlink from `vendor/package/name` to the path repository directory; changes to the source are instantly reflected in the vendor directory
- **Version Override:** When using a path repository, Composer uses the `version` field from the package's `composer.json` (or infers it from the `branch-alias`) and ignores the remote repository version constraint
- **Lock File Implications:** Path repository entries in `composer.lock` include the local path URL; this means lock files are not portable between developer machines without the same directory structure

## Mental Models

- **Path Repository as Symlink Farm:** The path repository creates a symlink farm where vendor packages point to local source directories; it's like `npm link` but declarative in `composer.json`
- **Development Symlink, Production Real:** In development, path repositories give instant feedback via symlinks; in production, the actual package is installed from the remote repository, avoiding the local path dependency
- **Path as Override:** A path repository overrides the normal Composer resolution for the matching package; Composer sees the local version instead of querying Packagist
- **Version Constraint as Documentation:** The version constraint in the requiring package's `composer.json` documents the expected version; but when a path repository is active, the constraint is effectively ignored in favor of the local version

## Internal Mechanics

1. **Path Repository Resolution:** When `composer install` encounters a `type: path` repository, Composer resolves the glob/URL to find package directories, reads each package's `composer.json`, and maps the package name to the local path.
2. **Symlink vs Copy:** If the OS supports symlinks and Composer is configured for symlinks (default), `vendor/package/name` is a symlink to the source directory. If symlinks are not supported (Windows without admin), Composer creates a copy.
3. **Version Detection:** Composer reads the `version` field from the local package's `composer.json`. If no version is set, Composer infers the version from the branch name or the `branch-alias` in the `extra` section.
4. **Lock File Entry:** When a path repository is used, `composer.lock` records the path repository URL and the local path, making the lock file specific to the local environment.
5. **Path Repository Order:** Path repositories defined in `composer.json` are checked before Packagist.org; Composer uses the path repository resolution for matching packages, falling back to remote repositories for non-matching packages.

## Patterns

- **Monorepo Root Path Pattern:** In the monorepo root `composer.json`, define: `"repositories": [{"type": "path", "url": "packages/*"}]`. This makes all packages in `packages/` available as local symlinks to any package that requires them.
- **Root Require Pattern:** The monorepo root `composer.json` requires all packages at known versions: `"require": {"my-org/package-a": "*", "my-org/package-b": "*"}`. The path repositories provide the actual resolution; the `"*"` constraint accepts any local version.
- **Development Replace Pattern:** Use `"replace"` in the root `composer.json` to declare that local packages replace their remote equivalents. This prevents Composer from downloading a version from Packagist when the local version exists.
- **CI Path Resolution Pattern:** In CI, use path repositories for local packages (they're in the monorepo) but install them with `composer install --no-dev` to ensure the correct dependency chain is tested.
- **Environment-Specific Configuration Pattern:** Use `COMPOSER` environment variable to switch between path repository (development) and remote repository (CI/production) configurations by specifying different `composer.json` files.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Symlink vs copy | Symlink (default) vs prefer copy | Symlink for development; copy for CI/Windows without admin |
| Path repository scope | Root `composer.json` vs per-package | Root for central management; per-package for specific cross-package dependencies |
| Version constraint in requiring package | `*` vs `dev-main` vs specific version | `*` for flexibility; `dev-main` for branch-aware resolution |
| Lock file strategy | Commit with paths vs generate per-environment | Commit for development (path URLs in lock); regenerate for production (remote URLs in lock) |

## Tradeoffs

- **Lock File Portability:** Path repositories embed local paths in `composer.lock`, breaking portability. Solutions include: `.gitignore` the lock file in development, regenerate lock in CI, or use `COMPOSER_ROOT_VERSION` environment variable.
- **Real-Time Feedback vs Production Fidelity:** Symlinked packages provide instant feedback (change code in Package B, see results in Package A immediately). However, the symlink behaves differently from the installed package (e.g., no version constraints applied, autoloading optimization differences).
- **Simplicity vs Control:** Path repositories are simple to configure (one line in `composer.json`) but provide limited control. For fine-grained control, consider `composer config` commands or custom Composer plugins.
- **Global Cache vs Local Resolution:** Normally, Composer caches packages globally; path repositories bypass the cache and resolve directly. This gives fresh results but doesn't benefit from caching speed.

## Performance Considerations

- **Symlink Overhead:** Symlinked packages have negligible read performance overhead. Composer still generates the classmap and autoloader correctly for symlinked packages.
- **Composer Install Time:** Path repositories eliminate download time (no fetching from Packagist). For monorepos with 10+ packages, this can reduce `composer install` time from 60 seconds to 10 seconds.
- **Classmap Dump:** `composer dump-autoload -o` generates optimized classmaps that include symlinked package classes. This step takes the same time regardless of path repository usage.
- **Filesystem Watch Impact:** Filesystem watchers (file watchers in IDEs, Laravel file change detectors) need to follow symlinks to detect changes in path-resolved packages. Ensure watchers are configured to follow symlinks.

## Production Considerations

- **No Path Repositories in Production:** Path repositories must NOT be used in production. Production `composer install` should resolve from remote repositories (Packagist, Private Packagist). Ensure the production environment doesn't have the monorepo path structure.
- **Deployment Script:** In deployment, run `composer install --no-dev` with path repositories removed from the configuration. Use separate `composer.json` files for development (with path repos) and production (without), or remove path repos during the build process.
- **CI Resolution Strategy:** In CI, decide whether to use path repositories (faster, but different from production resolution) or install from remote repositories (slower but mirrors production). Recommended: use path repos in CI for speed, but have a separate CI job that tests installation from remote repos.
- **Artifact Build:** When building deployable artifacts (Docker images, zip files), run `composer install --no-dev --no-scripts` with remote repository configuration to ensure the artifact has correctly resolved dependencies.

## Common Mistakes

- **Committing path repository lock file to production:** Lock file contains local paths that don't exist on the production server; `composer install` fails with "path not found"
- **Not using path repositories in development:** Developers manually symlink or run `composer update` repeatedly to see cross-package changes; path repos provide instant feedback
- **Version constraint mismatch:** Package requires `^1.0` of a dependency, but the path repository provides version `2.0-dev`; Composer resolves the local version, bypassing the constraint check
- **Forgetting to add the repository definition:** Adding a package to `require` but forgetting to define the path repository; Composer tries to resolve from Packagist and fails if the package is private
- **Using absolute paths in path repository:** Different developer machines have different directory structures; always use relative paths (e.g., `packages/*`) from the `composer.json` location

## Failure Modes

- **Symlink Resolution Failure:** On Windows without admin privileges, Composer can't create symlinks and falls back to copying, which may fail with long path errors. Mitigate: use `composer config --no-plugins allow-plugins.composer/installers false` or enable Windows developer mode for symlink support.
- **Circular Path Resolution:** Package A's path repo points to a directory that includes Package A itself, creating a loop. Mitigate: ensure path repository globs only match intended packages.
- **Stale Symlink:** Package directory is deleted or moved, but symlink in `vendor/` still points to the old location. Mitigate: re-run `composer install` or `composer update` to refresh path repository symlinks.
- **Autoloading Conflict:** Two packages in the monorepo define the same namespace or class name; Composer's autoloading includes both, causing class redeclaration errors. Mitigate: enforce unique namespace prefixes across all monorepo packages.

## Ecosystem Usage

- **Laravel Monorepos:** The most common use case; monorepo root `composer.json` defines path repositories for all `packages/*` directories
- **Laravel Framework (fork development):** Developers working on Laravel forks use path repositories to test changes against their application before submitting PRs
- **Package Development:** When developing a new package and testing it within an existing Laravel application, path repositories provide instant feedback without publishing
- **Composer Itself:** Composer's own monorepo uses path repositories for its internal packages (composer/composer → composer/semver, etc.)

## Related Knowledge Units

- laravel-monorepo-tools
- monorepo-ci-optimization
- shared-library-extraction-patterns
- dependency-management-across-monorepo

## Research Notes

- Path repositories are the most commonly recommended pattern for Laravel monorepo dependency management, but they have significant edge cases (lock file portability, Windows symlink issues)
- Composer 2.4+ improved path repository handling with better lock file portability and version detection
- The trend in larger Laravel monorepos is to use a combination of path repositories (development) and split testing (release) rather than relying solely on path resolutions
- Alternative approaches like `composer patches` or custom Composer plugins for monorepo dependency management exist but have not gained significant adoption
