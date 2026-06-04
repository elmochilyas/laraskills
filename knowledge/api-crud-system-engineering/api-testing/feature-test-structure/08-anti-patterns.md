# Anti-Patterns: Feature Test Structure

## AP-1: Monolithic Test Class
**Category**: Code Organization

**Description**: Putting all API endpoint tests in a single monolithic test class. As the API grows, the class becomes unmanageable, tests are hard to find, and the file becomes a bottleneck for parallel test execution.

**Warning Signs**:
- Single `AllApiTest.php` or `ApiFeatureTest.php` class testing every endpoint
- Test file exceeds 500 lines
- Multiple developers frequently merge conflict on the same test file
- CI parallelization cannot split tests across files
- Tests for completely different resources are mixed together

**Harms**:
- Unmaintainable monolith; hard to find specific tests
- Merge conflicts on the single test file
- Cannot run tests for a single resource in isolation
- CI parallelization is limited
- Refactoring one resource affects entire test file

**Real-World Consequence**: A 2000-line `ApiTest.php` contains tests for users, posts, comments, and auth. A developer adds a new endpoint and accidentally breaks a test for an unrelated resource. CI fails and the team spends 30 minutes debugging which change caused the failure in the massive file.

**Preferred Alternative**: One feature test class per controller or resource endpoint group. Mirror the API surface in the test directory structure.

**Refactoring Strategy**: Create `tests/Feature/Api/V1/Posts/` directory, extract post-related tests into `ListPostsTest.php`, `CreatePostTest.php`, etc., extract other resources similarly, remove the monolithic class, update CI parallelization configuration.

**Detection Checklist**:
- `[ ]` Are there test files testing multiple unrelated endpoints?
- `[ ]` Is any test file > 500 lines?
- `[ ]` Can you run tests for a single resource in isolation?
- `[ ]` Does your test directory mirror the API route structure?

**Related**: 05-rules.md (One Class Per Controller, Directory Mirrors API Surface), 04-standardized-knowledge.md, 06-skills.md

---

## AP-2: No AAA Separation
**Category**: Maintainability

**Description**: Writing test methods without clear Arrange-Act-Assert separation. Setup, action, and assertions are interleaved, making tests hard to read and debug.

**Warning Signs**:
- Test methods have no blank lines separating setup, action, and assertions
- It takes > 10 seconds to identify what a test does
- Setup code is mixed with assertion code
- Developers add comments like `// arrange` / `// act` / `// assert` because the structure is unclear
- Code review feedback frequently asks "what is this test testing?"

**Harms**:
- Reduced readability; hard to identify code phases
- Difficult to debug which part of the test fails
- Code review friction — unclear test intent
- Tests become integration suites with unclear boundaries
- Onboarding friction for new team members

**Real-World Consequence**: A test method with no AAA separation has 30 lines of interleaved setup, HTTP calls, and assertions. A developer debugging a CI failure cannot tell whether the `Post` factory creation failed, whether the HTTP call returned a 500, or whether the JSON assertion found the wrong structure.

**Preferred Alternative**: Separate Arrange, Act, and Assert sections with explicit blank lines in every test method.

**Refactoring Strategy**: Review all test methods, add blank line between setup and action, add blank line between action and assertions, use PestPHP's `beforeEach` for shared arrange code, keep action section concise (single line where possible).

**Detection Checklist**:
- `[ ]` Do test methods have blank lines separating AAA sections?
- `[ ]` Can you identify the action under test in < 5 seconds?
- `[ ]` Are assertions visually separated from setup?
- `[ ]` Is test intent clear without reading every line?

**Related**: 05-rules.md (AAA Separation), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-3: Multiple Behaviors Per Test
**Category**: Testing

**Description**: Testing multiple scenarios or endpoint outcomes in a single test method. When the test fails, it's unclear which specific behavior broke.

**Warning Signs**:
- Test method name contains "and" (e.g., `test_creates_and_lists_posts`)
- Single test makes multiple HTTP requests
- Single test asserts multiple unrelated outcomes
- Test failure message is ambiguous about which scenario failed
- Developers add assertions for new behaviors to existing tests

**Harms**:
- Unclear failure messages — hard to identify regression scope
- Tests become integration suites rather than targeted assertions
- One broken behavior can mask others in the same test
- Hard to understand what a test is supposed to verify
- Encourages adding to existing tests instead of writing new ones

**Real-World Consequence**: A test named `test_post_crud` creates a post, reads it, updates it, and deletes it in sequence. The update step fails. The test reports "Expected status code 200 but received 422." The developer doesn't know if create, read, update, or delete broke — just that the HTTP status was wrong at some point after the first 3 requests.

**Preferred Alternative**: One test method per behavior per endpoint per outcome. Each test validates exactly one scenario.

**Refactoring Strategy**: Identify multi-behavior tests, split each HTTP request into its own test method, give each test a descriptive name matching the scenario, ensure each test has independent setup.

**Detection Checklist**:
- `[ ]` Does each test test exactly one behavior?
- `[ ]` Do test names describe a single outcome?
- `[ ]` Are there tests making multiple unrelated HTTP requests?
- `[ ]` Can you determine what failed from the test name alone?

