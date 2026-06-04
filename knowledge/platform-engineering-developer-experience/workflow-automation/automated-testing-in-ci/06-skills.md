# Skill: Set Up Automated Testing in CI

## Purpose
Configure a CI pipeline for Laravel that runs PHPUnit/Pest tests with service containers, caching, and parallel execution for fast, reliable test feedback on every commit.

## When To Use
- Every Laravel application and package
- Projects with multiple contributors (CI ensures tests pass regardless of local environment differences)
- CI must be a required status check for merging

## When NOT To Use
- Prototypes where iteration speed outweighs test coverage
- Throwaway code

## Prerequisites
- PHPUnit or Pest test suite
- CI platform (GitHub Actions, GitLab CI)
- Database service container (for feature tests)

## Inputs
- CI workflow file (`.github/workflows/tests.yml`)
- `phpunit.xml` or `phpunit.xml.dist` with CI-appropriate configuration

## Workflow

1. **Configure Service Containers:** Add MySQL/PostgreSQL service container with health checks. Use SQLite in-memory for unit tests (5-10x faster) and the service container for feature/integration tests.

2. **Cache Composer Dependencies:** Cache `vendor/` based on `composer.lock` hash. Restore before `composer install` to save 30-60s per CI run.

3. **Set CI Environment Variables:** Configure DB connection via CI env vars (`DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`), not in `.env` files. Keeps CI credentials separate from local config.

4. **Use RefreshDatabase Trait:** Always use `RefreshDatabase` trait on test classes for test isolation. Prevents order-dependent flaky failures.

5. **Run Tests in Parallel:** For test suites over 500 tests, use `php artisan test --parallel`. Reduces execution time by ~60% on multi-core runners.

6. **Enforce Coverage Threshold:** Add `--coverage --min=80` to the CI test command. Fails the build if code coverage drops below the configured threshold.

7. **Set as Required Status Check:** In GitHub/GitLab branch protection settings, require the test job to pass before merging.

## Validation Checklist

- [ ] Service containers configured with health checks
- [ ] Composer dependencies cached (lock file hash key)
- [ ] CI DB env vars separate from local `.env`
- [ ] `RefreshDatabase` trait used on test classes
- [ ] Parallel testing configured (for large suites)
- [ ] Coverage threshold enforced in CI
- [ ] Test job is a required status check

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Database service not ready | Use health checks before running tests |
| Flaky tests from DB leakage | Use `RefreshDatabase` trait on all test classes |
| CI different from local | Use same DB engine in CI and locally |
| Slow test suite | Enable parallel testing for suites > 500 tests |

## Decision Points

- **Every Laravel app** should have automated tests running in CI
- **Skip for prototypes** where iteration speed outweighs test coverage
- **Require CI test pass** as branch protection rule — Never merge failing CI
- **Pest for new projects** — Modern assertions, parallel by default

## Performance/Security Considerations

- **Parallel testing:** 60% reduction for suites > 500 tests
- **SQLite for unit tests:** 5-10x faster than MySQL service container
- **Cache vendor/:** Saves 30-60s per CI run; invalidate on lock file change
- **Coverage threshold:** Prevents coverage regression

## Related Rules

- ATCI-RULE-001: Use SQLite in-memory for unit tests
- ATCI-RULE-002: Always use RefreshDatabase trait
- ATCI-RULE-003: Cache vendor/ based on composer.lock hash
- ATCI-RULE-004: Configure CI DB connection via CI env vars
- ATCI-RULE-005: Run tests in parallel

## Related Skills

- Run PHPStan in CI
- Run Pint in CI
- Set Up Automated Deployment Pipelines

## Success Criteria

- Test suite runs reliably in CI with consistent results
- CI completes in under 5 minutes for standard projects
- Test failures block merging (required status check)
- Coverage is maintained or improved over time
