# Skill: Execute Tests in CI Pipelines

## Purpose
Configure and optimize test execution within CI pipelines for Laravel applications, covering test database setup, environment configuration, parallel execution, and integration with code quality tools.

## When To Use
- When setting up test execution in a new CI pipeline
- When optimizing CI test execution time
- When adding new test types (unit, feature, browser, architecture)
- When configuring CI for different environments (PR, staging, production)
- When integrating test results with PR status checks

## When NOT To Use
- For local development (use `php artisan test` directly)
- When CI configuration is already optimal (avoid unnecessary changes)
- When the project doesn't have automated tests yet
- For infrastructure provisioning (separate from test execution)

## Prerequisites
- CI platform configured (GitHub Actions, GitLab CI, etc.)
- Laravel test suite with Pest or PHPUnit
- Database configuration for CI environment
- PHP and Composer installed in CI environment
- Code quality tools installed (PHPStan, Laravel Pint, etc.)

## Inputs
- Test environment configuration (database, cache, session drivers)
- PHP version and extensions required
- Test types to execute (unit, feature, browser, architecture)
- Code quality commands to run
- CI platform-specific configuration
- Test result reporting format (JUnit, HTML)

## Workflow
1. Configure test environment in CI: `.env.testing` or CI environment variables
2. Use SQLite or service containers for database (match production engine for feature tests)
3. Run database migrations before tests: `php artisan migrate --env=testing`
4. Execute tests by type: unit first (fast), then feature/architecture, then browser (slow)
5. Run architecture tests as a quick quality gate before full test suite
6. For parallel execution: use Pest's `--parallel` or shard across CI jobs
7. Run code quality tools: `./vendor/bin/pint --test`, `phpstan analyse`
8. Generate test reports in CI-compatible format (JUnit XML)
9. Report results to PR status checks for visibility
10. Optimize with caching: `php artisan optimize` for config/route caching in CI

## Validation Checklist
- [ ] Test environment variables are configured (DB, cache, session, mail)
- [ ] Database is set up with migrations before tests
- [ ] Tests run in order: unit → feature → architecture → browser
- [ ] Code quality tools run alongside tests
- [ ] Test results are reported as PR status checks
- [ ] CI caches framework optimization files between runs
- [ ] Browser tests are configured for headless execution
- [ ] Test artifacts (screenshots, logs) are available on failure
- [ ] CI test execution completes within acceptable time

## Common Failures
- Database not migrated before tests — all feature tests fail with table-not-found
- Environment not configured for testing — mail sent, queues processed, storage written
- Browser tests not headless — CI has no display server
- Test order-dependent failures — running in CI reveals order dependencies
- Incomplete PHP extensions — pdo_mysql, bcmath, xml missing
- Timeouts on slow tests — CI runners may be slower than local machines

## Decision Points
- SQLite vs service containers — SQLite for simplicity/speed, service containers for production match
- Sequential vs parallel execution — sequential for simplicity, parallel for speed
- Separate workflow jobs vs single job — separate for independent execution, single for dependency chaining

## Performance Considerations
- Unit tests: <5ms each — run first for fast failure feedback
- Feature tests: 50-500ms each — bulk of test suite time
- Browser tests: 2-30s each — limit to 10% of suite
- Architecture tests: <2s total — run as quick gate before other tests
- Cache framework files (config, routes) to speed up test bootstrapping
- Use PCOV for coverage: 2-3x faster than Xdebug

## Security Considerations
- CI environment variables should be stored as CI secrets, never in code
- Test database should be isolated — never run tests against shared or production databases
- CI logs may contain environment values — ensure no secrets are logged
- Browser test screenshots may capture sensitive data — restrict artifact access
- Use separate CI environments for different branches (PR vs main)

## Related Rules
- [Rule: Run Tests in Order of Speed](./05-rules.md)
- [Rule: Cache Framework Optimization Between Runs](./05-rules.md)
- [Rule: Store Environment Variables as CI Secrets](./05-rules.md)

## Related Skills
- GitHub Actions CI/CD
- Test Sharding for CI
- CI Pipeline Optimization

## Success Criteria
- [ ] All test types (unit, feature, architecture, browser) execute in CI
- [ ] Tests run in optimal order for fast failure feedback
- [ ] Code quality tools run alongside tests
- [ ] Test results are visible as PR status checks
- [ ] CI test execution time is monitored and optimized
