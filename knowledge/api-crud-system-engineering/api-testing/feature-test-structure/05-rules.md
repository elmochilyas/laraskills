# Feature Test Structure — Rules

## One Class Per Controller
---
## Category
Code Organization
---
## Rule
Always map one feature test class to one controller or resource endpoint group.
---
## Reason
Mirroring the controller boundary makes tests discoverable and maintainable. When a controller is renamed or split, the corresponding test follows naturally.
---
## Bad Example
```php
// tests/Feature/AllApiTest.php — monolithic class testing every endpoint
it('lists posts', fn () => $this->getJson('/api/posts')->assertOk());
it('creates posts', fn () => $this->postJson('/api/posts', [...] )->assertCreated());
it('creates comments', fn () => $this->postJson('/api/comments', [...] )->assertCreated());
```
---
## Good Example
```php
// tests/Feature/Api/Posts/ListPostsTest.php
it('lists posts', fn () => $this->getJson('/api/posts')->assertOk());
// tests/Feature/Api/Posts/CreatePostTest.php
it('creates posts', fn () => $this->postJson('/api/posts', [...])->assertCreated());
// tests/Feature/Api/Comments/CreateCommentTest.php
it('creates comments', fn () => $this->postJson('/api/comments', [...])->assertCreated());
```
---
## Exceptions
Utility endpoints (health-check, meta, config) may be grouped in a single class.
---
## Consequences Of Violation
Unmaintainable monolith; test renaming/refactoring causes sweeping changes; unclear which controller is covered.
---

## AAA Separation
---
## Category
Maintainability
---
## Rule
Separate Arrange, Act, and Assert sections with explicit blank lines in every test method.
---
## Reason
AAA visual structure makes tests scannable. A developer can immediately identify test data setup, the action under test, and expected outcomes without reading every line.
---
## Bad Example
```php
it('creates a post', function () {
    $user = User::factory()->create();
    $data = ['title' => 'Hello'];
    $response = $this->actingAs($user)->postJson('/api/posts', $data);
    $response->assertCreated();
    $this->assertDatabaseHas('posts', ['title' => 'Hello']);
});
```
---
## Good Example
```php
it('creates a post', function () {
    $user = User::factory()->create();
    $data = ['title' => 'Hello'];

    $response = $this->actingAs($user)->postJson('/api/posts', $data);

    $response->assertCreated();
    $this->assertDatabaseHas('posts', ['title' => 'Hello']);
});
```
---
## Exceptions
Single-line `it()` with PestPHP expressive syntax (e.g., `it('...')->assertOk()`) may omit blank-line separation.
---
## Consequences Of Violation
Reduced readability; difficult to identify which code belongs to which phase; code review friction.
---

## Use RefreshDatabase
---
## Category
Testing
---
## Rule
Always apply the `RefreshDatabase` trait to every feature test class that interacts with the database.
---
## Reason
`RefreshDatabase` guarantees a clean state between each test by wrapping each test in a transaction (with SQLite) or migrating and truncating tables (with other databases). Without it, records from one test leak into the next, causing flaky failures.
---
## Bad Example
```php
// No RefreshDatabase — previous test's posts are visible
it('lists posts', function () {
    Post::factory()->count(3)->create();
    $response = $this->getJson('/api/posts');
    expect($response->json('meta.total'))->toBe(3); // Flaky — depends on previous tests
});

// In PHPUnit base: class TestCase extends BaseTestCase { use RefreshDatabase; }
```
---
## Good Example
```php
uses(RefreshDatabase::class);

it('lists posts', function () {
    Post::factory()->count(3)->create();

    $response = $this->getJson('/api/posts');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(3); // Deterministic
});
```
---
## Exceptions
Tests that do not touch the database (pure unit tests or mock-only tests) may omit `RefreshDatabase`.
---
## Consequences Of Violation
Flaky tests that pass in isolation but fail in a suite; CI instability; wasted debugging time on non-deterministic failures.
---

## One Behavior Per Test
---
## Category
Testing
---
## Rule
Never test more than one scenario per test method.
---
## Reason
A test that asserts multiple behaviors (e.g., "creates and lists") obscures which scenario failed and why. Single-behavior tests produce clear failure messages and make the test suite a reliable diagnostic tool.
---
## Bad Example
```php
it('works with posts', function () {
    $post = Post::factory()->create();
    $this->getJson('/api/posts')->assertOk();
    $this->getJson("/api/posts/{$post->id}")->assertOk();
    $this->putJson("/api/posts/{$post->id}", ['title' => 'Updated'])->assertOk();
});
```
---
## Good Example
```php
it('lists posts', fn () => $this->getJson('/api/posts')->assertOk());
it('shows a post', function () {
    $post = Post::factory()->create();
    $this->getJson("/api/posts/{$post->id}")->assertOk();
});
it('updates a post', function () {
    $post = Post::factory()->create();
    $this->putJson("/api/posts/{$post->id}", ['title' => 'Updated'])->assertOk();
});
```
---
## Exceptions
Testing idempotency or rate limits may require multiple requests in a single test to verify state accumulation.
---
## Consequences Of Violation
Unclear failure messages; hard to identify regression scope; tests become integration suites rather than targeted assertions.
---

