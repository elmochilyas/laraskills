# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: Pest Framework Fundamentals

---

### Rule 1: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions

| Field | Value |
|-------|-------|
| **Name** | Choose `test()` over `it()` when TestCase access is needed |
| **Category** | Test Syntax |
| **Rule** | Use `test('description', fn() => ...)` when the test body calls `$this->actingAs()`, `$this->get()`, `$this->post()`, or any TestCase method. Use `it('description', fn() => ...)` only for pure assertions that don't need `$this`. |
| **Reason** | `it()` closures do not bind `$this` to the TestCase instance. Accessing `$this` inside `it()` causes a fatal PHP error. |
| **Bad Example** | `it('shows dashboard', fn() => $this->get('/dashboard')->assertOk())` — fatal error. |
| **Good Example** | `test('shows dashboard', fn() => $this->get('/dashboard')->assertOk())` — `$this` is available. |
| **Exceptions** | None. This is a hard Pest constraint, not a style preference. |
| **Consequences Of Violation** | PHP fatal error: "Using $this when not in object context". Tests cannot execute. |

---

### Rule 2: Scope `uses()` to specific directories, never use global wildcard

| Field | Value |
|-------|-------|
| **Name** | Scope trait imports to specific test directories |
| **Category** | Trait Application |
| **Rule** | Always use `uses(Trait::class)->in('tests/Feature')` (specific directory). Never use `uses(Trait::class)->in('*')` or `uses(Trait::class)->in('tests')`. |
| **Reason** | Global trait application forces every test to run trait setup. `RefreshDatabase` applied globally causes unit tests to run migrations, adding 30-50ms per test with no benefit. |
| **Bad Example** | `uses(RefreshDatabase::class)->in('tests')` — applies to Unit tests. |
| **Good Example** | `uses(RefreshDatabase::class)->in('tests/Feature')` — applies only to Feature tests. |
| **Exceptions** | Truly universal traits like `WithoutMiddleware` that are intentionally applied to the entire suite. |
| **Consequences Of Violation** | Unit tests are unnecessarily slow. Developers avoid writing unit tests due to slow feedback. |

---

### Rule 3: Always use named keys in dataset definitions

| Field | Value |
|-------|-------|
| **Name** | Name all dataset cases semantically |
| **Category** | Data-Driven Testing |
| **Rule** | Always use string keys for each dataset row: `->with(['valid email' => ['user@example.com', true]])`. Never use unnamed arrays: `->with([['user@example.com', true]])`. |
| **Reason** | Named keys appear in test failure output, immediately identifying which dataset case failed. Numeric indices require manually mapping back to source data. |
| **Bad Example** | `->with([['user@example.com', true], ['userexample.com', false]])` — failure shows "(#0)". |
| **Good Example** | `->with(['valid email' => ['user@example.com', true], 'missing @' => ['userexample.com', false]])` — failure shows "(valid email)". |
| **Exceptions** | Programmatically generated datasets where keys provide no meaningful context. |
| **Consequences Of Violation** | Debugging is slower. Developers must count array indices to find the failing case. |

---

### Rule 4: Limit `describe()` nesting to 2 levels maximum

| Field | Value |
|-------|-------|
| **Name** | Keep describe nesting at 2 levels max |
| **Category** | Test Organization |
| **Rule** | Never nest `describe()` blocks more than 2 levels deep. |
| **Reason** | Deep nesting reduces readability and may hit PHPUnit's class nesting limits (describe blocks transpile to nested PHP classes). |
| **Bad Example** | `describe('A', fn () => describe('B', fn () => describe('C', fn () => ...)))` — 3+ levels deep. |
| **Good Example** | `describe('A-B', fn () => ...)` — flattened. |
| **Exceptions** | None. Refactor deeply nested describes into separate files. |
| **Consequences Of Violation** | Readability suffers. PHPUnit may throw "Class too deeply nested" errors at runtime. |

---

### Rule 5: Extract shared datasets to `tests/Datasets/` files

| Field | Value |
|-------|-------|
| **Name** | Deduplicate shared datasets |
| **Category** | Test Organization |
| **Rule** | Extract dataset definitions used in multiple test files to dedicated files in `tests/Datasets/` that return PHP arrays. |
| **Reason** | Duplicated inline datasets cause maintenance burden: updating test data requires editing every file that duplicates the dataset. |
| **Bad Example** | The same set of email validation cases repeated in 5 different test files. |
| **Good Example** | `tests/Datasets/emails.php` returning the dataset array, imported via `with('emails')` or similar mechanism. |
| **Exceptions** | Datasets unique to a single test file. |
| **Consequences Of Violation** | Inconsistent test data across files. Data updates require editing multiple locations. |

