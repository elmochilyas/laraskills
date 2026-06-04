# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | Coverage Reporting & Enforcement |
| Difficulty | Core |
| Maturity | Mature |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHP extension management (pcov/Xdebug), CI/CD fundamentals |
| Related KUs | Mutation testing with Pest, CI pipeline design, Parallel test execution |
| Source | domain-analysis.md K025 |

# Overview

Coverage reporting and enforcement in Laravel measures what percentage of code is exercised by the test suite and provides gates to prevent coverage regression. PHPUnit and Pest both support `--coverage` and `--min` flags for coverage computation and threshold enforcement. Coverage is computed using pcov (recommended for Laravel) or Xdebug. The standard approach uses `--coverage --min=80` in CI to enforce a minimum coverage threshold. Coverage reports are generated in HTML, Clover, or text format and archived as CI artifacts. Coverage is a necessary but insufficient quality metric — teams should combine it with mutation testing for deeper quality insight.

# Core Concepts

- **Coverage types**: Line coverage (every line executed), method coverage, branch coverage. Pest/PHPUnit use line coverage as default.
- **pcov**: PHP extension for coverage computation. Faster than Xdebug. Recommended for CI.
- **Xdebug**: Full debugger with coverage support. Slower than pcov. Use only when debugging features are also needed.
- **`--coverage` flag**: Enables coverage computation. Accepts format options: `--coverage-html`, `--coverage-clover`, `--coverage-text`.
- **`--min` flag**: Sets minimum coverage threshold. Test suite fails if coverage falls below this percentage.

# When To Use

- In CI to enforce a minimum coverage floor and prevent regression
- When generating coverage reports for team review or compliance
- To identify untested code paths and dead code
- In combination with mutation testing for deeper quality insight

# When NOT To Use

- During local TDD (coverage adds 20-40% overhead; trust the CI gate)
- As the sole quality metric (coverage can be gamed with assertion-free tests)
- When the coverage tool (pcov/Xdebug) is not properly configured (results will be inaccurate)
- With 100% threshold — impractical and encourages test-gaming

# Best Practices (WHY)

- **Use pcov, not Xdebug, for CI coverage**: pcov adds 20-40% overhead vs Xdebug's 200-500%. Install pcov via `shivammathur/setup-php` with `pcov: true`. Reserve Xdebug for local debugging.
- **Set `--min` at 70-80%**: This is the recommended range for most projects. 100% is impractical and encourages tests that assert nothing. Critical paths (payments, auth) should target 90%+.
- **Run coverage only in CI, not locally**: Coverage computation slows tests by 20-40%. Run coverage exclusively in CI. Developers use coverage reports from CI artifacts to explore uncovered code.
- **Combine coverage with mutation testing**: Coverage measures what code ran; mutation testing measures whether assertions verified behavior. High coverage + low mutation score = weak tests.
- **Use baseline for existing projects**: Compute current coverage first, then set `--min` to baseline or slightly below. Raise threshold gradually (5% per quarter) to avoid overwhelming the team.

# Architecture Guidelines

- **pcov vs Xdebug**: pcov always preferred for coverage-only use. Xdebug only when step debugging is also needed.
- **Format selection**: HTML for visual browsing (CI artifact), Clover for CI platform integration (SonarQube, GitLab), text for terminal output.
- **Coverage in CI**: Run full coverage in CI only. Too slow for local TDD.
- **Coverage merging for parallel tests**: Each parallel worker computes its own coverage. Use Pest's built-in merging or PHPUnit's `--coverage-php` for coalesced cache.

# Performance Considerations

- pcov overhead: 20-40% test time increase. Xdebug: 200-500%.
- Coverage without `--min` is the same speed as with `--min` (computation is post-processing).
- HTML report generation: 1-5 seconds for moderate codebases (10-50k LOC).
- Coverage caching: Pest caches coverage data between runs when using `--cache` flag.

# Security Considerations

- Coverage reports reveal code structure and execution paths. Restrict access to CI artifacts.
- Do not upload coverage reports to publicly accessible storage.
- Coverage data may contain file paths that reveal server configuration. Sanitize before sharing.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting 100% coverage requirement | Maximum quality aspiration | Encourages assertion-free tests; developers waste time on trivial getters/setters | 80-90% coverage; focus on testing behavior, not code paths |
| Running coverage locally during TDD | Want to verify coverage during development | Adds 20-40% overhead; breaks development flow | Run coverage only in CI; trust the gate |
| Using Xdebug for CI coverage | Already installed for debugging | 2-5x slower tests; CI minutes waste | Install pcov alongside Xdebug; enable pcov in CI |
| Ignoring uncovered code in reports | Report is noisy | Dead code accumulates; untested error handlers cause bugs | Schedule quarterly "coverage gap" sprint |

# Anti-Patterns

- **Coverage as the only quality metric**: Setting high coverage requirements without mutation testing or assertion quality checks. Instead, use coverage + mutation score + code review.
- **100% coverage obsession**: Spending disproportionate effort testing trivial getters, setters, and generated code. Instead, focus on business logic and critical paths.
- **Coverage gating without baseline**: Setting `--min=80` on a project with 40% coverage. Instead, compute baseline first, set threshold at baseline, and raise gradually.
- **Ignoring uncovered critical code**: Coverage report shows untested error handlers, validation rules, or auth logic, but team doesn't address them. Instead, prioritize by risk.

# Examples

```bash
# Run tests with coverage and enforce minimum
php artisan test --parallel --coverage --min=80

# Generate HTML coverage report for CI artifact
php artisan test --parallel --coverage-html=coverage-report

# Generate Clover report for SonarQube integration
php artisan test --parallel --coverage-clover=coverage.xml

# Set up pcov via shivammathur/setup-php (GitHub Actions)
# - name: Setup PHP
#   uses: shivammathur/setup-php@v2
#   with:
#     php-version: '8.3'
#     coverage: pcov
#     tools: composer
```

# Related Topics

- **Prerequisites**: PHP extension management (pcov/Xdebug), CI/CD fundamentals
- **Related**: Mutation testing with Pest, CI pipeline design, Parallel test execution
- **Advanced**: Branch coverage with Xdebug, Coverage-based test selection, Mutation score as coverage complement

# AI Agent Notes

- When setting up coverage for a new Laravel project, install pcov via `shivammathur/setup-php` and run `php artisan test --coverage --min=80` in CI. For existing projects, first run without `--min` to establish baseline.
- If coverage is very low (<50%), work with the team to set incremental targets (e.g., raise by 5% each quarter) rather than demanding immediate 80%.
- Coverage tools cannot measure assertion quality. If coverage is high but bugs still reach production, the tests likely lack meaningful assertions. Recommend mutation testing as a complement.

# Verification

- [ ] pcov (not Xdebug) is used for CI coverage
- [ ] `--min` threshold is set at 70-80% (or baseline for existing projects)
- [ ] Coverage runs only in CI, not during local TDD
- [ ] Coverage reports are generated (HTML or Clover) and archived as CI artifacts
- [ ] Coverage enforcement is combined with mutation testing for quality insight
- [ ] Uncovered critical code paths are tracked and addressed
- [ ] Coverage threshold is gradually raised as code quality improves
- [ ] Coverage data is not exposed publicly
