# Skill: Write Pest Tests with Correct Syntax and Organization

## Purpose
Write Pest test files using correct function choice (`it()` vs `test()`), properly scoped traits, named datasets, and organized describe blocks.

## When To Use
- Writing new tests in a Pest-based Laravel project
- Converting PHPUnit test files to Pest syntax
- Reviewing team test code for Pest best practices
- Setting up test file organization patterns

## When NOT To Use
- Writing tests that need PHPUnit class method syntax (e.g., custom `@dataProvider` methods)
- Writing tests in a purely PHPUnit project
- Writing browser tests with Dusk (use Pest's Dusk helpers instead)

## Prerequisites
- Pest installed in the project
- `pest.php` configured with proper trait scoping
- Understanding of `it()` vs `test()` difference

## Inputs
- Test scenario description
- TestCase methods needed (assertions, HTTP helpers, etc.)
- Dataset values (if data-driven testing is needed)

## Workflow
1. Determine if the test needs `$this` access (HTTP helpers, actingAs, etc.) → use `test()`; for pure value assertions → use `it()`
2. Use `describe()` blocks for logically related tests that share setup via `beforeEach()`, limiting nesting to 2 levels
3. Use named keys in `->with()` datasets — each key describes the test case meaningfully
4. For multi-step tests (>2-3 lines), use explicit `test()` closures instead of higher-order chains
5. Keep `it()`/`test()` and PHPUnit class syntax in separate files — never mix in the same file
6. Extract reusable datasets to `tests/Datasets/` files when used in multiple test files
7. Use `expect()->extend()` for custom assertions and document them in team guidelines
8. Run `php artisan test` to verify the file transpiles and executes correctly

## Validation Checklist
- [ ] Correct function choice: `test()` with `$this`, `it()` for pure assertions
- [ ] All dataset keys are named semantically
- [ ] Describe blocks ≤ 2 levels of nesting
- [ ] No mixing of Pest and PHPUnit syntax in the same file
- [ ] Multi-step tests use `test()` closures, not higher-order chains
- [ ] Shared datasets extracted to `tests/Datasets/` where appropriate
- [ ] Custom expectations and helpers documented

## Common Failures
- Using `it()` with `$this->actingAs()` — PHP fatal error
- Global `uses(RefreshDatabase::class)` in pest.php slowing unit tests
- Unnamed dataset keys producing unreadable failure output like `(#0)`
- Deeply nested describe blocks causing "class too deeply nested" errors
- Mixing Pest and PHPUnit syntax causing duplicate method errors

## Decision Points
- `test()` with `$this` access for HTTP tests, authentication, database assertions
- `it()` for simple value assertions like `expect($result)->toBeTrue()`
- `describe()` for shared beforeEach setup within a file
- Higher-order syntax (`it()->assert()`) only for single-assertion one-liners

## Performance Considerations
- Transpilation adds ~20-50ms per file on cold cache; negligible on warm cache
- Dataset expansion (cartesian product) can generate thousands of tests — monitor with `--profile`
- Parallel mode uses Paratest; same as PHPUnit performance

## Security Considerations
- `uses()` scoping may import traits unintentionally; always use `->in()` for directory scoping
- Custom `expect()->extend()` macros run in test context; audit for sensitive operations
- Dataset files may contain test data; review before committing

## Related Rules (from 05-rules.md)
- Rule 1: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions
- Rule 2: Scope `uses()` to specific directories, never use global wildcard
- Rule 3: Always use named keys in dataset definitions
- Rule 4: Limit `describe()` nesting to 2 levels maximum
- Rule 5: Extract shared datasets to `tests/Datasets/` files
- Rule 6: Never mix Pest `it()`/`test()` with PHPUnit class syntax in the same file
- Rule 8: Prefer `test()` for multi-step tests, higher-order syntax for single assertions

## Success Criteria
- Tests execute without PHP fatal errors
- Failure output shows meaningful dataset names
- Tests are readable and maintainable with clear organization
- No duplicated setup code across tests
