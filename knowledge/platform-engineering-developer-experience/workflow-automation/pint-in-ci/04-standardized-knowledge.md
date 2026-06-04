# Experience Curation: Pint in CI

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/pint-in-ci
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, GitHub Actions, CI/CD, Code Style, PHP-CS-Fixer
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Pint in CI refers to running Laravel Pint's code style checks as an automated step in the CI/CD pipeline, rejecting pull requests that don't conform to the configured style rules. Pint is Laravel's official code style fixer, built on top of PHP-CS-Fixer, with a curated set of rules that enforce the Laravel coding standard. Running Pint in CI ensures consistent code formatting across all contributors without relying on individual IDE configuration or manual enforcement during code review. The typical CI configuration runs `pint --test` (check only, no modifications) and fails the build if any style violations are found. Pint's fast execution time (1-5 seconds for most projects) makes it ideal as a quick pre-check that runs before slower jobs (tests, PHPStan) in the CI pipeline.

## Core Concepts
- **Pint --test:** Check-only mode that reports style violations without modifying files; exits with code 1 if violations exist, causing CI to fail
- **Pint (no flag):** Fix mode that automatically modifies files to conform to configured style rules
- **Preset:** A pre-defined set of rules; Laravel ships with "laravel" (default), "psr12", "per", and "symfony" presets
- **pint.json:** Configuration file that specifies the preset and custom rules; committed to the repository and used by Pint in CI
- **CI Fail on Style Violation:** A CI gate that blocks merging PRs with style violations, ensuring all code in main conforms to the project's style rules
- **Pint as Automated Stylist:** Ensures every line of code is styled consistently—correct spacing, braces, import ordering

## When To Use
- Every Laravel project with multiple contributors (eliminates style inconsistency)
- Projects where code review time should focus on logic, not formatting
- Open-source projects where external contributors may have different IDE configurations
- Teams establishing coding standards without manual enforcement

## When NOT To Use
- Solo projects where the single developer controls their own IDE formatting
- Projects using an alternative code style tool (PHP-CS-Fixer directly) with established configuration
- Legacy projects where running Pint would create massive, review-blocking diffs (introduce gradually)

## Best Practices
- **WHY:** Use `--test` mode (check only) for internal team projects; auto-fix mode for open-source projects with external contributors. `--test` fails CI and requires the developer to fix locally; auto-fix commits the fix automatically
- **WHY:** Run Pint as a separate job before slower test jobs using needs: dependency; Pint runs in 1-5 seconds and catches style issues before developers wait 10+ minutes for tests to fail on style
- **WHY:** Commit pint.json to the repository with the preset and custom rules; without it, CI and local Pint may use different configurations, causing confusion
- **WHY:** Pin Pint version in composer.json (`laravel/pint:"1.29.*"`) and commit composer.lock; different Pint versions have different default rules, producing different results
- **WHY:** Use the "laravel" preset as the default; it matches the Laravel framework's own coding style and is the community standard

## Architecture Guidelines
- **GitHub Actions Pint Check Pattern:** Separate job running `./vendor/bin/pint --test` after composer install; fails if violations exist
- **Auto-Fix Commit Pattern:** Runs `./vendor/bin/pint` (no --test) then uses git-auto-commit-action to commit style fixes back to the PR branch
- **Early Exit Pattern:** Pint job runs before test jobs via needs: dependency; catches style issues in 1-5 seconds
- **Custom Rules in pint.json Pattern:** Override preset rules with team-specific preferences; document rule rationale in comments
- **PHP-CS-Fixer Config Import Pattern:** Use pint.php for complex PHP-based configuration logic beyond JSON
- **Job Position:** Separate job running before tests for fastest feedback on style issues
- **Check Strategy:** Use Laravel preset for most projects; add custom rules only for specific team preferences

## Performance
- Pint runs in 1-5 seconds for most Laravel projects; scans PHP files only (no database, no external services)
- Execution time scales with file count (~0.01s per file for Laravel preset); a project with 1000 PHP files takes ~10 seconds
- No cache needed; unlike PHPStan, Pint doesn't benefit significantly from result caching
- Pint is one of the fastest CI steps; negligible compared to PHPStan (30+ seconds) or PHPUnit (5+ minutes)

