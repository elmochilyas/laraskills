# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Pest Configuration
 KU Code: ku-02-pest-configuration
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Pest is the dominant testing framework in the Laravel ecosystem (2026). It wraps PHPUnit with a more expressive DSL: higher-order `it()` and `test()` functions, `describe()` blocks for grouping, arch expectations, dataset-driven parameterization, and built-in mutation/browser testing. Pest configuration via `pest.php` controls trait scoping, global setup, and Pest-specific features. Choosing Pest over raw PHPUnit reduces boilerplate ~40% and improves test readability. The framework compiles down to PHPUnit under the hood.

# Core Concepts
- **Higher-order functions**: `it('does something', fn() => ...)` eliminates class boilerplate.
- **`describe()` blocks**: Nestable groups with shared `beforeEach()` setup. Can have their own `uses()`, `beforeEach()`, `afterEach()`.
- **`uses()` trait injection**: Import traits like `RefreshDatabase` at file or directory level via `uses(Trait::class)->in('directory')`.
- **Expectations API**: `expect($result)->toBe(expected)` is Pest's assertion style. Full PHPUnit assertions remain available.
- **Datasets**: `[input, expected]` tuples via `with([...])` or dedicated dataset files. Each row becomes an independent test case.
- **Architecture testing**: Native `arch()->expect('App')->toUseStrictTypes()` without extra packages.
- **Contextual helpers**: `pest()->extend()` for custom expectation macros.

# When To Use
- New Laravel projects (Pest is the default in Laravel 13)
- Teams wanting built-in architecture, mutation, and browser testing
- Projects where test readability and reduced boilerplate are priorities
- Gradual migration from PHPUnit (file-by-file with `pest-plugin-migrate`)
- Teams that value expressive DSL over explicit class structure

# When NOT To Use
- Projects that cannot upgrade to PHP 8.3+ (Pest 4 requires PHP 8.3+)
- Teams heavily invested in PHPUnit-specific features they don't want to give up
- Projects where PHPUnit is already well-established and team has no bandwidth to learn
- As a replacement for understanding PHPUnit (Pest debugging requires PHPUnit knowledge)
- When custom PHPUnit extensions have complex integration requirements

# Best Practices (WHY)
- **Scope `uses()` to specific directories, not globally**: Reason: `uses(RefreshDatabase::class)->in('tests/Feature')` applies DB traits only to feature tests. Global application slows unit tests that don't need DB.
- **Use `test()` when you need `$this`, use `it()` for pure assertions**: Reason: `test()` receives the TestCase instance (`$this`). `it()` does not. Use `test()` for `$this->actingAs()`, `$this->get()`, etc.
- **Name datasets semantically**: Reason: `->with(['valid email' => ['user@example.com', true]])` shows meaningful names in failure output. Array index names (`#0`, `#1`) are useless for debugging.
- **Limit describe() nesting to 2 levels**: Reason: deeply nested describes reduce readability and may hit PHPUnit class nesting limits.
- **Use directory-level `uses()` for consistent trait application**: Reason: one `uses()->in('tests/Feature/Api')` applies to all API tests. Eliminates per-file imports.
- **Cache transpilation output in CI**: Reason: cold cache adds ~50ms per file. CI can shave seconds by warming the cache directory.
- **Document Pest-specific conventions in team guidelines**: Reason: new team members need to know the difference between `it()` and `test()`, dataset naming, and trait scoping.

# Architecture Guidelines
- **File naming**: Pest test files use `*.test.php` extension. PHPUnit files use `*Test.php`. Both can coexist.
- **`pest.php` location**: Project root, alongside `phpunit.xml`. Returns `Pest\TestSuite` configuration.
- **Configuration layering**: `phpunit.xml` (global) → `pest.php` (Pest-specific) → per-file `uses()` (file-level).
- **Helper organization**: Custom expectations via `expect()->extend()`. Custom helpers via traits. Dataset files in `tests/Datasets/`.
- **Directory structure**: `tests/Unit/`, `tests/Feature/`, `tests/Browser/`, `tests/Architecture/`, `tests/Datasets/`.
- **Dataset files**: Store reusable datasets in `tests/Datasets/` as PHP files returning arrays.

