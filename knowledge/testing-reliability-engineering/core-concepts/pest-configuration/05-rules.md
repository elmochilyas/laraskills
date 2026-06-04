# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: Pest Configuration

---

### Rule 1: Scope `uses()` to specific directories, never apply globally

| Field | Value |
|-------|-------|
| **Name** | Scope `uses()` to specific directories |
| **Category** | Trait Application |
| **Rule** | Always use `uses(Trait::class)->in('directory')` to scope trait imports to specific test directories. Never apply traits globally via `uses(Trait::class)->in('*')`. |
| **Reason** | Global trait application forces every test file, including unit tests, to run database migrations and trait setup. This adds 30-50ms per unit test unnecessarily. |
| **Bad Example** | `uses(RefreshDatabase::class)->in('tests')` — applies RefreshDatabase to unit tests in tests/Unit. |
| **Good Example** | `uses(RefreshDatabase::class)->in('tests/Feature')` — scoped to feature tests only. |
| **Exceptions** | Traits that are truly global (e.g., `WithoutMiddleware`) can be applied globally, but this is rare and should be documented. |
| **Consequences Of Violation** | Unit tests run slowly due to unnecessary database setup. Developers avoid writing unit tests because they are slow. |

---

### Rule 2: Use `test()` when `$this` is needed, `it()` for pure assertions

| Field | Value |
|-------|-------|
| **Name** | Choose `test()` over `it()` for TestCase access |
| **Category** | Test Syntax |
| **Rule** | Use `test('description', fn() => ...)` when the test body accesses `$this` for HTTP helpers, `actingAs()`, or any TestCase method. Use `it('description', fn() => ...)` only for pure value assertions that don't need `$this`. |
| **Reason** | `it()` closures do not receive the TestCase instance as `$this`. Using `$this` in an `it()` closure produces a "Using $this when not in object context" fatal error. |
| **Bad Example** | `it('authenticated user can view dashboard', fn() => $this->actingAs($user)->get('/dashboard')->assertOk())` — `$this` not available. |
| **Good Example** | `test('authenticated user can view dashboard', fn() => $this->actingAs($user)->get('/dashboard')->assertOk())` — `$this` is the TestCase instance. |
| **Exceptions** | None. The distinction between `it()` and `test()` is a hard Pest constraint. |
| **Consequences Of Violation** | Fatal PHP error: "Using $this when not in object context". Tests cannot run. |

---

### Rule 3: Always name dataset keys semantically for readable failure output

| Field | Value |
|-------|-------|
| **Name** | Use named dataset keys |
| **Category** | Data-Driven Testing |
| **Rule** | Always provide string keys for dataset rows in `->with()`. Each key should describe the test case meaningfully (e.g., `'valid email'`, `'empty string'`). |
| **Reason** | Named keys appear in test failure output instead of numeric indices (`#0`, `#1`). A developer seeing "email validation (valid email)" immediately knows which case failed without inspecting the dataset. |
| **Bad Example** | `->with([['user@example.com', true], ['userexample.com', false]])` — failure shows `(#0)`. |
| **Good Example** | `->with(['valid email' => ['user@example.com', true], 'missing @' => ['userexample.com', false]])` — failure shows `(valid email)`. |
| **Exceptions** | When datasets are auto-generated programmatically and keys provide no meaningful information. |
| **Consequences Of Violation** | Debugging test failures requires manually mapping numeric indices back to dataset values. Wastes developer time. |

---

### Rule 4: Limit `describe()` nesting to 2 levels maximum

