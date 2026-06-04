# Skill: Test Laravel Packages with Orchestra Testbench

## Purpose
Write integration tests for Laravel packages using Orchestra Testbench, verifying service provider registration, routing, configuration merging, database migrations, and view rendering in a bootstrapped Laravel application context.

## When To Use
- Testing service provider registration and boot logic
- Testing package routes, controllers, and middleware
- Testing configuration merging and publishing
- Testing database migrations and model factories
- Testing multi-version compatibility across Laravel versions

## When NOT To Use
- Unit testing isolated business logic (use plain PHPUnit/Pest)
- Testing pure PHP classes with no framework dependencies
- Performance-sensitive test suites where boot overhead is disproportionate

## Prerequisites
- Laravel package with a service provider
- `orchestra/testbench` as dev dependency in composer.json
- PHPUnit or Pest configured

## Inputs
- Package service provider class
- Test scenarios (routes, configs, migrations, commands)
- Target PHP and Laravel version matrix

## Workflow (numbered)
1. **Require Testbench** — `composer require --dev orchestra/testbench` (version matching target Laravel)
2. **Extend Testbench TestCase** — Test classes extend `Orchestra\Testbench\TestCase`
3. **Register package provider** — Override `getPackageProviders()` to return `[PackageServiceProvider::class]`
4. **Configure test environment** — Override `getEnvironmentSetUp()` to set test-specific config (database, cache, queue)
5. **Write integration tests** — Test routes via `$this->get()`, `$this->post()`; test config merging; test migration execution
6. **Add database tests** — Use SQLite `:memory:` for speed; use `RefreshDatabase` trait for isolation
7. **Configure CI matrix** — Test across PHP 8.1-8.4 × Laravel 10-11 × SQLite + MySQL
8. **Write unit tests for isolated logic** — Keep simple class tests without Testbench for speed

## Validation Checklist
- [ ] Test classes extend `Orchestra\Testbench\TestCase`
- [ ] `getPackageProviders()` returns the package's service provider
- [ ] `getEnvironmentSetUp()` configures test-specific settings
- [ ] SQLite `:memory:` is used as default database
- [ ] `RefreshDatabase` trait used for test isolation
- [ ] CI matrix tests across supported PHP and Laravel versions
- [ ] Both SQLite and MySQL tested in CI
- [ ] Testbench version matches target Laravel version
- [ ] Minimal boot test verifies provider registers without error
- [ ] Unit tests exist alongside integration tests

## Common Failures
- **Not registering package providers** — tests pass even when provider registration is broken
- **MySQL-specific features on SQLite** — JSON operations, WHERE IN ordering fail on SQLite
- **Wrong Testbench version** — must match target Laravel version
- **Shared state between tests** — use `RefreshDatabase`; reset config in `tearDown()`
- **Only unit tests, no Testbench** — provider registration, routing, and migration bugs go undetected

## Decision Points
- PHPUnit vs Pest: PHPUnit is standard; Pest with `pest-plugin-testbench` is a viable alternative
- SQLite only vs SQLite + MySQL: SQLite only for simple migrations; add MySQL for production-parity
- Version matrix range: LTS versions + current; drop support for EOL versions

## Performance/Security Considerations
- Testbench boots a full Laravel app per test class (~100-200ms); group 5-15 tests per class
- Use `RefreshDatabase` to reset rather than remigrate between tests
- Full migration suite: 100-500ms per class; keep migration count minimal
- 12 CI jobs (4 PHP × 3 Laravel) can exceed 30 minutes; test LTS-only combinations to reduce
- Never point tests at production-like databases; use in-memory SQLite or ephemeral test databases
- No state leakage between tests — Testbench creates a fresh app per test method

