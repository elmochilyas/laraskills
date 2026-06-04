# Experience Curation: Laravel Monorepo Tools

## Metadata
- **KU ID:** monorepo-management/laravel-monorepo-tools
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** split-testing-monorepo-packages, monorepo-ci-optimization, composer-path-repository-usage
- **Related Technologies:** symplify/monorepo-split, Composer, GitHub Actions, Git
- **Target Audience:** Laravel developers, platform engineers, monorepo maintainers

## Overview

Laravel monorepo tools manage multiple packages or applications within a single Git repository while enabling independent versioning and distribution of each component. The primary tool is `symplify/monorepo-split`, which handles: split testing (splitting subdirectories into individual Git repositories), dependency management (keeping shared dependencies synchronized), and release management (tagging packages with independent versions). The tools operate on the principle that development happens in the monorepo, but CI/CD and publishing target the split repositories. The challenge for Laravel teams is managing Composer dependencies across packages that share the monorepo but have different Laravel version requirements.

## Core Concepts

- **Split Testing:** Pushing specific subdirectories to their own Git repositories for independent versioning and distribution
- **Monorepo Builder (aka monorepo-split):** Configuration file defining package directories, split repositories, and shared dependencies
- **Dependency Synchronization:** Ensuring all packages use compatible versions of shared dependencies (Laravel framework, common libraries)
- **Package Consolidation:** Root `composer.json` requiring all packages' dependencies at the top level for consistent version resolution
- **Monorepo as Development Hub:** All development, code review, and testing in the monorepo; split repositories are distribution artifacts
- **Composer Path Repository:** Using `{"type": "path", "url": "packages/*"}` for local symlink-based development

## When To Use

- Multiple closely related Laravel packages that change together frequently
- Team wants atomic commits across packages (refactor across packages in one commit)
- Need consistent tooling, CI, and code standards across all packages
- Packages share dependencies and benefit from locked dependency resolution
- Organization wants to reduce the overhead of managing multiple repositories

## When NOT To Use

- Packages are unrelated and rarely change together
- Different packages need different Laravel/PHP versions
- Team is not familiar with Git subtree operations and monorepo tooling
- Organization lacks CI resources for monorepo-scale testing
- Packages are consumed by external teams who prefer independent repositories

## Best Practices (WHY)

1. **Use Composer Path Repositories for Development (Why):** Define path repositories in the monorepo root `composer.json` to symlink local packages. This enables real-time feedback when making cross-package changes—edit Package B, see results in Package A immediately without publishing.

2. **Implement Change-Detection Testing (Why):** Without change detection, monorepo CI runs all tests for all packages on every commit, taking 10-50x longer than necessary. Use tools like `dorny/paths-filter` to test only changed packages and their dependents.

3. **Automate Splits on Tags (Why):** Tag-based splits (not commit-based) keep split operations intentional and infrequent. Use a convention like `{package-name}/{version}` (e.g., `laravel-api/1.2.0`). Automate the split via CI so releasing is a single tag push.

4. **Enforce Acyclic Package Dependencies (Why):** Circular dependencies between monorepo packages (A depends on B, B depends on A) create unresolvable dependency graphs. Enforce acyclic dependencies in CI using automated validation.

5. **Maintain Independent Package Versioning (Why):** Give each package its own version independent of the monorepo root. This allows packages to evolve at their own pace. Use the `replace` field in the root `composer.json` to declare that local packages replace remote equivalents.

## Architecture Guidelines

- **Package Directory Layout:** `/packages/{package-name}` convention. Each package has its own `composer.json`, tests, source code, and CI configuration.
- **Split Configuration:** `monorepo-builder.php` defines `package_directories`, `data_to_append`, and `directories_to_repositories` mappings.
- **Root composer.json:** Requires all packages' dependencies at compatible versions. Uses `replace` for all monorepo packages. Defines path repositories for `packages/*`.
- **CI Pipeline:** Step 1: detect changed packages. Step 2: run changed packages' tests. Step 3: run integration tests from root. Step 4: on tag push, split to package repos.
- **Release Process:** Tag in monorepo → CI validates → CI runs split → Split repos updated → Split repo CI triggers → Packagist publication.

## Performance

- **CI Time:** Without optimization: 30-60 minutes. With change detection: target under 10 minutes.
- **Split Operation Duration:** 5-30 minutes for large repositories. Use shallow splits to reduce time.
- **Composer Install at Root:** 1-3 minutes (faster than per-package installs due to shared cache).
- **Repository Size:** Monorepos grow faster. Use `git clone --depth 1` in CI and periodic `git gc`.

## Security