---

### Rule 6: Never mix Pest `it()`/`test()` with PHPUnit class syntax in the same file

| Field | Value |
|-------|-------|
| **Name** | One syntax style per file |
| **Category** | Test Organization |
| **Rule** | Choose either Pest syntax (`it()`/`test()`) or PHPUnit class syntax per file. Never mix both in the same file. |
| **Reason** | Pest transpiles closure-based tests into PHPUnit methods. Mixed syntax causes PHPUnit to see duplicate or malformed test definitions. |
| **Bad Example** | A file with both `it('works', fn() => ...)` and `public function test_works() { ... }`. |
| **Good Example** | File `tests/Feature/UserTest.php`: PHPUnit class. File `tests/Feature/PostTest.php`: Pest `it()`/`test()`. |
| **Exceptions** | None. Pest explicitly forbids mixing syntax in the same file. |
| **Consequences Of Violation** | PHPUnit errors about duplicate methods or unexpected structure. Tests cannot run. |

---

### Rule 7: Cache Pest transpilation in CI for cold-start performance

| Field | Value |
|-------|-------|
| **Name** | Cache transpilation output in CI |
| **Category** | Performance |
| **Rule** | Configure CI to cache Pest's transpilation output directory. |
| **Reason** | Cold transpilation adds ~50ms per file. A 200-file suite pays 10 seconds in transpilation overhead on every CI run. |
| **Bad Example** | No CI cache — every run transpiles all files from scratch. |
| **Good Example** | GitHub Actions `actions/cache` step for `storage/framework/testing/`. |
| **Exceptions** | Suites under 50 files where caching overhead exceeds benefit. |
| **Consequences Of Violation** | CI runs are 10-20 seconds slower than necessary. |

---

### Rule 8: Prefer `test()` for multi-step tests, higher-order syntax for single assertions

| Field | Value |
|-------|-------|
| **Name** | Use `test()` for complex logic, higher-order for one-liners |
| **Category** | Test Readability |
| **Rule** | Use explicit `test()` closures for tests with more than 2-3 lines. Reserve higher-order `it()->assert()` chains for single-assertion tests. |
| **Reason** | Higher-order chains become unreadable as logic grows. `test()` blocks support breakpoints, explicit variable scope, and better error messages. |
| **Bad Example** | A 10-line `it()...assert()...assert()...etc()` chain trying to express complex logic in one expression. |
| **Good Example** | `test('processes order', function () { $order = createOrder(); $result = process($order); expect($result->status)->toBe('completed'); });` |
| **Exceptions** | Trivially simple assertions fitting one line, like `it('has users')->assertDatabaseHas('users', ['id' => 1]);` |
| **Consequences Of Violation** | Tests are harder to debug. Stack traces point to long chains instead of specific assertions. |

---

### Rule 9: Document custom `expect()->extend()` helpers in project guidelines

| Field | Value |
|-------|-------|
| **Name** | Document custom expectation macros |
| **Category** | Team Practices |
| **Rule** | Custom expectations defined via `expect()->extend()` must be documented with examples in the project's testing guidelines. |
| **Reason** | Custom macros are invisible to developers who didn't write them. Undocumented helpers lead to duplicated effort or remain unused. |
| **Bad Example** | `expect()->extend('toBeValidEmail', fn () => $this->toBe('valid'))` with no documentation. |
| **Good Example** | Custom expectations listed in `tests/README.md` with usage examples and parameter descriptions. |
| **Exceptions** | Self-documenting helpers whose purpose is obvious from the name. |
| **Consequences Of Violation** | Helpers go unused. Multiple developers independently implement the same assertion logic. |

---

### Rule 10: Use `describe()` blocks for shared setup within a single file

| Field | Value |
|-------|-------|
| **Name** | Use `describe()` with `beforeEach()` for shared setup |
| **Category** | Test Organization |
| **Rule** | When multiple tests in a file share setup logic (authenticating a user, creating related models), group them in a `describe()` block with a `beforeEach()`. |
| **Reason** | `describe()` scopes `beforeEach()` to its contained tests, eliminating setup duplication while keeping setup close to the tests that need it. |
| **Bad Example** | `$this->actingAs($user); $this->post('/dashboard');` repeated at the start of every test in the file. |
| **Good Example** | `describe('dashboard', function () { beforeEach(fn () => $this->actingAs(User::factory()->create())); test('shows posts', fn () => $this->get('/dashboard')->assertOk()); });` |
| **Exceptions** | Setup shared across multiple files should use directory-level `uses()` in `pest.php`. |
| **Consequences Of Violation** | Duplicated setup code. Updating setup requires editing every test. Tests are unnecessarily long. |
