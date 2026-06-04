# Knowledge Unit: Static Analysis CI Integration

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/static-analysis-ci-integration
- **Maturity:** Mature
- **Related Technologies:** PHPStan, Larastan, GitHub Actions, GitLab CI, CI/CD, PHP

## Executive Summary

Integrating static analysis (PHPStan with Larastan) into CI pipelines enforces type safety and catches potential bugs automatically on every push. The standard pattern is running `phpstan analyse --memory-limit=1G` as a CI step, failing the build if new errors are found. Advanced patterns include: baseline comparison (fail only on new errors), change-detection for incremental analysis, GitHub Actions annotations for inline error display in PR diffs, matrix testing across multiple PHP/Laravel versions, and result caching for faster runs. Static analysis in CI should be treated as a mandatory gate—like tests and code style—that blocks merging if analysis fails. Effective CI integration requires consistent tool versions, a well-tuned config file, and clear error reporting that helps developers fix issues quickly.

## Core Concepts

- **Analysis Command:** `vendor/bin/phpstan analyse --memory-limit=1G` is the standard CI command; exits 0 on clean, 1 on errors
- **Baseline Comparison:** CI runs with a baseline; only new errors (not in baseline) cause CI failure. Requires a committed baseline file.
- **Error Formatting:** PHPStan supports output formats: `github` (GitHub Actions annotations), `gitlab` (GitLab CI), `json`, `table`, `checkstyle`, `junit`
- **Result Cache:** PHPStan caches analysis results; cache restoration in CI speeds up runs by 5-10x
- **Parallel Processing:** PHPStan's `--parallel` flag distributes analysis across CPU cores; important for large projects
- **Configuration Path:** `--configuration=phpstan.neon` specifies the config file; CI may use a separate `phpstan.ci.neon` with stricter settings

## Mental Models

## Internal Mechanics

## Patterns

- **Early Gate Pattern:** Run PHPStan early in the CI pipeline (after linting, before tests). Fast (<2 min) compared to test suites (5-20 min). Fail fast on type errors.
- **Baseline Protection Pattern:** On each CI run, regenerate the baseline and compare it against the committed baseline. If the regenerated baseline has more errors (new issues), fail. If it has fewer errors (progress was made), approve.
- **Annotation Pattern:** Use `--error-format=github` for GitHub Actions to show inline annotations on PR diffs. Each PHPStan error appears as a note on the relevant line in the PR.
- **Matrix Pattern:** Test against multiple PHP versions (8.1, 8.2, 8.3) and Laravel versions (10, 11) to ensure cross-version type safety.
- **Dependency Preload Pattern:** Run `composer dump-autoload` before PHPStan to ensure the autoloader is fresh and all classes are discoverable.
- **Cached Analysis Pattern:** Restore PHPStan's result cache (in `tmp/phpstan/`) from CI cache storage. Cache key should include composer.lock hash and PHPStan version.
- **Separate Config Pattern:** Use `phpstan.neon` for development (faster, lower level) and `phpstan.ci.neon` for CI (strict, full scan, baseline, specific format).

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Analysis scope | Full project vs changed files only | Full project (thorough); changed files only for large monorepos |
| Baseline strategy | Regenerate on each run vs fail on new errors vs manual regeneration | Fail on new errors (compare baselines); regenerate monthly |
| Error output | Formatted (github/checkstyle) vs plain table | Formatted for developer visibility; plain for CI logs |
| Parallelism | Single process vs parallel | Parallel (2-4 processes) for projects with 500+ files |

## Tradeoffs

- **Full Scan vs Changed Files:** Full scan catches all issues (including existing ones that may affect new code) but takes longer. Changed-files scan is faster but may miss cross-file type errors introduced by the change.
- **Strict CI vs Flexible CI:** Strict CI fails on any static analysis error (including pre-existing ones). Flexible CI compares against baseline and fails only on new errors. Strict is simpler; flexible requires baseline management.
- **CI Speed vs Thoroughness:** Higher analysis levels catch more bugs but take longer. Level 6 is the recommended balance for CI—good coverage without excessive runtime.

## Performance Considerations

