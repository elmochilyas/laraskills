# Skill: Run Pint in CI

## Purpose
Add Laravel Pint as a fast CI gate that enforces code style on every pull request, catching style violations in 1-5 seconds before slower checks run.

## When To Use
- Every Laravel project with multiple contributors (eliminates style inconsistency)
- Open-source projects where external contributors may have different IDE configs
- Projects where code review time should focus on logic, not formatting

## When NOT To Use
- Solo projects where single developer controls their own formatting
- Projects without a committed pint.json (style standards not defined)

## Prerequisites
- `laravel/pint` installed as a dev dependency
- `pint.json` committed to repository
- CI platform (GitHub Actions, GitLab CI)

## Inputs
- CI workflow file (`.github/workflows/pint.yml`)
- `pint.json` — style configuration

## Workflow

1. **Create Dedicated Pint Job:** Create a CI job running `./vendor/bin/pint --test` after `composer install`. Use a separate job rather than mixing with other checks.

2. **Make It the First Check:** Configure Pint as the first job in the pipeline using `needs:` to run before slower jobs. Catches style issues in 1-5 seconds before waiting for 10-minute test runs.

3. **Use --test Mode:** Use `--test` mode for internal team projects (fail the build on style violations). Use auto-fix mode for open-source (auto-fixes and commits back to PR).

4. **Pin Pint Version:** Lock `"laravel/pint": "1.18.*"` in `composer.json`. Different Pint versions have different default rules that could break CI unexpectedly.

5. **Commit pint.json:** Without a committed `pint.json`, CI and local Pint may use different configurations. Always commit the config.

6. **Set Branch Protection:** Require the Pint check to pass in branch protection rules before merging.

## Validation Checklist

- [ ] Dedicated Pint CI job runs `pint --test`
- [ ] Pint job runs before slower checks (tests, PHPStan)
- [ ] `--test` mode for internal projects
- [ ] Pint version pinned in `composer.json`
- [ ] `pint.json` committed to repository
- [ ] Branch protection requires Pint check
- [ ] CI exits 0 on clean style, 1 on violations

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| `pint.json` not committed | CI and local use different configs |
| Pint version not pinned | Unexpected rule changes break CI |
| Pint runs after tests | Style issues found after 10-min test wait |

## Decision Points

- **Use for every Laravel project with multiple contributors** — Eliminates style inconsistency
- **Use for open-source projects** where external contributors may have different IDE configs
- **Skip for solo projects** where single developer controls their own formatting

## Performance/Security Considerations

- **Fastest CI check:** 1-5 seconds total; negligible CI cost
- **Cache:** Token cache speeds subsequent runs; restore between runs for < 1s analysis
- **Early exit:** Catch style issues in seconds before waiting for minutes of test execution

## Related Rules

- PINTICI-RULE-001: Use `--test` mode
- PINTICI-RULE-002: Run Pint as separate job before slower test jobs
- PINTICI-RULE-003: Commit pint.json
- PINTICI-RULE-004: Pin Pint version
- PINTICI-RULE-005: Use "laravel" preset as default

## Related Skills

- Run PHPStan in CI
- Set Up Automated Testing in CI
- Configure Pint via pint.json

## Success Criteria

- CI catches style violations in 1-5 seconds
- Pint check runs before all other CI jobs
- All contributors (internal and external) have consistent style enforcement
- Pint is a required check that blocks merging on style violations
