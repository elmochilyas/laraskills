# Knowledge Unit: Pint CI Integration

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/pint-ci-integration
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, GitHub Actions, GitLab CI, CI/CD, PHP

## Executive Summary

Integrating Laravel Pint into CI pipelines automates code style enforcement, ensuring all committed code follows the team's formatting standards. The primary integration pattern is running `pint --test` as a CI step—this checks if Pint would modify any files and exits with code 1 if style issues exist, failing the build. Advanced patterns include: running Pint to auto-fix code (then committing or commenting on PR), caching Pint runs for faster feedback, integrating with GitHub Actions annotations for inline error display, and gating other CI steps on style compliance. Pint also supports `--dirty` flag for checking only changed files (faster but less thorough) and `--diff` for showing style diffs in CI logs. The CI configuration should pin the Pint version to prevent unexpected rule changes from breaking pipelines.

## Core Concepts

- **--test Flag:** Dry-run mode that exits 0 (no changes needed) or 1 (files would change); designed for CI gates
- **CI Exit Code:** Pint returns 0 on success (style is clean) or 1 when style issues are found (in --test mode)
- **GitHub Actions Annotations:** `pint --test --format=github` outputs errors in GitHub annotation format, showing inline annotations on PR diffs
- **Caching:** PHP-CS-Fixer's token cache speeds up subsequent runs; cache should be restored from CI caches for incremental runs
- **Auto-Fixing in CI:** Running `pint` (without --test) in CI fixes style issues, requiring the CI step to commit changes or create a fix PR

## Mental Models

## Internal Mechanics

## Patterns

- **Early Gate Pattern:** Run `pint --test` as the first CI step after dependency installation. If style fails, fail fast without running slower tests or analysis.
- **Auto-Fix + Commit Pattern:** In CI, run `pint` to fix style, then commit and push changes back to the PR branch. Requires careful Git configuration to avoid infinite CI loops.
- **PR Comment Pattern:** Run `pint --test --diff`, capture the diff, and post it as a PR comment with specific style issues. Gives developers actionable feedback without CI failures.
- **Cached Pint Pattern:** Cache the `.php-cs-fixer.cache` file between CI runs. Pint's cache tracks file hashes; unchanged files skip tokenization, reducing run time by 50-80%.
- **Matrix Testing Pattern:** Test against multiple Pint versions (or presets) in a matrix to verify compatibility before upgrading Pint.
- **Scheduled Format Pattern:** Run `pint` on a schedule (e.g., weekly) as a GitHub Action that creates a "code style cleanup" PR. Keeps the codebase consistently formatted without developer intervention.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Enforcement mode | Gate (--test) vs auto-fix | Gate for strict teams; auto-fix for flexible teams |
| Timing | Early (before tests) vs late (after tests, before merge) | Early (fast feedback) |
| Format | Simple pass/fail vs annotated diff | Annotated (GitHub Actions annotations) for developer visibility |
| Scope | Full project vs changed files only | Full project for thoroughness; changed files for speed (--dirty) |

## Tradeoffs

- **Gate vs Auto-Fix:** Gate mode prevents style issues from merging but developers must fix locally before pushing. Auto-fix mode is convenient (CI fixes style) but may produce surprising diffs and requires Git configuration to commit CI changes.
- **Full Scan vs Dirty Scan:** Full scan (`pint --test`) checks everything but takes longer (5-10 seconds). Dirty scan (`pint --test --dirty`) only checks changed files (1-2 seconds) but misses style issues in existing code. Use full scan in CI, dirty scan for pre-commit hooks.
- **Strict vs Lenient CI:** Strict CI fails on any style issue (clean codebase but more CI failures). Lenient CI warns but doesn't fail (fewer CI failures but codebase degrades). Recommendation: strict CI with a one-time full-formatting commit to establish the baseline.

## Performance Considerations

