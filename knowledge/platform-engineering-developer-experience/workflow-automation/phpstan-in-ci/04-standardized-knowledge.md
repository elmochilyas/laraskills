# Experience Curation: PHPStan in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/phpstan-in-ci
- **Maturity:** Mature
- **Related Technologies:** PHPStan, Larastan, GitHub Actions, CI/CD, Static Analysis, Laravel
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
PHPStan in CI refers to running PHPStan static analysis as an automated step in the CI/CD pipeline, blocking pull requests that introduce new errors. For Laravel teams, PHPStan (via Larastan) catches type errors, missing return types, incorrect method calls, unused variable assignments, and potentially unsafe array access. Running PHPStan in CI ensures that static analysis quality is maintained across all code changes, not just when developers remember to run it locally. PHPStan's baseline feature is critical for CI adoption: it captures all existing errors into a baseline file, allowing the team to enforce "no new errors" on every PR without requiring all legacy code to be fixed upfront.

## Core Concepts
- **PHPStan Level:** The strictness level (0-9) controlling which rules are enforced; Laravel teams typically use level 5 (basic type safety) or level 6 (stricter type checking with generics)
- **Baseline:** A file (phpstan-baseline.neon) that captures all existing PHPStan errors; CI runs with --baseline to only report new errors
- **Result Cache:** PHPStan's cache file (.phpstan.result.cache) that stores analysis results for unchanged files; speeds up repeated CI runs (30+ seconds → 2-5 seconds)
- **Memory Limit:** PHPStan analysis of large Laravel codebases can consume 512MB-2GB of memory; CI runners must be configured with sufficient memory
- **Error Reporting Format:** PHPStan supports multiple output formats; the github-actions format annotates errors directly on PR diffs

## When To Use
- Every Laravel project with multiple contributors (catches type errors before they reach production)
- Projects migrating to newer PHP versions (PHPStan catches incompatibilities)
- Teams that want to enforce type safety without requiring strict types in every file
- Legacy codebases being gradually improved (baseline enables incremental adoption)
- Projects with high reliability requirements (financial, healthcare, compliance)

## When NOT To Use
- Prototype or short-lived projects where analysis overhead isn't justified
- Projects already using a different static analysis tool (Psalm, Phan) with established CI integration
- Very small projects (< 10 PHP files) where manual review is sufficient

