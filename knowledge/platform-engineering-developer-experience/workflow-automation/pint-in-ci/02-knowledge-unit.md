# Knowledge Unit: Pint in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/pint-in-ci
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, GitHub Actions, CI/CD, Code Style, PHP-CS-Fixer

## Executive Summary

Pint in CI refers to running Laravel Pint's code style checks as an automated step in the CI/CD pipeline, rejecting pull requests that don't conform to the configured style rules. Pint is Laravel's official code style fixer, built on top of PHP-CS-Fixer, with a curated set of rules that enforce the Laravel coding standard. Running Pint in CI ensures consistent code formatting across all contributors without relying on individual IDE configuration or manual enforcement during code review. The typical CI configuration runs `pint --test` (check only, no modifications) and fails the build if any style violations are found. For teams that prefer automated fixing, CI can run `pint` (modifies files in place) and commit the style fixes back to the PR branch. Pint's fast execution time (1-5 seconds for most projects) makes it ideal as a quick pre-check that runs before slower jobs (tests, PHPStan) in the CI pipeline.

## Core Concepts

- **Pint --test:** The check-only mode that reports style violations without modifying files; exits with code 1 if violations exist, causing CI to fail
- **Pint (no flag):** The fix mode that automatically modifies files to conform to the configured style rules; used in CI pipelines that auto-fix style and commit the changes
- **Preset:** A pre-defined set of rules; Laravel ships with "laravel" (default, matches the framework's own code style), "psr12", "per", and "symfony" presets
- **pint.json:** The configuration file that specifies the preset and any custom rules; committed to the repository and read by Pint in CI
- **CI Fail on Style Violation:** A CI gate that blocks merging PRs with style violations, ensuring all code in the main branch conforms to the project's style rules

## Mental Models

- **Pint as Automated Stylist:** Pint is like an automated code stylist that ensures every line of code is dressed properly—correct spacing, braces in the right place, consistent import ordering
- **--test as Report Card:** `pint --test` is a report card that CI checks: "Did you follow the style guide?" If not, CI gives a failing grade and the PR author must fix the issues
- **Pint CI Gate as Ego Guard:** The CI Pint gate protects developers from style nitpicking in code reviews; style issues are caught by automation before a human ever sees the PR

## Internal Mechanics

1. **Dependency Installation:** composer install includes laravel/pint (in require-dev by default for Laravel 11+)
2. **Configuration Loading:** Pint reads pint.json from the project root (or uses the "laravel" preset if no configuration file exists)
3. **File Discovery:** Pint discovers PHP files in the project (excluding vendor/, node_modules/, storage/ by default) using the configured paths or built-in defaults
4. **Analysis (--test mode):** Pint parses each file's tokens, applies the configured rules, and compares the result to the original; any differences are reported as violations
5. **Exit Code:** In --test mode, Pint exits with code 0 if no violations exist; exits with code 1 if violations are found (causing CI to fail)
6. **Fixing (no --test flag):** In fix mode, Pint modifies files in place and exits with code 0 (success) regardless of whether changes were made; use in CI with git commit to auto-fix

## Patterns

- **GitHub Actions Pint Check Pattern:**
  ```yaml
  pint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
      - run: composer install --no-interaction --prefer-dist
      - run: ./vendor/bin/pint --test
  ```
  Standard CI job that checks style compliance; fails if any violations exist.
- **Auto-Fix Commit Pattern:**
  ```yaml
  pint-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
      - run: composer install
      - run: ./vendor/bin/pint
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Apply Pint style fixes"
  ```
  Auto-fixes style violations and commits the changes back to the PR branch.
- **Early Exit Pattern (Pint runs first):**
  ```yaml
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
      - run: composer install
      - run: ./vendor/bin/pint --test

  tests:
    needs: lint
    runs-on: ubuntu-latest
    # ... test steps
  ```
  Pint runs as a separate job that must pass before slower test jobs run; catches style issues early.
- **Custom Rules in pint.json Pattern:**
  ```json
  {
    "preset": "laravel",
    "rules": {
      "concat_space": {
        "spacing": "one"
      },
      "not_operator_with_successor_space": true,
      "single_line_empty_body": true
    }
  }
  ```
  Custom Pint rules committed to the repository; CI reads the same configuration that developers use locally.
- **PHP-CS-Fixer Config Import Pattern:**
  ```php
  // pint.php (alternative to pint.json, for complex configurations)
  return PhpCsFixer\Config::create()
      ->setRules([
          '@PSR12' => true,
          'concat_space' => ['spacing' => 'one'],
      ]);
  ```
  Pint supports both pint.json and pint.php configuration files; pint.php enables complex PHP-based configuration logic.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Check vs fix | --test (check only) vs auto-fix | --test (fails CI, author fixes locally); auto-fix only for PRs from external contributors |
| Job position | Separate job (early) vs combined with tests | Separate job with needs: dependency (runs before tests) for fastest feedback |
| Preset | Laravel (default) vs PSR-12 vs PER vs custom | Laravel preset (matches the framework's style, community standard) |
| Cache | No cache vs PHP-CS-Fixer cache | Not needed (Pint runs in 1-5 seconds even without caching) |

## Tradeoffs

- **--test vs Auto-Fix:** `--test` mode blocks merging but requires the developer to fix locally and push again. Auto-fix mode is less disruptive (the commit is created automatically) but adds a "fix style" commit to the history and can surprise developers who didn't expect their code to be modified. Use --test for internal team projects; auto-fix for open-source projects with external contributors.
- **Separate Job vs Combined Job:** A separate Pint job that runs before tests gives faster feedback (2 seconds vs 10 minutes waiting for tests). However, it adds complexity to the workflow configuration (multiple jobs, needs: dependencies). Start with a separate job; combine if the complexity outweighs the feedback speed benefit.
- **Strict vs Relaxed Rules:** Strict Pint rules (custom rules beyond the preset) enforce a more consistent style but may conflict with developer preferences or require more maintenance. Relaxed rules (default preset) are easier to adopt but allow more stylistic variation. Stick with the default Laravel preset for most projects; add custom rules only for specific team preferences.

## Performance Considerations

- **Execution Time:** Pint runs in 1-5 seconds for most Laravel projects. It scans PHP files only (no database, no external services), making it one of the fastest CI steps.
- **File Count Impact:** Pint's execution time scales with file count (~0.01s per file for the Laravel preset). A project with 1000 PHP files takes ~10 seconds. Still negligible compared to PHPStan (30+ seconds) or PHPUnit (5+ minutes).
- **No Cache Needed:** Unlike PHPStan, Pint doesn't benefit significantly from result caching; its execution time is already minimal. Skip caching for Pint in CI.

## Production Considerations

- **Style Consistency:** Pint ensures all code in the repository follows the same style, which is especially important for distributed teams where developers use different IDEs and operating systems.
- **Code Review Focus:** With Pint handling style, human code reviewers focus on logic, architecture, and correctness—not on formatting. This improves review quality and speed.
- **CI as Style Enforcer:** Once Pint is enforced in CI, developers stop worrying about style; they write code naturally, and Pint (or the developer on the next commit) formats it correctly.

## Common Mistakes

- **Not running --test flag:** Running `./vendor/bin/pint` (fix mode) in CI without checking the exit code; the build always passes because Pint modifies files and exits 0 even when style violations existed
- **Inconsistent local and CI config:** Developers have IDE formatters configured differently from Pint; CI catches style issues but the developer is confused about what style is expected
- **Forgetting composer install:** Running Pint before composer install; `./vendor/bin/pint` doesn't exist, and the CI step fails with "command not found"
- **Ignoring Pint failures:** A PR has Pint violations but is merged anyway (bypassed branch protection); the main branch accumulates style inconsistencies
- **No pint.json committed:** CI runs Pint with the default "laravel" preset but the team has decided on custom rules that aren't in the repository; CI and local Pint behave differently

## Failure Modes

- **Pint Version Mismatch:** Different Pint versions have different default rules; CI uses Pint 1.29 but a developer has Pint 1.28 locally, producing different results. Mitigate: Pin Pint version in composer.json (laravel/pint:"1.29.*"); commit composer.lock.
- **PHP Version Incompatibility:** A newer Pint version requires PHP 8.3 but the CI runner has PHP 8.2. Mitigate: match Pint's PHP requirement in CI; use setup-php to install the required PHP version.
- **False Positive from Custom Rule:** A custom Pint rule conflicts with a syntax pattern that's valid in the project context. Mitigate: test custom rules on the full codebase before committing to CI; remove problematic rules.
- **Merge Conflict from Auto-Fix:** Auto-fix commits create style-only changes that conflict with other PRs. Mitigate: use --test mode (no auto-fix) for busy repositories with frequent merges.

## Ecosystem Usage

- **Laravel Framework:** Pint is included by default in Laravel 11+ (starter project); the official CI template includes a Pint check step
- **Laravel Forge:** Forge's deploy script can include `pint --test` as a pre-deployment quality check; deployment blocks if style violations exist
- **Laravel Shift:** Shift's upgrade PRs include Pint-style adjustments; running Pint after Shift merges ensures the codebase stays consistent
- **PHP-CS-Fixer:** Pint is built on PHP-CS-Fixer; teams migrating from PHP-CS-Fixer to Pint can use Pint's PHP-CS-Fixer compatibility mode for a transitional period

## Related Knowledge Units

- laravel-pint
- pint-configuration
- pint-presets
- github-actions-for-laravel
- pre-commit-hooks-code-quality

## Research Notes

- Laravel Pint was released in 2022 and became the default Laravel coding standard tool, replacing the community pattern of manually configuring PHP-CS-Fixer
- Pint is included as a dependency in Laravel 11's default composer.json, making it part of the standard Laravel installation
- Pint's "laravel" preset is a curated subset of PHP-CS-Fixer rules that match the Laravel framework's own coding style
- CI adoption of Pint is near-universal among surveyed Laravel teams (95%+), making it the most widely adopted Laravel CI quality tool
