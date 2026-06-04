# Skill: Enforce Code Coverage Thresholds in CI

## Purpose
Configure and enforce minimum code coverage thresholds in CI pipelines using Pest/PHPUnit coverage reports and dedicated tools, ensuring test coverage doesn't regress across the codebase.

## When To Use
- When establishing a quality baseline for the project
- When preventing coverage regressions in PRs
- When tracking coverage trends across releases
- When teams need visibility into untested code areas
- When compliance or SLAs require minimum coverage levels

## When NOT To Use
- As the sole measure of test quality (coverage ≠ test effectiveness)
- When the coverage target is 100% (diminishing returns on trivial code)
- When coverage enforcement causes teams to write low-quality tests just to hit numbers
- For new projects before the test suite is established (set realistic targets)
- When team culture focuses on coverage percentage over test value

## Prerequisites
- Pest or PHPUnit configured with coverage driver (PCOV or Xdebug)
- CI pipeline (GitHub Actions, GitLab CI, etc.)
- Coverage report format (Clover, PHPUnit XML, or HTML)
- Defined coverage thresholds per project module

## Inputs
- Minimum overall coverage percentage
- Per-module or per-directory coverage thresholds
- Coverage report format for CI consumption
- Coverage enforcement tooling (Pest `--min`, PHPUnit coverage, Codecov, etc.)

## Workflow
1. Configure coverage driver: `php.ini` with PCOV or Xdebug enabled
2. Run coverage generation: `php artisan test --coverage` (Pest) or `--coverage-html` (PHPUnit)
3. Set minimum coverage threshold: `--min=80` in Pest or PHPUnit configuration
4. For CI, use coverage tools (Codecov, Coveralls) for trend tracking and PR comments
5. Configure per-module thresholds if different areas need different coverage levels
6. Add coverage enforcement as a required CI step before deployment
7. Generate coverage reports as CI artifacts for team visibility
8. Monitor coverage trends over time — alert on sustained decreases
9. Review uncovered code areas and plan targeted test additions

## Validation Checklist
- [ ] Coverage driver (PCOV/Xdebug) is installed and configured
- [ ] Minimum coverage threshold is set and enforced in CI
- [ ] Coverage reports are generated and stored as CI artifacts
- [ ] Coverage trends are tracked over time
- [ ] Per-module thresholds are configured if needed
- [ ] CI blocks PRs that decrease coverage below threshold
- [ ] Coverage data is visible to the team (dashboard, PR comments)
- [ ] Low-coverage areas are reviewed and prioritized for improvement

## Common Failures
- Setting threshold too high — PRs constantly blocked, team ignores coverage
- Setting threshold too low — coverage regressions go unnoticed
- Only checking overall percentage — modules with 0% coverage are hidden
- No trend tracking — gradual coverage decline is invisible
- Coverage enforcement without actionable reports — team doesn't know what to fix
- Using coverage as the only quality metric — high coverage with bad tests

## Decision Points
- Pest `--min` vs external tool (Codecov) — `--min` for hard enforcement, external for trend tracking
- Overall vs per-module threshold — overall for baseline, per-module for critical areas
- PR blocking vs advisory — blocking for critical modules, advisory for overall percentage

## Performance Considerations
- Coverage collection adds 30-100% overhead to test execution time
- Use PCOV instead of Xdebug for lower overhead
- Run coverage tests on CI only, not on every local test run
- Consider running coverage on a scheduled basis for large test suites
- Coverage merging across parallel shards adds 10-30s

## Security Considerations
- Coverage reports may reveal code paths and structure — restrict CI artifact access
- Ensure coverage enforcement doesn't block security patches that legitimately reduce coverage
- Security-critical modules should have higher coverage thresholds
- Coverage reports may expose untested code paths that are security-sensitive

## Related Rules
- [Rule: Set Realistic Coverage Thresholds](./05-rules.md)
- [Rule: Monitor Coverage Trends, Not Just Snapshots](./05-rules.md)
- [Rule: Use Module-Specific Thresholds for Critical Areas](./05-rules.md)

## Related Skills
- Pest/PHPUnit Coverage Configuration
- Parallel Sharding with Coverage Merging
- CI/CD Pipeline Design

## Success Criteria
- [ ] Minimum coverage threshold is configured and enforced in CI
- [ ] Coverage trends are tracked and visible to the team
- [ ] PRs that decrease coverage are blocked or flagged
- [ ] Coverage reports identify specific untested files and lines
- [ ] Coverage is reviewed regularly, not just when CI blocks a PR
