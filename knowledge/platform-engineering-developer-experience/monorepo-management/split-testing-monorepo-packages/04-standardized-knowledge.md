# Experience Curation: Split Testing for Monorepo Packages

## Metadata
- **KU ID:** monorepo-management/split-testing-monorepo-packages
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** laravel-monorepo-tools, monorepo-ci-optimization, composer-path-repository-usage
- **Related Technologies:** symplify/monorepo-split, Git, GitHub Actions, Composer
- **Target Audience:** Laravel developers, monorepo maintainers, package publishers

## Overview

Split testing is the process of extracting specific subdirectories of a monorepo into their own independent Git repositories, enabling independent versioning, CI/CD, and distribution of each component. The primary tool is `symplify/monorepo-split`, which uses Git subtree operations to push a subdirectory's history to a target repository. Each split repository maintains its own full Git history (filtered to that subdirectory's changes) and can be versioned and released independently. In the Laravel ecosystem, split testing enables teams to develop multiple packages in a monorepo while publishing them as independent Composer packages to Packagist.

## Core Concepts

- **Split Repository:** A standalone Git repository derived from a monorepo subdirectory with full history of files within that subdirectory
- **Git Subtree Split:** The Git operation creating a branch containing only the history of a specific subdirectory; the split tool automates this and pushes to the target repository
- **Split Mapping:** Configuration mapping each monorepo subdirectory to its target repository URL
- **Tag Convention:** Naming convention for tags encoding which package they belong to (e.g., `package-name/1.2.3`)
- **Monorepo as Development Ground Truth:** The monorepo is authoritative; split repositories are derived artifacts that can be regenerated
- **Tags as Release Triggers:** A monorepo tag triggers the split and push, which triggers package CI and publication

## When To Use

- Monorepo packages need independent versioning and release cadences
- Packages are distributed to external consumers who need individual repositories
- Organization wants monorepo development with per-package publishing
- Packages have independent CI/CD pipelines (split repos have their own CI)
- Team wants the benefits of monorepo development (atomic commits, cross-package refactoring) with independent distribution

## When NOT To Use

- All packages are released together with the same version — split testing adds unnecessary complexity
- Package consumers don't need individual repositories
- Team is small and manual package publishing is acceptable
- Monorepo package count is 1-2 — simple tagging is sufficient
- Organization lacks CI resources to run split operations

## Best Practices (WHY)

1. **Split on Tags, Not Commits (Why):** Tag-based splits keep split operations intentional and infrequent. A split on every commit would overwhelm CI and create noise in split repositories. Use a tag convention like `{package-name}/{semver}` and only trigger splits on tag push.

2. **Validate Before Splitting (Why):** Only split after monorepo CI passes. Splitting a broken package pushes failure to downstream consumers. CI should validate all packages before the split operation proceeds.

3. **Protect Split Repository Branches (Why):** Force-pushes from the split tool should be the only changes allowed on split repo main branches. Direct commits or merges to split repos will be overwritten by the next split. Use branch protection rules to enforce this.

4. **Design for Per-Package Resilience (Why):** If a split fails for one package (network error, authentication issue), remaining packages should still split successfully. Each package's split operation should be independent with its own error handling.

5. **Validate Split Output (Why):** After splitting, verify the split repository has the expected files, valid composer.json, and complete package structure. A split that produces a broken package is worse than no split because downstream CI may fail after the package is already pushed.

## Architecture Guidelines

- **Split Configuration:** `monorepo-builder.php` (or `split-monorepo.php`) defines directory → repository mappings with clear naming.
- **Tag Convention:** `{package-name}/{version}` (e.g., `laravel-api/1.2.0`) — standard in the Symfony ecosystem. The split tool detects the tag prefix and extracts the correct package.
- **Split Trigger:** Tag push to the monorepo. A CI workflow runs the split, pushing to all target repositories.
- **Split Execution:** `vendor/bin/monorepo-split` iterates each mapping, performs `git subtree split`, and pushes to target repositories.
- **CI Chain:** Monorepo tag → split → split repo push → split repo CI → Packagist (or private registry) publication.
- **History Preservation:** Use `git subtree split --rejoin` for squashed history that doesn't include full monorepo history but preserves meaningful commits.
- **Fallback:** If split fails, the monorepo remains the authoritative source. Package consumers pin to last successful version.

## Performance

- **Split Duration:** 5-30 minutes for large repositories with 5000+ commits and 10 packages. Primary bottleneck is `git subtree split` processing full Git history.
- **Monorepo History Growth:** Each split adds merge commits. Over time, this increases clone and split times.
- **CI Runner Requirements:** Split operations are CPU and I/O intensive. Dedicate runners with 4+ CPUs and SSD storage.
- **Frequency Optimization:** Run split once per successful release, not per commit. For weekly releases, split runs once per week.

## Security

- **Authentication:** Split tool needs SSH key or GitHub token with push access to all split repositories. Use deploy keys per repository or a machine user with repository-scoped access tokens.
- **Credential Storage:** Store authentication credentials as CI secrets. Never commit them to the monorepo.
- **Branch Protection:** Protect split repository main branches. Only allow force-pushes from the split tool. Disable direct pushes and PR merges.
- **Split Audit:** Log all split operations with timestamp, package, and result. Monitor for unauthorized or unexpected splits.