- **Analysis Time:** PHPStan on a medium Laravel app (500 files) takes 30-60 seconds in CI (cold cache) or 10-20 seconds (warm cache). Large apps (2000+ files) take 3-10 minutes cold, 1-3 minutes warm.
- **Cache Impact:** PHPStan's result cache reduces subsequent analysis time by 60-80%. CI cache restoration adds 2-5 seconds but saves 30-120 seconds. Net positive for frequent commits.
- **Parallel Execution:** `--parallel` with 2-4 processes reduces analysis time by 30-50%. On CI runners with multiple CPUs, this is a significant optimization.
- **Memory Configuration:** PHPStan with Larastan needs 512MB-2GB RAM. Configure `--memory-limit=1G` in CI. Smaller runners may need `--memory-limit=512M`.

## Production Considerations

- **CI Runner Requirements:** PHPStan needs adequate memory (1GB+ recommended) and CPU (2+ cores for parallel). Ensure CI runners meet these requirements.
- **Timeout Configuration:** PHPStan analysis may exceed CI job time limits for very large projects. Set appropriate timeouts or split analysis across multiple jobs.
- **Version Locking:** Lock `phpstan/phpstan` and `larastan/larastan` versions in `composer.json`. Unpinned versions cause CI to fail unexpectedly after breaking releases.
- **Config Versioning:** Store `phpstan.neon`, `phpstan.ci.neon`, and `phpstan-baseline.neon` in version control. Changes to these files should be reviewed in PRs.
- **Autoloading Check:** Run `composer dump-autoload` before PHPStan in CI to ensure all classes are discoverable. Stale autoload caches cause false positives.

## Common Mistakes

- **Not using a baseline in CI:** Running PHPStan at strict levels without a baseline on a mature codebase creates hundreds of errors that overwhelm developers; use baseline for gradual adoption
- **Forgetting --memory-limit:** PHPStan exhausts default PHP memory (128MB) and crashes; CI fails with a memory error instead of analysis errors
- **Inconsistent config between local and CI:** Developers use one config locally, CI uses another; analysis results differ, causing confusion and CI failures that can't be reproduced locally
- **Not caching the result cache:** Each CI run analyzes from scratch; 30-120 seconds wasted per run when caching would reduce it to 10-20 seconds
- **Running on vendor directory:** PHPStan scans vendor by default, adding minutes to analysis time and generating false positives from third-party code
- **Missing autoload dump:** New classes added in the PR aren't in the autoloader cache; PHPStan reports "class not found" errors for valid classes

## Failure Modes

- **Out of Memory in CI:** CI runner has insufficient memory for PHPStan analysis. Mitigate: increase `--memory-limit`; use larger CI runners; exclude unnecessary paths.
- **Stale Cache Causing False Positives:** Result cache doesn't reflect recent file changes, causing incorrect analysis. Mitigate: clear cache on composer.lock changes; use file-hash-based cache keys.
- **CI Timeout:** Analysis exceeds CI job timeout (typically 30-60 minutes for free tiers). Mitigate: optimize with parallel processing; split analysis across jobs; reduce scope.
- **Extension Loading Failure:** A required PHPStan extension isn't installed or loaded. Mitigate: check Composer dependencies; verify extension registration in phpstan.neon.

## Ecosystem Usage

- **GitHub Actions:** The most common CI platform for Laravel static analysis; PHPStan with `--error-format=github` provides native PR annotations
- **GitLab CI:** GitLab CI with `--error-format=gitlab` provides merge request annotations
- **Laravel Forge:** Forge runs Pint but not PHPStan in its default deployment pipeline; teams add PHPStan as a custom deployment step
- **Laravel Vapor:** Vapor CI/CD can include PHPStan as a pre-deployment quality gate
- **CircleCI/Travis/Bitbucket Pipelines:** All support PHPStan integration with the same patterns (command execution, exit code check, artifact collection)

## Related Knowledge Units

- phpstan-in-ci
- phpstan-baseline-patterns
- phpstan-config-for-laravel
- pint-ci-integration
- automated-testing-in-ci

## Research Notes

- PHPStan 2.x introduced `--pro` for CI integration with improved parallel processing and memory management
- GitHub Actions annotations via `--error-format=github` were introduced in PHPStan 1.8+ and have become the standard for Laravel CI pipelines
- The baseline comparison pattern (regenerate baseline in CI, diff against committed) was popularized by the Laravel community and is documented in Laravel's deployment guides
- PHPStan's CI integration typically adds 1-3 minutes to a Laravel CI pipeline, making it one of the slower steps but one of the most valuable for catching type-related bugs
