# Skill: Configure PHPUnit Test Suite

## Purpose
Set up `phpunit.xml` for a Laravel project with proper environment variables, test suites, coverage filtering, and parallel execution parameters.

## When To Use
- Setting up a new Laravel project's test configuration
- Adding parallel execution to an existing test suite
- Configuring environment variables for different test environments
- Setting up code coverage reporting

## When NOT To Use
- Configuring Pest-specific options (use `pest.php` instead)
- Setting CI-specific secrets (use CI environment variables)
- Configuring per-test setup logic (use `setUp()` or `beforeEach()`)

## Prerequisites
- Laravel project with PHPUnit installed
- Understanding of test suite structure (Unit/Feature directories)
- Knowledge of CI runner CPU count for parallel configuration

## Inputs
- Original `phpunit.xml` (optional, for modification)
- CI runner CPU count
- Database type and credentials (for environment overrides)

## Workflow
1. Set `<env name="APP_ENV" value="testing"/>` as the first environment variable in the `<php>` section to ensure `.env.testing` is loaded
2. Configure safe test defaults: `BCRYPT_ROUNDS=4`, `CACHE_STORE=array`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array`
3. Define separate `<testsuite>` entries for `Unit` and `Feature` test directories
4. Configure `<source><include>` scoped to `app/` directory; exclude vendor/config/migrations implicitly
5. Set parallel execution parameters: `processes` = CPU count minus 1, `maxBatchSize=50`, `slowThreshold=500`
6. Commit `phpunit.xml.dist` (defaults) and add `phpunit.xml` to `.gitignore` for local overrides
7. Run `php artisan config:clear` before first test execution to clear any cached config
8. Verify with `phpunit` and `php artisan test` that both PHPUnit and Pest test files run correctly

## Validation Checklist
- [ ] `APP_ENV=testing` is set in `<php>` section
- [ ] Separate Unit and Feature test suites defined
- [ ] Coverage source scoped to `app/` directory
- [ ] Parallel process count matches CI runner CPUs minus 1
- [ ] No secrets hard-coded in the configuration file
- [ ] `config:cache` not run in test environment
- [ ] Both PHPUnit and Pest files execute correctly

## Common Failures
- Missing `APP_ENV=testing`: tests connect to development database
- Config cache collision: `php artisan config:cache` causes stale config values
- Oversubscribed parallel workers: tests run slower than sequential
- Duplicate config in `phpunit.xml` and `pest.php`: conflicting settings

## Decision Points
- Use `phpunit.xml.dist` (committed) + `phpunit.xml` (gitignored) for local overrides vs single committed file
- Set parallel workers to CPU count minus 1 for CPU-bound tests; add 1-2 extra for I/O-bound tests
- Add additional test suites for Browser, Architecture, or Integration if needed

## Performance Considerations
- Parallel mode reduces wall-clock time proportionally to worker count
- Cold transpilation cache adds ~20-50ms per file on first run
- Each registered extension adds ~1-5ms per test run

## Security Considerations
- Never store API keys, DB passwords, or service credentials in `phpunit.xml`
- Coverage reports may reveal code structure; restrict access in CI
- Use CI secrets or environment variable injection for sensitive values

## Related Rules (from 05-rules.md)
- Rule 1: Always set `APP_ENV=testing` in `phpunit.xml`
- Rule 2: Never run `php artisan config:cache` for the test environment
- Rule 3: Use `<source><include>` to scope coverage filtering
- Rule 4: Define separate `<testsuite>` entries for unit and feature tests
- Rule 5: Set parallel execution parameters matching CI runner capacity
- Rule 6: Never store secrets in `phpunit.xml` or `phpunit.xml.dist`
- Rule 8: Keep `phpunit.xml` as single source of truth
- Rule 13: Prefer `phpunit.xml.dist` as committed default

## Success Criteria
- Test suite runs with correct environment isolation
- Parallel execution completes in expected time
- Coverage reports accurately reflect application code only
- Configuration is documented and reproducible across environments