**Related**: 05-rules.md (One Behavior Per Test, Separate Happy Path From Failure), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: No Database Reset Between Tests
**Category**: Testing

**Description**: Running feature tests without `RefreshDatabase` or `DatabaseTransactions`. Records created in one test leak into subsequent tests, causing non-deterministic failures where test order matters.

**Warning Signs**:
- Tests pass when run individually but fail in the full suite
- CI failures are inconsistent — same commit passes then fails
- Test results depend on test execution order
- Assertions on record counts are non-deterministic
- Debugging reveals unexpected records from previous tests

**Harms**:
- Flaky tests that waste debugging time
- CI instability — false positives/negatives
- Developers lose trust in the test suite
- Order-dependent tests cannot be parallelized
- Time wasted investigating non-deterministic failures

**Real-World Consequence**: A `test_lists_posts` test creates 3 posts and asserts `meta.total = 3`. When run after `test_creates_post` (which also creates a post), the count is 4. The test fails inconsistently depending on execution order. CI is red for a valid commit. The team spends 2 hours investigating before discovering the database leak.

**Preferred Alternative**: Apply `RefreshDatabase` or `DatabaseTransactions` to every feature test that interacts with the database.

**Refactoring Strategy**: Add `use RefreshDatabase;` to all feature test classes or apply globally via PestPHP `uses()->group('database')`, remove manual cleanup in tearDown, verify tests are order-independent.

**Detection Checklist**:
- `[ ]` Do feature tests use RefreshDatabase or DatabaseTransactions?
- `[ ]` Are there tests that pass individually but fail in the suite?
- `[ ]` Are assertions on record counts deterministic?
- `[ ]` Can tests run in any order with consistent results?

**Related**: 05-rules.md (Use RefreshDatabase), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: withoutMiddleware in Auth Tests
**Category**: Testing

**Description**: Using `withoutMiddleware('auth')` in tests that are supposed to verify authentication behavior. This bypasses the exact middleware under test, creating false-positive test passes that miss authentication gaps.

**Warning Signs**:
- Auth tests use `withoutMiddleware()`
- Tests pass but API endpoints are accessible without authentication
- Security audit reveals unprotected endpoints despite passing tests
- Developers use `withoutMiddleware` to "speed up" auth tests
- `withoutMiddleware` is applied broadly instead of selectively

**Harms**:
- False-positive auth tests — tests pass without proper auth
- Authentication middleware misconfiguration undetected
- Production data exposed to unauthenticated users
- Security breach in CI-passing code
- Developers have false confidence in auth coverage

**Real-World Consequence**: A test uses `$this->withoutMiddleware()` then asserts `assertUnauthorized()`. The test passes because the assertion runs — but it passes because the controller returns 200 (not 401) when auth middleware is removed. The test doesn't catch that the route is missing authentication. The endpoint is exposed in production without auth.

**Preferred Alternative**: Never use `withoutMiddleware` in tests that verify authentication behavior. Let the full middleware stack run to validate the end-to-end auth pipeline.

**Refactoring Strategy**: Remove `withoutMiddleware` calls from all auth tests, ensure the full middleware stack validates authentication, use `actingAs()` for authenticated scenarios, verify auth failures with real missing/invalid/expired tokens.

**Detection Checklist**:
- `[ ]` Do any auth tests use `withoutMiddleware`?
- `[ ]` Do auth tests validate the full middleware-to-controller pipeline?
- `[ ]` Would removing `withoutMiddleware` cause any auth test to fail?
- `[ ]` Are there endpoints that pass tests but lack auth middleware?

**Related**: 05-rules.md (WithoutExceptionHandling For Debugging Only), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: No Helper Methods for Common Setup
**Category**: Maintainability

**Description**: Duplicating authentication setup, resource creation, and base URL configuration across every test method. Changing the authentication mechanism requires editing every test.

**Warning Signs**:
- `User::factory()->create()` and `Sanctum::actingAs($user)` appear in every test
- Same 3-5 lines of setup code repeated across multiple tests
- Changing auth logic requires editing 20+ test methods
- Helper methods or traits are underutilized
- Test setup is inconsistent across the suite

**Harms**:
- High maintenance cost when authentication or setup logic changes
- Inconsistent setup across tests — some use actingAs, some pass tokens manually
- Test files are longer than necessary
- Setup changes require editing many files
- Increased chance of missing a test during refactoring

**Real-World Consequence**: A team switches from Sanctum to Passport for authentication. Every test method manually creates a Sanctum token. Only 60% of tests are updated. The remaining 40% use the old auth mechanism, creating false-positive passes. Three weeks later, a production bug is traced to the tests that were never updated.

**Preferred Alternative**: Extract repeated test setup (auth headers, resource creation, base URLs) into private helper methods or traits.

**Refactoring Strategy**: Identify repeated setup patterns, extract into private methods or PestPHP `beforeEach`, create base test class with common helpers, use traits for logical groupings, document helper methods.

**Detection Checklist**:
- `[ ]` Is authentication setup (actingAs, token creation) centralized?
- `[ ]` Are factory calls for common resources repeated?
- `[ ]` Can you change auth logic in one place?
- `[ ]` Do tests use helpers or inline setup?

**Related**: 05-rules.md (Helper Methods For Common Setup), 04-standardized-knowledge.md, 06-skills.md