## Security
- Pint only modifies PHP files in the project; it doesn't access databases, external services, or sensitive data
- Auto-fix commits should be reviewed before merging; an auto-fix could theoretically introduce unexpected changes
- Pint configuration (pint.json) is a project-level file that all contributors can see; no sensitive information should be in it
- Pint runs as part of CI with the same security context as other CI steps; no special security considerations

## Common Mistakes

### Not running --test flag
- **Description:** Running `./vendor/bin/pint` (fix mode) in CI without checking the exit code
- **Consequence:** Build always passes because Pint modifies files and exits 0 even when style violations existed; CI reports success but code is formatted differently
- **Better Approach:** Use `--test` flag in CI to check style without modifying files; use exit code to fail the build

### Inconsistent local and CI config
- **Description:** Developers have IDE formatters configured differently from Pint
- **Consequence:** CI catches style issues that developers can't reproduce locally; confusion about what style is expected
- **Better Approach:** Enforce Pint configuration in the repository (pint.json); document that developers should run Pint locally

### Forgetting composer install
- **Description:** Running Pint before composer install
- **Consequence:** `./vendor/bin/pint` doesn't exist; CI step fails with "command not found"
- **Better Approach:** Run composer install before Pint in the same job or ensure the job has a dependency on the install step

### Ignoring Pint failures
- **Description:** A PR has Pint violations but is merged anyway (bypassed branch protection)
- **Consequence:** Main branch accumulates style inconsistencies; future PRs have larger style diffs
- **Better Approach:** Use branch protection rules that require Pint check to pass before merging

### No pint.json committed
- **Description:** CI runs Pint with default "laravel" preset but team uses custom rules
- **Consequence:** CI and local Pint behave differently; CI catches violations that local Pint doesn't see
- **Better Approach:** Always commit pint.json with the project's chosen preset and custom rules

## Anti-Patterns
- **Skipping Pint in CI:** Relying solely on developer IDE configuration for code style; inconsistent formatting across contributors
- **Manual style enforcement in code review:** Reviewers spending time on formatting comments instead of logic
- **Auto-fix on main branch:** Running automatic Pint fix on merge to main creates unexpected formatting commits
- **Ignoring Pint version differences:** Not pinning Pint version; CI and local developers use different versions with different rules
- **Relaxed rules to avoid failures:** Making Pint rules so permissive that they don't catch meaningful style issues

## Examples
- **Laravel Framework:** Pint included by default in Laravel 11+; official CI template includes a Pint check step
- **Laravel Forge:** Forge's deploy script can include `pint --test` as a pre-deployment quality check
- **Laravel Shift:** Shift's upgrade PRs include Pint-style adjustments; running Pint after Shift merges ensures consistency
- **PHP-CS-Fixer:** Pint is built on PHP-CS-Fixer; teams migrating from PHP-CS-Fixer can use Pint's compatibility mode

## Related Topics
- laravel-pint (the tool itself—configuration, presets, usage)
- pint-configuration (pint.json rules and presets)
- pint-presets (laravel, psr12, per, symfony presets)
- github-actions-for-laravel (CI platform for running Pint)
- pre-commit-hooks-code-quality (running Pint as a pre-commit hook for local enforcement)

## AI Agent Notes
- Pint was released in 2022 and became the default Laravel coding standard tool, replacing manual PHP-CS-Fixer configuration
- Pint is included by default in Laravel 11's composer.json; it's part of the standard Laravel installation
- CI adoption of Pint is near-universal among surveyed Laravel teams (95%+)
- For teams migrating to Pint, start with --test mode (no auto-fix) and gradually address violations
- Pint's "laravel" preset is a curated subset of PHP-CS-Fixer rules matching Laravel's own style

## Verification
- [ ] Pint check (--test) is configured as a CI job
- [ ] Pint job runs before or parallel to test jobs for fast feedback
- [ ] pint.json is committed to the repository with the project's preset and rules
- [ ] Pint version is pinned in composer.json
- [ ] Branch protection requires Pint check to pass before merge
- [ ] Developers know how to run Pint locally for pre-commit checks
- [ ] Custom rules (if any) are documented with rationale
- [ ] Auto-fix mode (if used) commits fixes back to the PR branch
- [ ] IDE configuration matches Pint style (or developers rely on Pint exclusively)
- [ ] Pint execution time is verified (< 10 seconds for the project)