# Performance
- **Transpilation overhead**: Pest adds ~20-50ms per test file. CI cold cache is slightly slower than raw PHPUnit.
- **Runtime overhead**: Zero. Transpiled code executes at native PHPUnit speeds.
- **Memory**: Closure-based tests have negligible overhead vs PHPUnit methods.
- **Dataset expansion**: Combined datasets (cartesian product) can generate thousands of test cases. Monitor test count.
- **Parallel mode**: Uses Paratest. Same performance as PHPUnit parallel.

# Security
- **`uses()` scoping**: Wide-scoped `uses()` may import traits unintentionally to test files. Always use `->in()` for directory scoping.
- **Custom expectations**: `expect()->extend()` runs in test context. Ensure macros don't expose testing infrastructure.
- **Dataset files**: Dataset files in `tests/Datasets/` may contain sensitive test data. Review content before committing.
- **Pest plugins**: Third-party Pest plugins run with test process permissions. Vet plugins before installation.

# Common Mistakes

**Mistake: Using `it()` when `test()` is needed**
- Description: Using `it('does something', fn() => $this->actingAs($user))`
- Cause: "it() is the standard way to write tests in Pest"
- Consequence: `$this` is not available in `it()` closures; "Using $this when not in object context" error
- Better: Use `test('does something', fn() => ...)` when you need TestCase access.

**Mistake: Global `uses()` in `pest.php`**
- Description: `uses(RefreshDatabase::class)->in('tests')` applying to all test directories
- Cause: Convenience; "all tests might need the database"
- Consequence: Unit tests that don't need DB boot it in setUp, slowing them by 30-50ms each
- Better: Scope to feature tests only: `uses(RefreshDatabase::class)->in('tests/Feature')`.

**Mistake: Untracked dataset key names**
- Description: Using unnamed arrays in `->with()`: `->with([['input', true], ['input2', false]])`
- Cause: Convenience; "the test data is simple"
- Consequence: Failure output shows `(#0)` instead of meaningful names; hard to identify failing case
- Better: Use named datasets: `->with(['valid input' => ['input', true], 'invalid input' => ['input2', false]])`.

**Mistake: Complex closures in higher-order tests**
- Description: Multi-line closures in `it()->assert()->etc()` chains
- Cause: "Higher-order tests are more concise"
- Consequence: Harder to read than `test()` blocks; debugging is more difficult
- Better: Use `test()` for tests with >2-3 lines of logic. Reserve higher-order syntax for single-assertion tests.

# Anti-Patterns
- **describe() over-nesting**: 4+ levels of nested describes. Flatten to 2 levels max.
- **Unbounded dataset combinatorics**: Creating cartesian product datasets without monitoring test count. Can generate millions of tests.
- **Mixed syntax in one file**: Mixing `it()`, `test()`, and PHPUnit class methods in the same file. Choose one syntax per file.
- **Inline dataset duplication**: Repeating the same dataset across multiple files. Extract to `tests/Datasets/`.
- **Magic global helpers**: Defining Pest helpers without documenting them. Team members don't know what's available.

# Examples

**Standard `pest.php`**
```php
<?php

uses(Tests\TestCase::class)->in('tests/Feature');
uses(Illuminate\Foundation\Testing\RefreshDatabase::class)->in('tests/Feature');
```

**Test with TestCase access**
```php
test('authenticated user can view dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk();
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

# AI Agent Notes
- When generating Pest test code, prefer `test()` over `it()` for tests that use `$this`. Use `it()` only for pure value assertions.
- Always use named datasets: `->with(['case name' => [$input, $expected]])`. Never use unnamed arrays.
- Scope `uses()` to specific directories. Never generate global `uses()` in `pest.php`.
- Limit describe blocks to 2 levels of nesting.
- For generated test suites, use `test()` for multi-step tests and higher-order syntax for single-assertion tests.
- When migrating PHPUnit code to Pest, use `pest-plugin-migrate` but review edge cases manually.

# Verification
- [ ] `pest.php` scopes traits to specific directories with `->in()`
- [ ] `it()` is used only for tests without `$this` access
- [ ] `test()` is used for tests requiring TestCase methods
- [ ] Datasets use named keys for readable failure output
- [ ] describe blocks are limited to 2 levels of nesting
- [ ] Custom expectations and helpers are documented
- [ ] Dataset files are organized in `tests/Datasets/`
- [ ] Both Pest and PHPUnit files coexist and run correctly in the same project