## Best Practices
- **WHY:** Use the baseline feature for legacy codebases; generate a baseline before enabling PHPStan in CI to capture existing errors, then enforce "no new errors" on every PR
- **WHY:** Cache .phpstan.result.cache between CI runs; without caching, every CI run does a full analysis taking 2-5 minutes instead of 5-10 seconds
- **WHY:** Use level 6 for Laravel projects (balances strictness with practicality for Laravel's magic methods and facades); start at level 5 if the team is new to static analysis
- **WHY:** Use `--error-format=github` for GitHub Actions; errors appear inline on the PR diff, providing immediate feedback to the author
- **WHY:** Set `php -d memory_limit=2G` explicitly in CI; PHPStan can exhaust default memory on large Laravel projects (500+ files)

## Architecture Guidelines
- **GitHub Actions PHPStan Pattern:** Run PHPStan with GitHub Annotations output; errors appear inline on the PR diff
- **Baseline Generation Pattern:** Run `phpstan analyse --generate-baseline` to capture all current errors; commit the baseline file to establish the "zero new errors" policy
- **Baseline Update Pattern:** In a dedicated PR or cleanup sprint, regenerate the baseline after fixing errors; the baseline shrinks over time
- **Level Increment Pattern:** When increasing PHPStan level, generate a baseline at the new level, then fix errors incrementally
- **GitHub Annotations Pattern:** Use `--error-format=github` for errors displayed inline on PR Files Changed tab
- **Memory Limit Pattern:** Set `php -d memory_limit=2G` for the PHPStan process to prevent OOM failures
- **PHPStan Level:** Level 6 for most projects; level 5 as a starting point for teams new to static analysis

## Performance
- PHPStan with warm result cache: 2-10 seconds. Without cache: 30 seconds to 5 minutes depending on codebase size
- PHPStan analysis of a typical Laravel project (500+ files): 256MB-1GB RAM. Set `php -d memory_limit=2G` for large codebases
- Cache is invalidated when phpstan.neon, phpstan-baseline.neon, or any analysed PHP file changes
- PHPStan 2.0+ supports parallel analysis with `--parallel` flag, using multiple CPU cores for faster execution
- Teams that adopt PHPStan in CI report 40-60% reduction in type-related production bugs

## Security
- PHPStan can catch security-relevant type issues: unchecked user input flowing into sensitive operations, improper type handling in authorization logic
- Ensure PHPStan configuration and baseline are committed to the repository (not in .gitignore); all team members should see and review the analysis rules
- PHPStan stubs for Laravel facades must be kept up to date; outdated stubs cause false positives or miss real issues
- PHPStan passing should be a required status check for merging PRs to prevent type errors from reaching production

## Common Mistakes

### No baseline in legacy projects
- **Description:** Enabling PHPStan at level 6 on a legacy codebase with thousands of errors
- **Consequence:** CI immediately fails on every PR with the full error count; team disables PHPStan entirely
- **Better Approach:** Generate a baseline first; enforce "no new errors" rather than "zero errors"

### Result cache not cached in CI
- **Description:** .phpstan.result.cache is not cached between CI runs
- **Consequence:** Every CI run does a full analysis taking 2-5 minutes instead of 5-10 seconds
- **Better Approach:** Add .phpstan.result.cache to the CI cache configuration with appropriate cache keys

### Ignoring baseline growth
- **Description:** Developers use `--generate-baseline` to hide new errors instead of fixing them
- **Consequence:** The baseline grows unchecked; the team misses gradual quality improvement
- **Better Approach:** Regenerate baseline only in dedicated cleanup PRs; fix new errors before merging

### Wrong memory limit
- **Description:** PHPStan fails with "Allowed memory size exhausted" because CI runner's PHP memory limit is 128MB
- **Consequence:** CI step fails; analysis never completes
- **Better Approach:** Set `php -d memory_limit=2G` explicitly in the CI command

### Facade magic unchecked
- **Description:** PHPStan/Larastan stubs for Laravel facades are missing or outdated
- **Consequence:** PHPStan reports false positives on every facade call; developers lose trust in the tool
- **Better Approach:** Keep Larastan up to date; add ignore errors for known false positives

## Anti-Patterns
- **Zero-baseline requirement from day one:** Requiring all existing errors to be fixed before enabling PHPStan in CI; impractical for legacy projects
- **Hiding errors with @phpstan-ignore-line:** Using inline ignore annotations instead of fixing actual type issues; accumulates technical debt
- **Running PHPStan at level 0:** Too low to catch meaningful errors; gives false confidence
- **No PHPStan in CI at all:** Relying on developers to run PHPStan locally; it's consistently forgotten
- **Stale baseline never reduced:** Generating a baseline once and never fixing any of the captured errors

## Examples
- **Larastan (laravel-phpstan):** The official Laravel extension for PHPStan; provides Laravel-specific stubs and rules
- **Laravel Pint:** Complementary tool; Pint handles code style, PHPStan handles type safety; both run in CI
- **Laravel Forge:** Forge's CI integration can require PHPStan passing before deployment
- **Laravel Shift:** Shift can automatically fix some PHPStan errors during upgrades

## Related Topics
- laravel-phpstan (the Laravel extension for PHPStan)
- phpstan-config-for-laravel (configuring PHPStan for Laravel projects)
- phpstan-baseline-patterns (managing the baseline file)
- pint-in-ci (complementary code style tool in CI)
- static-analysis-ci-integration (broader CI static analysis patterns)

## AI Agent Notes
- PHPStan 2.0 (March 2025) introduced parallel analysis, improved generics support, and a redesigned result cache
- The "baseline then level up" pattern is the recommended adoption strategy: generate baseline at current level, block new errors, then gradually increase the level over multiple sprints
- For legacy projects, start at level 5 with a baseline; for new projects, aim for level 6 with zero baseline
- PHPStan passing as a required status check is a key quality gate in modern Laravel CI pipelines
- Teams report 40-60% reduction in type-related production bugs after adopting PHPStan in CI

## Verification
- [ ] PHPStan is configured with an appropriate level (5 or 6) in phpstan.neon
- [ ] Larastan is installed and configured for Laravel-specific analysis
- [ ] Baseline file (phpstan-baseline.neon) is generated and committed
- [ ] CI runs PHPStan with `--error-format=github` for inline PR annotations
- [ ] .phpstan.result.cache is cached between CI runs
- [ ] Memory limit is set appropriately (`php -d memory_limit=2G`)
- [ ] PHPStan passing is a required status check for PR merges
- [ ] Baseline is reviewed and reduced periodically
- [ ] Larastan stubs are up to date with the installed Laravel version
- [ ] False positives are documented and have ignore rules in phpstan.neon
