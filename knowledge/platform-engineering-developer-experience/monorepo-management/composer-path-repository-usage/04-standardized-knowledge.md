# Experience Curation: Composer Path Repository Usage

## Metadata
- **KU ID:** monorepo-management/composer-path-repository-usage
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** laravel-monorepo-tools, monorepo-ci-optimization, shared-library-extraction-patterns
- **Related Technologies:** Composer, Laravel, Git, PHP
- **Target Audience:** Laravel developers, package maintainers, monorepo managers

## Overview

Composer path repositories (`{"type": "path", "url": "packages/*"}`) enable local development of interdependent packages by symlinking the local package directory rather than downloading from a remote repository. In Laravel monorepos, path repositories are the primary mechanism for developing multiple packages simultaneously—when Package A depends on Package B, changes to Package B are immediately reflected in Package A without `composer update`. The path repository resolves to a local symlink (or copy) of the package, overriding the remote version constraint. This enables real-time feedback during cross-package development but requires careful management of version constraints and lock files for production deployment.

## Core Concepts

- **Path Repository Type:** Composer repository pointing to a local directory or glob pattern; installs by creating a symlink (or copy if symlinks unsupported)
- **Symlink Resolution:** `composer install` creates a symlink from `vendor/package/name` to the path repository directory; changes are instantly reflected
- **Version Override:** When using a path repository, Composer uses the local package's `version` field (or branch-alias) and ignores the remote version constraint
- **Lock File Implications:** Path repository entries in `composer.lock` include the local path URL, making lock files non-portable across machines
- **Development Symlink, Production Real:** Path repos give instant feedback in development; production installs from remote repositories

## When To Use

- Developing multiple interdependent Laravel packages in a monorepo
- Testing a package change against a real Laravel application before publishing
- Need real-time feedback for cross-package changes during development
- Monorepo has 2+ packages where one depends on another
- Developing a Laravel package and testing it in a consuming application

## When NOT To Use

- Single package development with no cross-package dependencies
- Production or CI environments where remote resolution is required
- Windows environments without admin privileges (symlink support issues)
- Team unfamiliar with Composer repository configuration and edge cases

## Best Practices (WHY)

1. **Use Relative Paths (Why):** Define path repositories with relative paths (`"packages/*"`) from the `composer.json` location. Absolute paths (`/home/user/project/packages/*`) break when other developers clone the repository to different directory structures.

2. **Never Commit Path Repositories to Production (Why):** Path repository lock files contain local paths that don't exist on production servers. Ensure production `composer install` resolves from remote repositories. Use separate `composer.json` files or strip path repos during build.

3. **Use `*` Version Constraint with Path Repos (Why):** In the root `composer.json`, use `"*"` as the version constraint for monorepo packages. The path repository provides the actual resolution; the `"*"` constraint accepts any local version without conflict.

4. **Validate with Remote Resolution in CI (Why):** While path repos speed up development, CI should also validate that the monorepo resolves correctly with remote repositories. Add a CI job that runs `composer install` without path repos to catch resolution issues early.

5. **Handle Lock File Portability (Why):** Path repository lock files are not portable between developer machines. Either: regenerate lock in CI, use environment-specific lock files, or configure `COMPOSER_ROOT_VERSION` to ensure consistent resolution without path repos.

## Architecture Guidelines

- **Repository Definition:** In root `composer.json`: `"repositories": [{"type": "path", "url": "packages/*"}]`. This makes all packages in `packages/` available as local symlinks.
- **Root Require Strategy:** Root `composer.json` requires all packages: `"require": {"my-org/package-a": "*", "my-org/package-b": "*"}`.
- **Replace Pattern:** Use `"replace"` in root to declare local packages replace remote equivalents, preventing Composer from downloading from Packagist.
- **Symlink Configuration:** Default symlink behavior. For Windows without admin: `"prefer-stable": true` and configure copy fallback.
- **CI Resolution:** In CI, use path repos for speed. Add a separate CI job that tests remote resolution.
- **Production Build:** Remove path repo configuration during production build. Run `composer install --no-dev` with remote repositories only.

## Performance

- **Symlink Overhead:** Negligible read performance overhead. Composer generates correct autoloader for symlinked packages.
- **Composer Install Time:** Path repos eliminate Packagist download time. Monorepo `composer install` drops from 60s to ~10s for 10+ packages.
- **Classmap Dump:** `composer dump-autoload -o` takes same time regardless of path repository usage.
- **Filesystem Watch Impact:** Ensure file watchers (IDE, Laravel) are configured to follow symlinks for path-resolved packages.

## Security