## Common Mistakes

### Mistake 1: Splitting on Every Commit
- **Description:** CI triggers split on every push to main
- **Cause:** Over-automation, not understanding split cost
- **Consequence:** Wasted CI resources, split repository churn, frequent timeout failures
- **Better:** Trigger splits only on tag pushes

### Mistake 2: No Split Validation
- **Description:** Split succeeds but the package is missing files or has broken autoloading
- **Cause:** Assuming split always produces correct output
- **Consequence:** Downstream consumers install broken packages
- **Better:** Validate split output: check files exist, composer.json is valid, autoloading works

### Mistake 3: Conflicting Tag Names
- **Description:** Two packages create tags with the same version string (e.g., both `v1.0.0`)
- **Cause:** Not using prefix-based tags
- **Consequence:** Split tool can't determine which package the tag belongs to
- **Better:** Use `{package-name}/{version}` convention (e.g., `api/1.0.0`, `admin/2.0.0`)

### Mistake 4: Splitting Without CI Pass
- **Description:** Split runs even though monorepo CI failed
- **Cause:** Split workflow not gated on CI status
- **Consequence:** Breaking change pushed to package repositories
- **Better:** Only split on green CI. Gate split workflow on CI status check.

### Mistake 5: Manual Changes to Split Repos
- **Description:** Someone commits directly to a split repository
- **Cause:** Teams treating split repos as independent projects
- **Consequence:** Next split overwrites or conflicts with manual changes
- **Better:** Protect split repo branches. Enforce monorepo as single source of truth.

## Anti-Patterns

- **The Split-on-Push Pipeline:** Every push triggers a full split of all packages. CI costs explode, split repos have noisy history. Use tag-based triggers.
- **The Untested Split:** Split runs immediately after merge without CI validation. Broken packages are published to consumers. Gate on CI.
- **The Snowflake Split Repo:** A split repository that has accumulated custom branches, PRs, and direct commits. Will be overwritten by next split. Protect and restrict.
- **The Manual Split Process:** Engineer runs split commands locally and manually pushes to repositories. Not repeatable, not auditable. Automate in CI.
- **The Split-and-Forget:** Split succeeds but no one monitors the output repositories. Packages may be broken, but no one notices until consumers complain. Add post-split validation and monitoring.

## Examples

### Example 1: Tag-Triggered Split CI
```yaml
name: Split Packages
on:
  push:
    tags:
      - '*/v*'  # laravel-api/v1.2.3, core/v2.0.0
jobs:
  split:
    runs-on: ubuntu-latest
    if: github.event.base_ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history required
      - uses: shivammathur/setup-php@v2
      - run: composer install
      - name: Split packages
        run: vendor/bin/monorepo-split split
        env:
          SSH_KEY: ${{ secrets.SPLIT_SSH_KEY }}
      - name: Validate splits
        run: php scripts/validate-splits.php
```

### Example 2: monorepo-builder.php Configuration
```php
// monorepo-builder.php
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symplify\MonorepoBuilder\Split\ValueObject\SplitConfig;

return static function (ContainerConfigurator $containerConfigurator): void {
    $services = $containerConfigurator->services();
    $services->set(SplitConfig::class)
        ->call('setDirectoriesToRepositories', [[
            'packages/core' => 'git@github.com:org/core.git',
            'packages/admin' => 'git@github.com:org/admin.git',
            'packages/api' => 'git@github.com:org/api.git',
        ]]);
};
```

## Related Topics

- **laravel-monorepo-tools:** Monorepo tooling overview
- **monorepo-ci-optimization:** CI strategies before and after split
- **composer-path-repository-usage:** Path repos during monorepo development
- **dependency-management-across-monorepo:** Ensuring split packages resolve independently
- **packagist-composer:** Publishing split packages to Packagist

## AI Agent Notes

- **Context Requirements:** When advising on split testing, first determine whether packages need independent versioning and distribution. Split testing is an advanced pattern—many teams can skip it by releasing all packages together or by publishing manually.
- **Key Decision Points:** Split trigger (tag vs commit vs schedule), tag convention, history preservation strategy, authentication approach, validation strategy.
- **Common Pitfalls in AI Assist:** Don't recommend split testing for teams releasing all packages together. Always emphasize tag-based triggers. Remember split operations are expensive (5-30 min). Validate split output.
- **Laravel-Specific Nuances:** Split testing is less common in Laravel than in Symfony. Most Laravel teams skip split testing and publish packages manually from the monorepo. The overhead is justified only when packages need truly independent versioning.

## Verification

- [ ] KU accurately defines split testing mechanism and purpose
- [ ] Core concepts cover subtree split, tag convention, split mapping
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize tag-based triggers and validation
- [ ] Architecture guidelines cover configuration, CI chain, history
- [ ] Performance addresses split duration and runner requirements
- [ ] Security covers authentication and branch protection
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify split-on-push and manual split
- [ ] Examples show CI workflow and split configuration
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes address split testing complexity threshold
