# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Framework & Runner Infrastructure |
| Knowledge Unit | Pest Framework Fundamentals |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHPUnit basics, Composer autoloading |
| Related KUs | Parallel test execution, Architecture testing, Mutation testing, Browser testing |
| Source | domain-analysis.md K001 |

# Overview

Pest is the dominant testing framework in the Laravel ecosystem (2026). It wraps PHPUnit with a more expressive DSL—higher-order `it()` and `test()` functions, `describe()` blocks for grouping, arch expectations, dataset-driven parameterization, and built-in mutation/browser testing. Choosing Pest over raw PHPUnit reduces boilerplate ~40% and improves test readability, which directly impacts maintainability and team velocity. The framework compiles down to PHPUnit under the hood, so all PHPUnit functionality remains accessible.

# Core Concepts

- **Higher-order functions**: `it('does something', fn() => ...)` eliminates class boilerplate. Each test file returns a closure or uses a `uses()` trait import.
- **`describe()` blocks**: Nestable groups with shared `beforeEach()` setup. Describe blocks can have their own `uses()`, `beforeEach()`, and `afterEach()`.
- **`uses()` trait injection**: Import traits like `RefreshDatabase`, `DatabaseMigrations`, or custom helpers at file or directory level via `uses(Trait::class)->in('directory')`.
- **Expectations API**: `expect($result)->toBe(expected)` is Pest's assertion style. Full PHPUnit assertions (`$this->assert*`) remain available via `test()` closures.
- **Datasets**: `[input, expected]` tuples via `with([...])` or dedicated dataset files. Each dataset row becomes an independent test case.
- **Architecture testing**: Native `arch()->expect('App')->toUseStrictTypes()` without extra packages.
- **Mutation testing**: Built-in via `--mutate` flag and `covers()`/`mutates()` functions.
- **Contextual helpers**: `pest()->extend()` for custom expectation macros.

# When To Use

- New Laravel projects (Pest is default in Laravel 13)
- Teams wanting built-in architecture, mutation, and browser testing
- Projects where test readability and reduced boilerplate are priorities
- Gradual migration from PHPUnit (file-by-file with `pest-plugin-migrate`)
- Teams that value expressive DSL over explicit class structure

# When NOT To Use

- Projects that cannot upgrade to PHP 8.3+ (Pest 4 requires PHP 8.3+)
- Teams heavily invested in PHPUnit-specific features they don't want to give up
- As a replacement for understanding PHPUnit (Pest debugging requires PHPUnit knowledge)
- When custom PHPUnit extensions have complex integration requirements

# Best Practices (WHY)

- **Use `test()` when you need `$this`, use `it()` for pure assertions**: Reason: `test()` receives TestCase instance; `it()` does not. Use `test()` for `$this->actingAs()`, HTTP helpers, etc.
- **Scope `uses()` to specific directories, not globally**: Reason: `uses(RefreshDatabase::class)->in('tests/Feature')` applies DB traits only to feature tests. Global application slows unit tests.
- **Name datasets semantically**: Reason: `->with(['valid email' => ['user@example.com', true]])` shows meaningful names in failure output. Array index names are useless for debugging.
- **Limit describe() nesting to 2 levels**: Reason: deeply nested describes reduce readability and may hit PHPUnit class nesting limits.
- **Cache transpilation output in CI**: Reason: cold cache adds ~50ms per file. CI can shave seconds by warming the cache directory.

# Architecture Guidelines

- **File naming**: Pest test files use `*.test.php` extension. PHPUnit files use `*Test.php`. Both can coexist.
- **Configuration layering**: `phpunit.xml` (global) → `pest.php` (Pest-specific) → per-file `uses()` (file-level).
- **Helper organization**: Custom expectations via `expect()->extend()`. Custom helpers via traits. Dataset files in `tests/Datasets/`.
- **Directory structure**: `tests/Unit/`, `tests/Feature/`, `tests/Browser/`, `tests/Architecture/`, `tests/Datasets/`.
- **Test organization**: Group tests by feature, not by type. Use describe blocks for logical grouping within files.

# Performance Considerations

- **Transpilation overhead**: Pest adds ~20-50ms per test file for transpilation. Not meaningful for CI but noticeable on single-file runs during development.
- **Cache**: Pest caches transpiled files. Cache invalidation is automatic on file change. CI cold starts are marginally slower than raw PHPUnit.
- **Memory**: Higher-order closures have negligible overhead vs PHPUnit methods. Dataset-heavy files have higher memory due to expanded data providers.
- **Parallel overhead**: Pest's parallel mode uses Paratest; same performance characteristics as PHPUnit parallel.
- **Dataset explosion**: Datasets that combine multiple arrays (cartesian product) can generate thousands of test cases. Profile with `--profile` to identify.

