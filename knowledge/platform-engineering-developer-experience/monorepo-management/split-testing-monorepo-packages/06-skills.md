# Skill: Set Up Split Testing for Monorepo Packages

## Purpose
Automate extraction of monorepo subdirectories into independent Git repositories for independent versioning, CI/CD, and distribution of each package using `symplify/monorepo-split`.

## When To Use
- Monorepo packages need independent versioning and release cadences
- Packages are distributed to external consumers who need individual repositories
- Organization wants monorepo development with per-package publishing to Packagist
- Packages have independent CI/CD pipelines

## When NOT To Use
- All packages are released together with the same version
- Package consumers don't need individual repositories
- Team is small and manual package publishing is acceptable
- Monorepo package count is 1-2 — simple tagging is sufficient
- Organization lacks CI resources to run split operations (5-30 min per split)

## Prerequisites
- Laravel monorepo with packages under `packages/` subdirectories
- `symplify/monorepo-split` installed as a dev dependency
- Target Git repositories created on GitHub/GitLab for each package
- SSH key or GitHub token with push access to all target repositories
- CI platform (GitHub Actions, GitLab CI, etc.)

## Inputs
- `monorepo-builder.php` — Split configuration mapping directories to repository URLs
- SSH deploy key or GitHub token (stored as CI secret)
- CI workflow file (`.github/workflows/split.yml` or equivalent)
- Tag convention document defining `{package-name}/{semver}` format

## Workflow

1. **Create Target Repositories:** For each package to split, create an empty Git repository on GitHub/GitLab. Configure branch protection rules on `main` to only allow force-pushes from the split tool.

2. **Configure Split Mapping:** Create `monorepo-builder.php` with `SplitConfig` mapping each monorepo subdirectory to its target repository URL. Use clear naming conventions matching package names.

3. **Set Up Authentication:** Store SSH deploy key or GitHub token as a CI secret (`SPLIT_SSH_KEY` or `SPLIT_TOKEN`). Use deploy keys per repository or a machine user with minimal repository-scoped access.

4. **Create Tag-Triggered CI Workflow:** Configure a CI workflow that triggers on tag push with the pattern `*/v*` (e.g., `laravel-api/v1.2.3`). Gate execution on successful CI from the monorepo's main pipeline.

5. **Implement Split Execution:** In the CI workflow, check out the full Git history (`fetch-depth: 0`), install dependencies, and run `vendor/bin/monorepo-split split`. Each package's split should be independent with its own error handling.

6. **Validate Split Output:** After splitting, verify each split repository contains expected files, valid `composer.json`, and correct autoloading. Use a custom validation script (`php scripts/validate-splits.php`).

7. **Configure Post-Split CI:** Set up CI in each split repository to run on push. This catches any issues introduced by the split process (e.g., missing files in the split repository).

8. **Monitor Split Operations:** Log all split operations with timestamp, package, and result. Monitor for unauthorized or unexpected splits. Set up alerts for split failures.

## Validation Checklist

- [ ] `monorepo-builder.php` correctly maps each package directory to its target repository
- [ ] Split CI workflow triggers only on tag pushes matching `*/v*`
- [ ] Split is gated on monorepo CI passing
- [ ] Target repositories have branch protection on `main`
- [ ] Split output validated: files exist, `composer.json` valid, autoloading works
- [ ] No direct commits allowed to split repositories
- [ ] Post-split CI in each target repository passes
- [ ] Split operations are logged with timestamps and results

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Splitting on every commit | CI costs explode; use tag-based triggers |
| No split validation | Broken packages pushed to consumers |
| Conflicting tag names (`v1.0.0` vs `v1.0.0`) | Use prefix convention `package-name/v1.0.0` |
| Splitting without CI pass | Breaking change pushed; gate on CI status |
| Manual changes to split repos | Next split overwrites them; protect branches |

## Decision Points

- **Split trigger strategy:** Tag-based (recommended) vs scheduled vs commit-based
- **Tag convention format:** `{package-name}/{semver}` (standard) vs `{semver}` for single packages
- **History preservation:** Full history (`git subtree split`) vs squashed history (`--rejoin`)
- **Authentication approach:** SSH deploy keys per repo vs machine user with scoped tokens

## Performance/Security Considerations

- **Split duration:** 5-30 minutes for large repos with 5000+ commits and 10 packages
- **CI runner requirements:** Dedicated runners with 4+ CPUs and SSD storage for splits
- **Frequency optimization:** Run split once per successful release, not per commit
- **Authentication:** Store credentials as CI secrets; never commit to monorepo
- **Branch protection:** Only force-pushes from split tool; disable direct pushes and PR merges

## Related Rules

- SPLIT-RULE-001: Split on tags, not commits
- SPLIT-RULE-002: Validate before splitting
- SPLIT-RULE-003: Protect split repository branches
- SPLIT-RULE-005: Validate split output
- SPLIT-RULE-011: Authentication with SSH key or token

## Related Skills

- Configure Laravel Monorepo Tools
- Optimize Monorepo CI Pipeline
- Configure Composer Path Repository Usage
- Publish Packages to Packagist

## Success Criteria

- Tagging a monorepo package with `package-name/v1.0.0` automatically splits and pushes to the target repository
- Split repositories contain valid, runnable packages with complete history
- Post-split CI in each target repository passes
- Split failures are detected and alert the team without blocking other packages
