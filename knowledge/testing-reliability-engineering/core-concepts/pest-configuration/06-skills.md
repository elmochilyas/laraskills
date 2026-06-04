# Skill: Configure Pest Test Suite

## Purpose
Set up `pest.php` with properly scoped trait imports, dataset directories, and Pest-specific configuration for a Laravel project.

## When To Use
- Setting up Pest for a new Laravel project (Laravel 13+ default)
- Adding Pest to an existing mixed PHPUnit/Pest project
- Configuring directory-scoped trait injection and helper organization
- Setting up dataset files and custom expectations

## When NOT To Use
- Configuring environment variables or shared testing settings (use `phpunit.xml`)
- Writing per-test setup logic (use `beforeEach()` or `describe()` blocks)
- Registering PHPUnit extensions (use `phpunit.xml`)

## Prerequisites
- Laravel project with Pest installed (`composer require pestphp/pest --dev`)
- `phpunit.xml` configured with environment variables and test suites
- Understanding of Pest's `it()` vs `test()` syntax distinction

## Inputs
- Test directory structure (tests/Unit, tests/Feature, etc.)
- Traits to apply per directory (RefreshDatabase, WithoutMiddleware, etc.)
- Dataset files to create (optional)

## Workflow
1. Create `pest.php` at project root that returns Pest configuration
2. Scope trait imports to specific directories using `uses(Trait::class)->in('tests/Feature')` — never use global wildcards
3. Apply `uses(Tests\TestCase::class)->in('tests/Feature')` to connect feature tests to Laravel's TestCase
4. Scope `RefreshDatabase` or `DatabaseMigrations` only to feature test directories
5. Create `tests/Datasets/` directory for reusable dataset files
6. Organize custom helpers: `expect()->extend()` macros in `tests/Helpers/`, custom traits for reusable logic
7. Document all custom expectations and helpers in team guidelines (AGENTS.md or tests/README.md)
8. Verify with `php artisan test` that both Pest and PHPUnit files execute correctly

## Validation Checklist
- [ ] `pest.php` scopes traits to specific directories with `->in()`
- [ ] `uses(Tests\TestCase::class)` applied only to feature tests
- [ ] No global `uses()` with wildcard patterns
- [ ] `it()` used only for pure assertions without `$this`
- [ ] `test()` used for tests requiring TestCase methods
- [ ] Dataset keys are named semantically
- [ ] Custom expectations and helpers are documented
- [ ] Describe blocks limited to 2 levels maximum

## Common Failures
- Using `it()` with `$this->actingAs()` — fatal error, `$this` not available
- Global `uses(RefreshDatabase::class)` slowing unit tests by 30-50ms each
- Untracked dataset keys showing `(#0)` in failure output instead of meaningful names
- Mixing Pest and PHPUnit syntax in the same file

## Decision Points
- Use `it()` for pure value assertions, `test()` when `$this` is needed for HTTP helpers
- Use `describe()` with `beforeEach()` for shared setup within a file
- Extract reusable datasets to `tests/Datasets/` when used in multiple files

## Performance Considerations
- Transpilation adds ~20-50ms per file on cold cache; enable CI caching for `storage/framework/testing/`
- Zero runtime overhead — transpiled code runs at native PHPUnit speed
- Dataset expansion (cartesian product) can generate thousands of test cases; monitor count

## Security Considerations
- Wide-scoped `uses()` may import traits unintentionally; always use `->in()`
- Custom `expect()->extend()` macros run in test context; don't expose testing infrastructure
- Vet third-party Pest plugins before installation

## Related Rules (from 05-rules.md)
- Rule 1: Scope `uses()` to specific directories, never apply globally
- Rule 2: Use `test()` when `$this` is needed, `it()` for pure assertions
- Rule 3: Always name dataset keys semantically for readable failure output
- Rule 4: Limit `describe()` nesting to 2 levels maximum
- Rule 5: Extract reusable datasets to `tests/Datasets/` files
- Rule 6: Prefer `test()` over higher-order syntax for tests with more than 2-3 lines
- Rule 10: Use `pest.php` only for Pest-specific configuration, not environment variables

## Success Criteria
- Pest tests run correctly alongside any remaining PHPUnit files
- Trait imports are scoped efficiently without slowing unit tests
- Dataset failures show meaningful names for quick debugging
- Custom expectations are discoverable by the team