# Security Considerations

- **`uses()` scoping**: Wide-scoped `uses()` may import traits unintentionally to test files. Always use `->in()` for directory scoping.
- **Custom expectations**: `expect()->extend()` runs in test context. Ensure macros don't expose testing infrastructure.
- **Pest plugins**: Third-party Pest plugins run with test process permissions. Vet plugins before installation.

# Common Mistakes

**Mistake: Using `it()` when `test()` is needed**
- Description: Using `it('does something', fn() => $this->actingAs($user))`
- Cause: "it() is the standard way to write tests in Pest"
- Consequence: `$this` is not available in `it()` closures
- Better: Use `test('does something', fn() => ...)` when you need TestCase access.

**Mistake: Overusing global `uses()` in pest.php**
- Description: `uses(RefreshDatabase::class)->in('tests')` applying to all directories
- Cause: "All tests might need the database"
- Consequence: Unit tests that don't need DB boot it, slowing them by 30-50ms each
- Better: Scope to feature tests only: `uses(RefreshDatabase::class)->in('tests/Feature')`.

**Mistake: Untracked dataset keys in failure output**
- Description: Using unnamed arrays in `->with()`: `->with([['input', true]])`
- Cause: Convenience
- Consequence: Failure output shows `(#0)` instead of meaningful names
- Better: Use named datasets.

**Mistake: Complex closures in higher-order tests**
- Description: Multi-line closures in `it()` chains
- Cause: "Higher-order tests are more concise"
- Consequence: Harder to read than `test()` blocks
- Better: Use `test()` for tests with >2-3 lines of logic.

# Anti-Patterns

- **describe() over-nesting**: 4+ levels of nested describes. Flatten to 2 levels max.
- **Unbounded dataset combinatorics**: Creating cartesian product datasets without monitoring test count.
- **Mixed syntax in one file**: Mixing `it()`, `test()`, and PHPUnit class methods in the same file.
- **Inline dataset duplication**: Repeating the same dataset across multiple files. Extract to `tests/Datasets/`.
- **Magic global helpers**: Defining Pest helpers without documenting them.

# Examples

**Standard Pest test file**
```php
<?php

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('shows the login page', function () {
    get('/login')->assertOk();
});

test('authenticated user can view dashboard', function () {
    $user = User::factory()->create();
    actingAs($user)->get('/dashboard')->assertOk();
});
```

**Named datasets**
```php
test('email validation', function (string $email, bool $valid) {
    $validator = Validator::make(['email' => $email], ['email' => 'email']);
    expect($validator->passes())->toBe($valid);
})->with([
    'valid email' => ['user@example.com', true],
    'missing @' => ['userexample.com', false],
    'empty string' => ['', false],
]);
```

**Describe block with shared setup**
```php
describe('post creation', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    });

    test('authenticated user can create post', function () {
        $this->post('/posts', ['title' => 'Test'])->assertOk();
    });
});
```

# Related Topics

- PHPUnit configuration (phpunit.xml)
- Parallel test execution
- Architecture testing with Pest
- Mutation testing with Pest
- Dataset factory patterns
- Pest 4 browser testing (Playwright)

# AI Agent Notes

- When generating Pest test code, prefer `test()` over `it()` for tests that use `$this`. Use `it()` only for pure value assertions.
- Always use named datasets: `->with(['case name' => [$input, $expected]])`. Never use unnamed arrays.
- Scope `uses()` to specific directories. Never generate global `uses()` in `pest.php`.
- Limit describe blocks to 2 levels of nesting.
- For generated test suites, use `test()` for multi-step tests and higher-order syntax for single-assertion tests.

# Verification

- [ ] `pest.php` scopes traits to specific directories with `->in()`
- [ ] `it()` is used only for tests without `$this` access
- [ ] `test()` is used for tests requiring TestCase methods
- [ ] Datasets use named keys for readable failure output
- [ ] Describe blocks are limited to 2 levels of nesting
- [ ] Custom expectations and helpers are documented
- [ ] Dataset files are organized in `tests/Datasets/`
- [ ] Both Pest and PHPUnit files coexist and run correctly in the same project
