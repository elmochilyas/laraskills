# Knowledge Unit: PHPStan in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/phpstan-in-ci
- **Maturity:** Mature
- **Related Technologies:** PHPStan, Larastan, GitHub Actions, CI/CD, Static Analysis, Laravel

## Executive Summary

PHPStan in CI refers to running PHPStan static analysis as an automated step in the CI/CD pipeline, blocking pull requests that introduce new errors. For Laravel teams, PHPStan (via Larastan) catches type errors, missing return types, incorrect method calls, unused variable assignments, and potentially unsafe array access. Running PHPStan in CI ensures that static analysis quality is maintained across all code changes, not just when developers remember to run it locally. The typical CI configuration installs PHPStan and Larastan via Composer, runs phpstan analyse against the configured level (5-6 for Laravel projects), and fails the build if any errors are found (excluding baseline errors). PHPStan's baseline feature is critical for CI adoption: it captures all existing errors into a baseline file, allowing the team to enforce "no new errors" on every PR without requiring all legacy code to be fixed upfront.

## Core Concepts

- **PHPStan Level:** The strictness level (0-9) that controls which rules are enforced; Laravel teams typically use level 5 (basic type safety) or level 6 (stricter type checking with generics)
- **Baseline:** A file (phpstan-baseline.neon) that captures all existing PHPStan errors; CI runs with --baseline to only report new errors, not existing ones
- **Result Cache:** PHPStan's cache file (.phpstan.result.cache) that stores analysis results for unchanged files; dramatically speeds up repeated runs in CI (30+ seconds → 2-5 seconds)
- **Memory Limit:** PHPStan analysis of large Laravel codebases can consume 512MB-2GB of memory; CI runners must be configured with sufficient memory (COMPOSER_MEMORY_LIMIT, php -d memory_limit)
- **Error Reporting Format:** PHPStan supports multiple output formats (table, json, github-actions, gitlab) for integration with CI systems; the github-actions format annotates errors directly on PR diffs

## Mental Models

- **PHPStan as Automated Code Reviewer:** PHPStan acts as a tireless code reviewer that checks every line of every PR for type safety issues, working 24/7 without fatigue
- **Baseline as Technical Debt Ledger:** The baseline file is a ledger of known type issues; it says "we know about these errors and will fix them eventually, but they won't block new work"
- **Level as Quality Floor:** The PHPStan level is the minimum acceptable quality floor; no PR can lower the floor (introduce new errors below the current level)

## Internal Mechanics

1. **Dependency Installation:** composer install includes phpstan/phpstan and larastan/larastan in require-dev
2. **Configuration:** phpstan.neon (or phpstan.neon.dist) is read by PHPStan, specifying the level (level: 6), paths to analyse (app/, config/, routes/), and Larastan extensions
3. **Baseline Loading:** If phpstan-baseline.neon exists, PHPStan loads it and suppresses all errors listed in it; only new errors (not in the baseline) are reported
4. **Result Cache:** PHPStan reads .phpstan.result.cache if available; unchanged files are not re-analysed, reducing execution time by 80-90%
5. **Analysis Execution:** PHPStan parses all PHP files, builds an abstract syntax tree, and applies rules at the configured level; it checks type compatibility, method signatures, docblock correctness
6. **Output Formatting:** Results are formatted for the CI platform (github-actions format annotates errors inline on PR diffs; table format for log files)
7. **Exit Code:** PHPStan exits with code 0 if no errors (or only baseline errors); exits with code 1 if any new errors are found, causing the CI step to fail

## Patterns

- **GitHub Actions PHPStan Pattern:**
  ```yaml
  phpstan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
          extensions: mbstring, pdo_mysql, bcmath
      - uses: actions/cache@v3
        with:
          path: |
            vendor
            .phpstan.result.cache
          key: phpstan-${{ hashFiles('composer.lock') }}-${{ hashFiles('phpstan.neon') }}
      - run: composer install --no-interaction --prefer-dist
      - run: php -d memory_limit=2G ./vendor/bin/phpstan analyse --error-format=github
  ```
  Runs PHPStan with GitHub Annotations output; errors appear inline on the PR diff.
- **Baseline Generation Pattern:**
  ```bash
  ./vendor/bin/phpstan analyse --generate-baseline
  ```
  Generates phpstan-baseline.neon capturing all current errors; commit this file to establish the "zero new errors" policy.
- **Baseline Update Pattern:**
  ```bash
  # In a dedicated PR or cleanup sprint
  ./vendor/bin/phpstan analyse --generate-baseline
  git add phpstan-baseline.neon
  git commit -m "chore: update PHPStan baseline"
  ```
  After fixing existing errors, regenerate the baseline; the baseline shrinks over time as errors are fixed.
- **Level Increment Pattern:**
  ```bash
  # Step 1: Enable new level
  # In phpstan.neon: level: 6

  # Step 2: Generate baseline at new level
  ./vendor/bin/phpstan analyse --generate-baseline

  # Step 3: Fix errors one by one; regenerate baseline after each fix
  ```
  When increasing PHPStan level, generate a baseline at the new level, then fix errors incrementally.
- **GitHub Annotations Pattern:**
  ```yaml
  - run: ./vendor/bin/phpstan analyse --error-format=github
  ```
  The --error-format=github option outputs errors in GitHub Annotations format; errors are displayed inline on the PR Files Changed tab and in the CI check run summary.