- **Authentication for Splits:** Use deploy keys per repository or machine user with scoped tokens. Store as CI secrets.
- **Code Review:** All monorepo changes go through PR review. Split repos are derived artifacts—never commit directly to them.
- **Dependency Scanning:** Scan root `composer.lock` for vulnerabilities. One scan covers all packages.
- **Branch Protection:** Protect the monorepo main branch. Protect split repository main branches (force-pushes only from split tool).

## Common Mistakes

### Mistake 1: Not Using Path Repositories in Development
- **Description:** Developers manually symlink or run `composer update` repeatedly for cross-package changes
- **Cause:** Not configuring path repositories in root composer.json
- **Consequence:** Slow feedback loop, frustrating cross-package development
- **Better:** Define `repositories: [{type: path, url: "packages/*"}]` in root composer.json

### Mistake 2: Circular Package Dependencies
- **Description:** Package A depends on B, B depends on A
- **Cause:** Poor package boundary design, not enforcing architecture
- **Consequence:** Composer resolution fails, split operations break
- **Better:** Enforce acyclic dependency graph in CI

### Mistake 3: Oversized Monorepo
- **Description:** Including unrelated projects, design files, and documentation in the same monorepo
- **Cause:** "Everything in one repo" mentality without considering cost
- **Consequence:** Slow clone times, complex CI, difficult to navigate
- **Better:** Keep the monorepo focused on closely related packages

### Mistake 4: Forgetting to Split Before Release
- **Description:** Tagging a release in the monorepo but the split doesn't trigger
- **Cause:** Manual process, no automation
- **Consequence:** Split repos are outdated, consumers can't install latest versions
- **Better:** Automate split on tag via CI

## Anti-Patterns

- **The Monolith Monorepo:** One giant application with everything in a single directory, not structured as packages. You lose all monorepo benefits. Structure as independent packages.
- **The Git Graveyard:** Historical monorepo with thousands of commits from unrelated projects. Archive old projects outside the monorepo.
- **The Split-Free Monorepo:** Packages exist in the monorepo but are never split. They can't be consumed independently. Either implement split testing or accept that packages are not individually distributable.
- **The Manual Split:** Engineer manually copies files from monorepo to package repos. Error-prone and time-consuming. Automate with symplify/monorepo-split.

## Examples

### Example 1: Monorepo Package Structure
```
project-root/
├── packages/
│   ├── core/
│   │   ├── composer.json
│   │   ├── src/
│   │   └── tests/
│   ├── admin/
│   │   ├── composer.json
│   │   ├── src/
│   │   └── tests/
│   └── api/
│       ├── composer.json
│       ├── src/
│       └── tests/
├── composer.json (root - requires all packages)
└── monorepo-builder.php (split config)
```

### Example 2: Tag-Triggered Split CI
```yaml
name: Split Packages
on:
  push:
    tags:
      - '*/v*'  # Matches: laravel-api/v1.2.3, core/v2.0.0
jobs:
  split:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for split
      - uses: symplify/monorepo-split@v1
        with:
          config: monorepo-builder.php
        env:
          SSH_KEY: ${{ secrets.SPLIT_SSH_KEY }}
```

## Related Topics

- **split-testing-monorepo-packages:** Deep dive into split mechanism
- **monorepo-ci-optimization:** CI strategies for monorepos
- **composer-path-repository-usage:** Path repository setup and management
- **dependency-management-across-monorepo:** Cross-package dependency alignment
- **shared-library-extraction-patterns:** Extracting code into monorepo packages

## AI Agent Notes

- **Context Requirements:** When advising on monorepo tools, first determine the number of packages, their relationship (shared dependencies, independent), versioning requirements, and CI resources. The complexity of monorepo tooling scales with package count and coupling.
- **Key Decision Points:** Split vs no-split, tag-triggered vs scheduled splits, root lock vs per-package locks, independent vs synchronized versioning.
- **Common Pitfalls in AI Assist:** Don't recommend monorepo for unrelated packages. Always emphasize path repositories for development. Remember Composer lacks native workspace support—acknowledge this limitation.
- **Laravel-Specific Nuances:** Composer's lack of workspace support is the primary limitation. symplify/monorepo-split is the standard tool. Most Laravel teams use monorepos for internal packages, not framework development.

## Verification

- [ ] KU accurately defines Laravel monorepo tools and their purpose
- [ ] Core concepts cover split testing, dependency sync, path repositories
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize path repos and change detection
- [ ] Architecture guidelines cover layout, split config, CI pipeline
- [ ] Performance targets are quantified
- [ ] Security covers auth and branch protection
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify monolith monorepo and manual splits
- [ ] Examples show structure and CI workflow
- [ ] Related topics cross-reference is complete
- [ ] AI Agent Notes address Composer limitations