- **Run Time:** A full Pint scan of a Laravel project (500 files) takes 3-8 seconds in CI. Dirty scan takes 1-2 seconds.
- **Cache Impact:** Caching PHP-CS-Fixer's token cache reduces subsequent runs by 50-80%. Cache restoration adds ~1 second. Net benefit: significant for repeated CI runs.
- **GitHub Actions Annotations:** Using `--format=github` adds ~0.5 seconds for annotation processing. This is negligible.
- **Auto-Fix Commits:** If Pint auto-fixes files and commits, the CI step must re-run after the commit. This doubles the CI time for the formatting step.

## Production Considerations

- **Pint Version Pinning:** Pin the Pint version in `composer.json` (`"laravel/pint": "1.18.*"`) to prevent unexpected rule changes. Create a separate PR for Pint version upgrades with review.
- **CI Environment Consistency:** Ensure the CI environment has the same Pint version as local development. Use `composer install --no-dev` carefully—Pint is a dev dependency.
- **CI Cache Strategy:** Cache `.php-cs-fixer.cache` using the CI platform's cache mechanism (GitHub Actions `cache` action). Include the OS, PHP version, and Pint version in the cache key.
- **Monorepo/Modular Approach:** For monorepos or modular applications, run Pint on each module separately to isolate style issues per component.
- **No Style Enforcement on Vendors:** Ensure CI excludes `vendor/`, `storage/`, and other non-source directories. Use the project's existing `.gitignore` or Pint's `exclude` configuration.

## Common Mistakes

- **Not using --test in CI:** Running `pint` (auto-fix) in CI without `--test` modifies files but doesn't fail the build—style issues go undetected
- **Missing cache configuration:** Not caching PHP-CS-Fixer's token cache; each CI run starts from scratch, wasting 5-10 seconds
- **Inconsistent Pint versions:** CI uses a different Pint version than local development; rules differ and CI produces different results than expected
- **Running Pint on vendor files:** Not excluding `vendor/` from Pint scans; formatting third-party code wastes time and may produce undesired changes
- **Auto-fix without Git config:** Running `pint` auto-fix in CI without configuring Git user.email/user.name; the commit fails with authorship errors

## Failure Modes

- **Cached Token Invalidation:** PHP-CS-Fixer cache becomes invalid (php file changes without hash update) causing false positives. Mitigate: clear cache on `composer.lock` changes.
- **CI Timeout on Large Projects:** A full Pint scan of very large projects (5000+ PHP files) may exceed CI runner time limits. Mitigate: exclude generated files; use `--dirty` for targeted checking.
- **Auto-Fix Commit Loop:** Pint auto-fix commits trigger new CI runs, which auto-fix again, causing infinite CI loops. Mitigate: use `[skip ci]` in auto-fix commit messages; run Pint as a separate workflow that doesn't trigger CI.
- **GitHub Actions Annotation Limit:** Exceeding GitHub's 10 annotation limit per step; annotations are truncated. Mitigate: use `--diff` output instead of annotations for large style changes.

## Ecosystem Usage

- **Laravel Projects:** Most Laravel projects with Pint integrate it into GitHub Actions or GitLab CI following these patterns
- **Laravel Packages:** Package maintainers use Pint CI to enforce consistent style across contributions from many developers
- **Laravel Forge:** Forge's Quick Deploy can optionally run Pint as part of the deployment script to format code on the server
- **GitHub Actions Marketplace:** Community actions like `shivammathur/setup-php` and `ramsey/composer-install` are commonly used with Pint CI

## Related Knowledge Units

- laravel-pint
- pint-configuration
- pint-presets
- pre-commit-hooks-code-quality
- static-analysis-ci-integration

## Research Notes

- Pint's `--format=github` output format was added in Pint v1.10+ specifically for GitHub Actions integration
- The `.php-cs-fixer.cache` file is generated by PHP-CS-Fixer and tracked by Pint; it's safe to cache across CI runs
- Pint's exit codes: 0 (clean, no changes), 1 (style issues found in --test mode, or error in fix mode)
- GitHub Actions uses the `::error file=...,line=...,title=...,::` annotation syntax; Pint's `--format=github` outputs this format automatically