- **Memory Limit Pattern:**
  ```yaml
  - run: php -d memory_limit=2G ./vendor/bin/phpstan analyse
  ```
  Sets PHP memory limit to 2GB for the PHPStan process; prevents out-of-memory failures on large codebases.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| PHPStan level | Level 5 vs level 6 vs level 7 | Level 6 (balances strictness with practicality for Laravel's magic methods and facades) |
| Baseline strategy | Per-project vs per-team vs global | Per-project baseline (specific to the codebase's current state) |
| Cache strategy | Result cache only vs full vendor cache | Both: vendor/ cache for composer install speed + .phpstan.result.cache for analysis speed |
| Error format | Table vs github vs json | github (annotations on PR); table (log files for debugging) |

## Tradeoffs

- **Level 5 vs Level 6:** Level 5 catches most practical type errors (missing return types, wrong parameter types) without requiring extensive docblock annotations. Level 6 requires generic type annotations (Collection<User>, etc.) which add verbosity but catch more edge cases. Start at level 5; move to level 6 when the team is comfortable with generic annotations.
- **Baseline vs Fix All:** Baseline allows incremental adoption (no new errors) but doesn't fix existing issues. Fixing all errors upfront is ideal but impractical for large legacy codebases. Use baseline for legacy projects; aim for zero-baseline (all errors fixed) for new projects.
- **Result Cache vs Fresh Analysis:** Result cache speeds up CI by 5-10x but may produce different results if the cache is stale (rare, but possible with cache corruption). Fresh analysis is slower but always correct. Use cached analysis with cache invalidation on phpstan.neon changes.

## Performance Considerations

- **Analysis Time with Cache:** PHPStan run with warm result cache: 2-10 seconds (or less for incremental changes). Without cache: 30 seconds to 5 minutes depending on codebase size.
- **Memory Usage:** PHPStan analysis of a typical Laravel project (500+ files): 256MB-1GB RAM. Set php -d memory_limit=2G to handle large codebases with complex generics.
- **Cache Invalidation:** PHPStan invalidates cache when phpstan.neon, phpstan-baseline.neon, or any analysed PHP file changes. First run after cache invalidation: 30 seconds to 5 minutes.
- **Parallel Analysis (PHPStan 2.0):** PHPStan 2.0+ supports parallel analysis, using multiple CPU cores for faster execution. Enable with `--parallel` flag or configuration `parallel: true`.

## Production Considerations

- **Baseline Limit:** A large baseline file (1000+ errors) indicates significant technical debt. Schedule dedicated sprints to reduce the baseline; a baseline of <50 errors is manageable.
- **Level Upgrades:** When upgrading PHPStan level, run the new level on CI as a non-blocking check first (allow failure); after the baseline is stable, make it blocking.
- **Deployment Gate:** PHPStan passing is a required status check for merging PRs; this prevents type errors from reaching production. Configure GitHub branch protection to require PHPStan passing.

## Common Mistakes

- **No baseline in legacy projects:** Enabling PHPStan at level 6 on a legacy codebase with thousands of errors; CI immediately fails on every PR with the full error count. Always generate a baseline first.
- **Result cache not cached in CI:** .phpstan.result.cache is not cached between CI runs; every run does a full analysis, taking 2-5 minutes instead of 5-10 seconds.
- **Ignoring baseline growth:** The baseline grows because developers use --generate-baseline to hide new errors instead of fixing them; the team misses the gradual quality improvement.
- **Wrong memory limit:** PHPStan fails with "Allowed memory size exhausted" because the CI runner's PHP memory limit is 128MB. Set memory_limit=2G explicitly.
- **Facade magic unchecked:** PHPStan/Larastan has stub files for Laravel facades; if stubs are missing or outdated, PHPStan reports false positives on every facade call.

## Failure Modes

- **False Positives at Level 6:** Larastan may report errors on Laravel's magic methods (dynamic __call in facades, Eloquent's dynamic query scopes) that are not actual bugs. Mitigate: use Larastan's latest stubs; add ignore errors for known false positives.
- **Memory Exhaustion on Large Projects:** PHPStan runs out of memory on a codebase with 2000+ PHP files. Mitigate: increase memory_limit; use --memory-limit flag; upgrade to PHPStan 2.0+ with parallel processing.
- **Cache Corruption:** .phpstan.result.cache becomes corrupted and PHPStan reports inaccurate results. Mitigate: clear cache on phpstan.neon changes; invalidate cache weekly via cron.
- **Baseline Merge Conflicts:** Multiple branches generate baselines simultaneously; phpstan-baseline.neon has merge conflicts. Mitigate: generate baseline on main only; fix conflicts by regenerating baseline after merge.

## Ecosystem Usage

- **Larastan (laravel-phpstan):** The official Laravel extension for PHPStan; provides Laravel-specific stubs (facades, Eloquent, request, response) and rules (unused routes, validation rules, model property access)
- **Laravel Pint:** Complementary tool; Pint handles code style, PHPStan handles type safety; both run in CI for comprehensive quality enforcement
- **Laravel Forge:** Forge's CI integration can require PHPStan passing before deployment; PHPStan acts as a quality gate in the deployment pipeline
- **Laravel Shift:** Shift can automatically fix some PHPStan errors during upgrades; run Shift and then verify PHPStan passes in CI

## Related Knowledge Units

- laravel-phpstan
- phpstan-config-for-laravel
- phpstan-baseline-patterns
- pint-in-ci
- static-analysis-ci-integration

## Research Notes

- PHPStan 2.0 (released March 2025) introduced parallel analysis, improved generics support, and a redesigned result cache with higher cache hit rates and faster invalidation
- Larastan v3.x (supported PHPStan 2.0) updated its Laravel stubs for Laravel 11, reducing false positives on facades and Eloquent relationships
- The "baseline then level up" pattern is the recommended adoption strategy: generate baseline at the current level, set CI to block new errors, then gradually increase the level over multiple sprints
- Teams that adopt PHPStan in CI report a 40-60% reduction in type-related production bugs and a significant improvement in IDE autocompletion reliability