| Field | Value |
|-------|-------|
| **Name** | Limit describe block nesting to 2 levels |
| **Category** | Test Organization |
| **Rule** | Never nest `describe()` blocks more than 2 levels deep. |
| **Reason** | Deeply nested describes reduce test readability and can hit PHPUnit's class nesting limits (Pest transpiles each describe into a nested class). Beyond 2 levels, the test hierarchy becomes confusing. |
| **Bad Example** | `describe('Auth', fn () => describe('Admin', fn () => describe('Permissions', fn () => ...)))` — 3+ levels of nesting. |
| **Good Example** | `describe('Admin permissions', fn () => ...)` — flattened to one level. |
| **Exceptions** | None. Refactor deeply nested describes into separate test files. |
| **Consequences Of Violation** | Tests become hard to read. PHPUnit may throw "Class too deeply nested" errors. |

---

### Rule 5: Extract reusable datasets to `tests/Datasets/` files

| Field | Value |
|-------|-------|
| **Name** | Extract shared datasets to dedicated files |
| **Category** | Test Organization |
| **Rule** | When the same dataset is used in multiple test files, extract it to a dedicated file in `tests/Datasets/` that returns an array. |
| **Reason** | Inline dataset duplication violates DRY and causes maintenance burden when a dataset must be updated in multiple places. Dedicated dataset files centralize data and can be reused across test files and test suites. |
| **Bad Example** | Same `['valid email', 'invalid email', 'empty string']` dataset copied in 5 test files. |
| **Good Example** | `tests/Datasets/emails.php` returning `['valid email' => [...], 'invalid' => [...]]`, then imported via `with(new Dataset([...]))`. |
| **Exceptions** | Datasets that are unique to a single test and unlikely to be reused. |
| **Consequences Of Violation** | Inconsistent data across test files. Updating a dataset requires editing multiple files. |

---

### Rule 6: Prefer `test()` over higher-order syntax for tests with more than 2-3 lines

| Field | Value |
|-------|-------|
| **Name** | Use `test()` for multi-line test logic |
| **Category** | Test Readability |
| **Rule** | Use `test()` with an explicit closure for any test containing more than 2-3 lines of logic. Reserve higher-order `it()->assert()` chains for single-assertion tests. |
| **Reason** | Higher-order syntax is elegant for simple assertions but becomes unreadable when logic grows. `test()` blocks are easier to debug because they have explicit variable scope and breakpoints. |
| **Bad Example** | A 10-line chain of `it()->assert()->assert()->etc()` that tries to fit everything in one expression. |
| **Good Example** | `test('complex operation', function () { $result = performComplexOperation(); expect($result->status)->toBe('success'); expect($result->data)->toHaveKey('id'); });` |
| **Exceptions** | One-liner assertions that fit cleanly in a higher-order expression (e.g., `it('has users')->assertDatabaseHas('users', ['email' => 'test@test.com'])->assertOk();`). |
| **Consequences Of Violation** | Tests are harder to read and debug. Complex expressions make stack traces less useful. |

---

### Rule 7: Never mix `it()`, `test()`, and PHPUnit class syntax in the same file

| Field | Value |
|-------|-------|
| **Name** | Use one syntax style per file |
| **Category** | Test Organization |
| **Rule** | Choose exactly one syntax style per test file: either all `it()`/`test()` (Pest), or all class methods (PHPUnit). Never mix both in the same file. |
| **Reason** | Pest transpiles `it()` and `test()` into PHPUnit methods within a generated class. Mixing syntax styles causes PHPUnit to see duplicate test methods or unexpected structure, leading to runtime errors. |
| **Bad Example** | A file with both `it('has users', fn() => ...)` and `public function test_users() { ... }` in the same scope. |
| **Good Example** | One file: all `it()`/`test()` calls. Different file: all PHPUnit class methods. Both coexist in the same project. |
| **Exceptions** | None. Pest explicitly forbids mixed syntax. |
| **Consequences Of Violation** | PHPUnit throws errors about unexpected method signatures or duplicate test definitions. |

---

### Rule 8: Cache transpilation output in CI for faster cold starts