## Related Rules (from 05-rules.md)
- TESTBENCH-RULE-001: Extend Orchestra\Testbench\TestCase
- TESTBENCH-RULE-002: Override getPackageProviders()
- TESTBENCH-RULE-003: Use getEnvironmentSetUp()
- TESTBENCH-RULE-004: SQLite :memory: as default
- TESTBENCH-RULE-005: Use RefreshDatabase trait
- TESTBENCH-RULE-006: Multi-version CI matrix

## Related Skills
- Scaffold a Laravel Package from the Standard Skeleton
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery

## Success Criteria
- All package integration tests pass across target PHP/Laravel versions
- Provider registration verified (test fails if provider not registered)
- Database migrations work on both SQLite and MySQL
- No shared state or order-dependent test failures
- Test suite completes within CI time limits for the full version matrix

---

# Skill: Manage Multi-Version Package Testing with Testbench

## Purpose
Configure and maintain a CI pipeline that tests Laravel packages across multiple PHP and Laravel version combinations using Orchestra Testbench's version matrix.

## When To Use
- Package supports multiple Laravel versions
- CI pipeline needs to validate backward compatibility
- Package has database-specific behavior that varies by version

## When NOT To Use
- Package targets a single Laravel version
- Team lacks CI infrastructure for parallel jobs

## Prerequisites
- Working Testbench test suite for single version
- CI provider (GitHub Actions, GitLab CI, etc.)

## Inputs
- Supported PHP versions
- Supported Laravel versions and corresponding Testbench versions
- Database services (SQLite, MySQL, PostgreSQL)

## Workflow (numbered)
1. **Define version matrix** — PHP versions × Laravel versions × database types; focus on LTS combinations
2. **Configure CI strategy** — Matrix build with `fail-fast: false` to see all failures; add job name for clarity
3. **Handle Testbench version per Laravel version** — Use `orchestra/testbench` version matching each Laravel version in the matrix
4. **Add database services** — Start MySQL/PostgreSQL services in CI for dialect-specific jobs
5. **Set up low-dependency test** — Include PHP lowest + highest dependency install with `--prefer-lowest` flag
6. **Set coverage job** — One PHP version runs with Xdebug for coverage; others run without for speed

## Validation Checklist
- [ ] CI matrix covers all supported PHP/Laravel combinations
- [ ] `fail-fast: false` — all failures visible, not just first
- [ ] Testbench version pinned per Laravel version
- [ ] SQLite used for speed; MySQL for dialect-specific jobs
- [ ] Lowest dependencies job included for backward compatibility detection
- [ ] Coverage Xdebug limited to one job for speed

## Common Failures
- **Wrong Testbench version** — different Laravel versions need different Testbench major versions
- **Missing database services** — MySQL-specific tests fail in CI without database service
- **Too many matrix combinations** — 4 PHP × 4 Laravel × 2 DB = 32 jobs; focus on supported combinations

## Decision Points
- Matrix breadth: full vs focused on LTS + current; full for packages with wide adoption
- Database coverage: SQLite only vs SQLite + MySQL + PostgreSQL; based on package's database dependencies
- Dependency freshness: prefer-lowest for backward compat + prefer-stable for current

## Performance/Security Considerations
- Each CI job consumes runner time; 32 jobs can take 30+ minutes
- Use caching for Composer dependencies across matrix jobs
- Coverage in one job only; others run without Xdebug for speed
- No production credentials in CI; use `getEnvironmentSetUp()` for test-specific config

## Related Rules (from 05-rules.md)
- TESTBENCH-RULE-006: Multi-version CI matrix
- TESTBENCH-RULE-012: Wrong Testbench version
- TESTBENCH-RULE-016: Avoid skipping version matrix

## Related Skills
- Test Laravel Packages with Orchestra Testbench
- Configure Package Auto-Discovery

## Success Criteria
- CI matrix passes across all supported PHP/Laravel/DB combinations
- Backward compatibility detected via `--prefer-lowest` job
- Pipeline completes within CI service limits
- Adding/removing supported versions is a simple matrix change