- **No Secrets in Path Repos:** Path-referenced packages may expose source code to unintended consumers. Ensure they don't contain credentials or secrets.
- **Production Build Security:** Strip path repo configuration before production build. Use separate CI step to validate production dependency resolution.
- **Package Integrity:** Path repos bypass Packagist's package signing and verification. For security-sensitive deployments, validate that the path-referenced package matches the published version.
- **Windows Symlink Security:** On Windows, enabling symlinks requires admin privileges or Developer Mode. Document this requirement for team members.

## Common Mistakes

### Mistake 1: Committing Path Repository Lock File to Production
- **Description:** Lock file contains local paths that don't exist on production server
- **Cause:** Not handling lock file portability
- **Consequence:** `composer install` fails with "path not found"
- **Better:** Generate lock file per environment or strip path repos during production build

### Mistake 2: Not Using Path Repositories in Development
- **Description:** Developers manually symlink or run composer update repeatedly
- **Cause:** Not configuring path repositories in root composer.json
- **Consequence:** Slow cross-package development, frustrating workflow
- **Better:** Configure path repos at monorepo root for all packages

### Mistake 3: Version Constraint Mismatch
- **Description:** Package requires `^1.0` but path repo provides `2.0-dev` — Composer resolves local version bypassing constraint
- **Cause:** Not understanding that path repos override version constraints
- **Consequence:** Development resolves different versions than production, leading to surprises
- **Better:** Keep local package version aligned with expected constraint. Validate with remote resolution in CI.

### Mistake 4: Using Absolute Paths
- **Description:** Path repository uses absolute paths (`/home/user/packages/*`)
- **Cause:** Convenience during initial setup
- **Consequence:** Breaks for other developers with different directory structures
- **Better:** Always use relative paths from the composer.json location

## Anti-Patterns

- **The Production Path Repo:** Path repository configuration committed and deployed to production. `composer install` fails because paths don't exist. Strip path repos from production builds.
- **The Symlink Sprawl:** Every package uses path repos pointing to random directories on the filesystem. Centralize path repos in the monorepo root composer.json.
- **The Ignored Lock File:** `.gitignore` includes `composer.lock` because "it's broken by path repos." Lock files should be committed and managed, not ignored.
- **The Frozen Dependency:** A path repo pointing to a package that hasn't been updated in months. Developers forget the local version diverges from the published version.

## Examples

### Example 1: Monorepo Root composer.json with Path Repos
```json
{
    "name": "my-org/monorepo",
    "repositories": [
        {"type": "path", "url": "packages/*"}
    ],
    "require": {
        "my-org/core": "*",
        "my-org/admin": "*",
        "my-org/api": "*",
        "laravel/framework": "^11.0"
    },
    "replace": {
        "my-org/core": "self.version",
        "my-org/admin": "self.version",
        "my-org/api": "self.version"
    }
}
```

### Example 2: Development vs Production composer.json
```json
// Development (composer.dev.json)
{
    "repositories": [
        {"type": "path", "url": "packages/*"}
    ],
    "require": {
        "my-org/core": "*"
    }
}

// Production (composer.json - no path repos)
{
    "require": {
        "my-org/core": "^1.0"
    }
}
// Switch with: composer --working-dir=. --config=composer.dev.json install
```

## Related Topics

- **laravel-monorepo-tools:** Monorepo tooling overview and monorepo-builder
- **monorepo-ci-optimization:** CI strategies for path repository resolution
- **shared-library-extraction-patterns:** Extracting code into path-referenced packages
- **dependency-management-across-monorepo:** Cross-package dependency alignment

## AI Agent Notes

- **Context Requirements:** When advising on path repositories, first understand the monorepo structure, number of packages, dependency relationships, and deployment pipeline. Path repositories are a development-only tool with specific production implications.
- **Key Decision Points:** Lock file strategy (commit or regenerate), symlink vs copy, root version constraint approach, CI resolution strategy.
- **Common Pitfalls in AI Assist:** Don't recommend path repos for production. Always emphasize lock file portability issues. Remember Windows symlink limitations. Suggest CI validation with remote resolution.
- **Laravel-Specific Nuances:** Path repositories are the most commonly recommended pattern for Laravel monorepo dependency management, but they have significant edge cases (lock file portability, Windows symlink issues). Composer 2.4+ improved path repository handling.

## Verification

- [ ] KU accurately defines Composer path repository mechanics
- [ ] Core concepts cover symlink resolution, version override, lock files
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize relative paths and production safety
- [ ] Architecture guidelines cover repo definition, replace, CI strategy
- [ ] Performance addresses symlink overhead and install time
- [ ] Security covers secrets, production builds, and Windows
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify production path repos and frozen deps
- [ ] Examples show monorepo composer.json and dev/prod config
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes address Composer-specific edge cases