| Field | Value |
|-------|-------|
| **Name** | Cache Pest transpilation in CI |
| **Category** | Performance |
| **Rule** | Configure CI pipeline to cache Pest's transpilation output directory (typically `storage/framework/testing/` or Pest's cache path). |
| **Reason** | Cold transpilation cache adds ~50ms per test file. For a 200-file test suite, this adds 10 seconds to CI runtime. Caching eliminates this overhead. |
| **Bad Example** | No CI cache configuration — every CI run pays the full transpilation cost. |
| **Good Example** | GitHub Actions `actions/cache` step restoring and saving the transpilation cache directory. |
| **Exceptions** | Test suites under 50 files where cache overhead exceeds benefit. |
| **Consequences Of Violation** | CI runs are 10-20 seconds slower than necessary. Cumulatively significant across multiple CI runs per day. |

---

### Rule 9: Document custom expectations and helpers in team guidelines

| Field | Value |
|-------|-------|
| **Name** | Document custom Pest expectations |
| **Category** | Team Practices |
| **Rule** | Custom expectations defined via `expect()->extend()` and custom Pest helpers must be documented in the project's testing guidelines. |
| **Reason** | Custom expectations and helpers are invisible to new team members. Without documentation, developers don't know they exist, leading to duplicated effort or unused utilities. |
| **Bad Example** | `expect()->extend('toBeValidEmail', fn () => $this->toBe('valid'))` defined somewhere in `tests/Helpers/` with no documentation. |
| **Good Example** | Custom expectations documented in `tests/README.md` or an `AGENTS.md` file with examples and usage guidelines. |
| **Exceptions** | Self-documenting helpers used extensively across the codebase (e.g., `loginAsAdmin()` is obvious from its name). |
| **Consequences Of Violation** | Developers reinvent the same helpers. Team productivity decreases as each member independently discovers utilities. |

---

### Rule 10: Use `pest.php` only for Pest-specific configuration, not environment variables

| Field | Value |
|-------|-------|
| **Name** | Keep environment config in `phpunit.xml`, not `pest.php` |
| **Category** | Configuration Organization |
| **Rule** | Do not set environment variables or shared testing configuration in `pest.php`. Use `phpunit.xml` for all environment-level configuration and `pest.php` only for Pest-specific DSL features. |
| **Reason** | Environment variables in `pest.php` are not read by PHPUnit when running raw PHPUnit commands. `phpunit.xml` is the single source of truth for environment configuration. |
| **Bad Example** | `$_ENV['DB_CONNECTION'] = 'sqlite';` in `pest.php` — works in Pest but not in PHPUnit. |
| **Good Example** | `<env name="DB_CONNECTION" value="sqlite"/>` in `phpunit.xml` — works for both. |
| **Exceptions** | Pest plugin configuration that has no `phpunit.xml` equivalent (e.g., `->parallel()->fake()`, `->withFaker()`). |
| **Consequences Of Violation** | Tests behave differently when run via `php artisan test` vs `phpunit`. CI failures that are hard to reproduce locally. |

---

### Rule 11: Prefer `describe()` blocks over per-file `uses()` for shared setup within a file

| Field | Value |
|-------|-------|
| **Name** | Use `describe()` for shared file-level setup |
| **Category** | Test Organization |
| **Rule** | When multiple tests in one file share the same setup (e.g., authenticating a user, creating related models), use `describe()` with `beforeEach()` instead of duplicating setup code in each test. |
| **Reason** | `describe()` blocks provide a scope where `beforeEach()` runs before each enclosed test, eliminating duplication while keeping setup close to the tests that use it. |
| **Bad Example** | `$this->actingAs($user); $this->post('/dashboard');` repeated in every test of the same file. |
| **Good Example** | `describe('dashboard', function () { beforeEach(fn () => $this->actingAs(User::factory()->create())); test('shows posts', fn () => $this->get('/dashboard')->assertOk()); });` |
| **Exceptions** | When setup is shared across multiple files, use directory-level `uses()` in `pest.php` instead. |
| **Consequences Of Violation** | Setup code is duplicated across tests. Updating setup requires editing every test. Tests are longer and harder to read. |