## WithoutExceptionHandling For Debugging Only
---
## Category
Testing
---
## Rule
Never use `withoutExceptionHandling()` in tests meant to pass — use it only to debug failing tests during development.
---
## Reason
`withoutExceptionHandling()` rethrows framework exceptions instead of converting them to HTTP error responses. Tests that expect 422 but use this method will throw uncaught exceptions instead, failing with a confusing error stack.
---
## Bad Example
```php
it('rejects invalid title', function () {
    $this->withoutExceptionHandling(); // ← causes test to throw instead of assert 422

    $response = $this->postJson('/api/posts', ['title' => '']);

    $response->assertStatus(422); // Never reached — ValidationException thrown
});
```
---
## Good Example
```php
it('rejects invalid title', function () {
    $response = $this->postJson('/api/posts', ['title' => '']);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['title']);
});
```
---
## Exceptions
When debugging a 500 error, temporarily use `withoutExceptionHandling()` to reveal the underlying exception, then remove it before commit.
---
## Consequences Of Violation
False-positive test failures; obscured assertion errors; accidental commit of debug code.
---

## Directory Mirrors API Surface
---
## Category
Code Organization
---
## Rule
Mirror the API route structure in the test directory hierarchy.
---
## Reason
A developer looking for tests for `/api/v1/posts/{id}/comments` should find them at `tests/Feature/Api/V1/Posts/CommentsTest.php`. Consistent directory mapping removes guesswork and enforces organizational discipline.
---
## Bad Example
```
tests/Feature/
├── AllPostTests.php          # Tests for /api/posts
├── CommentFeatureTest.php    # Tests for /api/posts/{id}/comments
├── UserLoginTest.php         # Tests for /api/auth/login
```
---
## Good Example
```
tests/Feature/Api/
├── V1/
│   ├── Auth/
│   │   └── LoginTest.php     # Tests for /api/v1/auth/login
│   └── Posts/
│       ├── ListPostsTest.php # Tests for GET /api/v1/posts
│       └── CommentsTest.php  # Tests for /api/v1/posts/{id}/comments
```
---
## Exceptions
Simple APIs with fewer than 10 endpoints may flatten the directory structure.
---
## Consequences Of Violation
Developers cannot find tests by route pattern; duplicated or missing tests go unnoticed; onboarding friction.
---

## Helper Methods For Common Setup
---
## Category
Maintainability
---
## Rule
Extract repeated test setup (authentication headers, resource creation, base URLs) into private helper methods or traits.
---
## Reason
Duplicated setup code in every test method creates maintenance burden — changing how a user is authenticated requires editing every test. Centralized helpers keep tests DRY and reduce the surface area for bugs.
---
## Bad Example
```php
it('creates a post', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    // ... test logic
});

it('updates a post', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    // ... test logic
});
```
---
## Good Example
```php
function actingAsUser(): void
{
    $user ??= User::factory()->create();
    Sanctum::actingAs($user);
}

it('creates a post', function () {
    actingAsUser();
    // ... test logic
});

it('updates a post', function () {
    actingAsUser();
    // ... test logic
});
```
---
## Exceptions
Helpers that obscure the test's intent or require parameter overrides may be better as inline setup.
---
## Consequences Of Violation
Duplicated setup code; high maintenance cost when authentication or setup logic changes; increased chance of inconsistent setup across tests.
---

## Separate Happy Path From Failure
---
## Category
Testing
---
## Rule
Never mix happy-path and failure assertions in the same test method — write separate tests for success scenarios and error scenarios.
---
## Reason
Happy-path and failure tests validate different concerns (positive contract vs. error handling). Mixing them creates a test that can fail for multiple unrelated reasons, obscuring the root cause. Separate tests produce clear failure messages.
---
## Bad Example
```php
it('handles posts', function () {
    $response = $this->getJson('/api/posts');
    $response->assertOk(); // Happy path
    $response = $this->getJson('/api/posts/999999');
    $response->assertNotFound(); // Failure — different concern
});
```
---
## Good Example
```php
it('lists posts', fn () => $this->getJson('/api/posts')->assertOk());

it('returns 404 for non-existent post', fn () => $this->getJson('/api/posts/999999')->assertNotFound());
```
---
## Exceptions
When testing a single behavior that inherently produces mixed results (e.g., partial-success bulk operations), one test may assert both success and failure per item.
---
## Consequences Of Violation
Unclear failure messages; tests become integration suites; harder to identify regression type (contract vs. error handling).
---
