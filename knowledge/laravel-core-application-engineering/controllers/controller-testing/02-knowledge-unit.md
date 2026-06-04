# Controller Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Controller Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Controller testing in Laravel is primarily done through HTTP feature tests — simulated requests that exercise the full framework stack (routing, middleware, controllers, responses). The framework's `TestCase` provides a fluent API for simulating any HTTP method and asserting against the response's status, content, headers, session, and database side effects.

The engineering significance of controller testing lies in the balance between coverage and speed. Feature tests exercise the entire request-response cycle, catching integration bugs that unit tests miss. However, they are slower than isolated unit tests. The community consensus (Spatie, Tighten, Laravel Docs) recommends approximately 80% feature tests for HTTP-layer coverage and 20% unit tests for isolated business logic. This inverts the traditional testing pyramid because controllers ARE the integration point — testing them in isolation defeats the purpose.

Controller tests verify routing (correct controller + method), middleware application (auth blocks guests, throttle limits rate), validation (FormRequest rules), authorization (Policy gates), response structure (JSON shape, view data), and side effects (database state, dispatched events). Each of these can be tested individually against a simulated HTTP request using the `$this->get()`, `$this->post()`, `$this->put()`, `$this->patch()`, and `$this->delete()` test helpers.

---

## Core Concepts

### Feature Test (HTTP Test)
A feature test simulates an HTTP request against the application and asserts against the response. It runs the full framework stack including routing, middleware, controller dispatch, validation, and response rendering. The test does NOT need a running web server — it uses Laravel's internal request handling.

```php
$response = $this->get('/posts');
$response->assertOk();
$response->assertViewHas('posts');
```

### Response Assertions
Every Laravel HTTP test method returns a `Illuminate\Testing\TestResponse` instance providing dozens of assertion methods:

**Status assertions:**
```php
$response->assertOk();                // 200
$response->assertCreated();           // 201
$response->assertNoContent();         // 204
$response->assertUnauthorized();      // 401
$response->assertForbidden();         // 403
$response->assertNotFound();          // 404
$response->assertUnprocessable();     // 422
```

**View assertions:**
```php
$response->assertViewHas('posts');
$response->assertViewHas('user', fn($user) => $user->isAdmin());
$response->assertViewIs('posts.index');
$response->assertSee('Welcome back');
```

**JSON assertions:**
```php
$response->assertJson(['created' => true]);
$response->assertJsonStructure(['data' => ['id', 'title']]);
$response->assertJsonCount(5, 'data');
$response->assertJsonPath('user.name', 'Sally');
```

**Redirect assertions:**
```php
$response->assertRedirect('/dashboard');
$response->assertRedirectToRoute('home');
$response->assertRedirectContains('dashboard');
```

**Validation assertions:**
```php
$response->assertSessionHasErrors(['title', 'body']);
$response->assertSessionHasErrorsIn('store', ['email']);
$response->assertSessionDoesntHaveErrors();
$response->assertValid();
$response->assertJsonValidationErrors(['title']);
```

### Fluent JSON Testing (AssertableJson)
Laravel's fluent JSON assertions allow granular structure and value checks:

```php
use Illuminate\Testing\Fluent\AssertableJson;

$response->assertJson(fn (AssertableJson $json) =>
    $json->where('id', 1)
         ->where('email', fn (string $e) => str($e)->endsWith('@example.com'))
         ->whereNot('status', 'pending')
         ->missing('password')
         ->has('roles', 3)
         ->has('roles.0', fn (AssertableJson $json) =>
             $json->where('name', 'Admin')->etc()
         )
         ->etc()
);
```

Key methods: `where`, `whereNot`, `whereType`, `missing`, `has`, `first`, `each`, `etc`.

### Authentication in Tests
The `actingAs()` helper authenticates a user for the request:
```php
$user = User::factory()->create();
$response = $this->actingAs($user)->get('/dashboard');
```

Guard-specific authentication:
```php
$admin = User::factory()->admin()->create();
$this->actingAs($admin, 'admin')->get('/admin')->assertOk();
```

### Mocking Dependencies in Controller Tests
Controller constructor and method-injected dependencies can be replaced with mocks:

```php
$this->mock(PostService::class, function (MockInterface $mock) {
    $mock->shouldReceive('listAll')
         ->once()
         ->andReturn(collect([...]));
});

$response = $this->actingAs($user)->getJson('/api/posts');
```

For finer control, bind mock instances directly:
```php
$this->instance(
    PostService::class,
    Mockery::mock(PostService::class, function (MockInterface $mock) {
        $mock->shouldReceive('create')
             ->once()
             ->andReturn(new Post([...]));
    })
);
```

Spies verify interactions without return values:
```php
$spy = $this->spy(PostService::class);
$response = $this->postJson('/api/posts', $payload);
$spy->shouldHaveReceived('create')->once();
```

---

## Mental Models

### Controller Test as Black Box
A controller test treats the controller as a black box. Input is an HTTP request (method, URL, headers, body, session). Output is an HTTP response (status, headers, content). The internal implementation (which service is called, how data is formatted) is irrelevant — only the HTTP contract matters.

### Feature Test as Integration Test
A feature test is an integration test for the HTTP layer. It verifies that routing, middleware, controllers, form requests, and responses work together correctly. It does NOT verify that business logic is correct — that's what service/action unit tests are for.

### One Request Per Test
Each controller test should make exactly one HTTP request. Multiple requests in a single test produce unclear failure signals — if the second request fails, was the first request correct? The one-request-per-test rule keeps failure messages precise.

---

## Internal Mechanics

### How TestResponse Works
`TestResponse` wraps Symfony's `Response` object with assertion methods. It tracks whether assertions have been called and provides macroable extension methods. Key internal methods:

```php
// TestResponse::assertStatus($code)
// Compares $this->baseResponse->getStatusCode() === $code

// TestResponse::assertSessionHasErrors($keys)
// Checks $this->baseResponse->getSession()->get('errors')

// TestResponse::assertJson($data)
// Decodes $this->getContent(), compares with assertContains
```

### How actingAs Works
`actingAs()` sets the authenticated user on the request via the auth guard:
```php
// From Laravel's TestCase
public function actingAs($user, $guard = null)
{
    $this->be($user, $guard);  // Auth::guard($guard)->setUser($user)
    return $this;
}
```

The user is set directly on the guard's `UserProvider` — no login session is needed. The guard returns this user for the duration of the test request.

### How withoutMiddleware Works
`withoutMiddleware()` sets a flag on the test case that bypasses middleware resolution:
```php
// From Laravel's TestCase
public function withoutMiddleware($middleware = null)
{
    // If null: bypass all middleware
    // If array: bypass specific middleware classes
    $this->app->instance(
        'middleware.disable',
        true  // or specific class list
    );
}
```

When `middleware.disable` is true, the `Kernel::pipeThrough()` method returns the request unprocessed. This is useful for testing controller logic without authentication overhead, but should be used sparingly — bypassing middleware means not testing the middleware that protects the route.

### How mock() Works
`$this->mock()` registers a Mockery mock in the container using `shouldReceive`:
```php
// From Laravel's TestCase
public function mock($abstract, \Closure $mockDefinition = null)
{
    $mock = Mockery::mock($abstract);

    if ($mockDefinition) {
        $mockDefinition($mock);
    }

    $this->app->instance($abstract, $mock);

    return $mock;
}
```

The `instance()` binding replaces the container's resolved instance. Any subsequent resolution of `$abstract` returns the mock. This works for both constructor injection and method injection because both resolve through the container.

---

## Patterns

### Basic Resource Controller Test Suite

```php
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_displays_posts()
    {
        Post::factory()->count(3)->create();
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/posts');

        $response->assertOk();
        $response->assertViewHas('posts');
    }

    public function test_store_creates_post()
    {
        $user = User::factory()->create();
        $postData = Post::factory()->raw();

        $response = $this->actingAs($user)->post('/posts', $postData);

        $response->assertRedirect('/posts/' . Post::first()->id);
        $this->assertDatabaseHas('posts', ['title' => $postData['title']]);
    }

    public function test_store_validates_required_fields()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', []);

        $response->assertSessionHasErrors(['title', 'body']);
        $this->assertDatabaseCount('posts', 0);
    }

    public function test_update_modifies_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $response = $this->actingAs($user)->put("/posts/{$post->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertRedirect("/posts/{$post->id}");
        $this->assertEquals('Updated Title', $post->fresh()->title);
    }

    public function test_destroy_deletes_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $response = $this->actingAs($user)->delete("/posts/{$post->id}");

        $response->assertRedirect('/posts');
        $this->assertModelMissing($post);
    }
}
```

### Authorization Test Pattern

```php
public function test_guest_cannot_access_posts()
{
    $this->get('/posts')->assertRedirect('/login');
}

public function test_guest_cannot_create_post()
{
    $this->post('/posts', ['title' => 'Test'])->assertRedirect('/login');
}

public function test_user_cannot_update_others_post()
{
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($otherUser)->create();

    $response = $this->actingAs($user)
        ->put("/posts/{$post->id}", ['title' => 'Hacked']);

    $response->assertForbidden();
}

public function test_owner_can_update_post()
{
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->put("/posts/{$post->id}", ['title' => 'Updated']);

    $response->assertOk();
}
```

### API JSON Response Test Pattern

```php
public function test_show_returns_post_resource()
{
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->getJson("/api/posts/{$post->id}");

    $response->assertOk();
    $response->assertJsonStructure([
        'data' => ['id', 'title', 'body', 'created_at', 'author'],
    ]);
    $response->assertJsonPath('data.id', $post->id);
    $response->assertJsonPath('data.title', $post->title);
}

public function test_index_returns_paginated_list()
{
    Post::factory()->count(15)->create();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/posts');

    $response->assertOk();
    $response->assertJsonCount(15, 'data');
    $response->assertJsonStructure([
        'data' => [['id', 'title']],
        'meta' => ['current_page', 'last_page', 'total'],
        'links' => ['first', 'last', 'prev', 'next'],
    ]);
}
```

### Mocking Services in Controller Tests

```php
class PublishPostControllerTest extends TestCase
{
    public function test_publish_delegates_to_action()
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $this->mock(PublishPostAction::class, function (MockInterface $mock) use ($post) {
            $mock->shouldReceive('execute')
                 ->once()
                 ->with(Mockery::on(fn($p) => $p->is($post)));
        });

        $response = $this->actingAs($user)->patch("/posts/{$post->id}/publish");

        $response->assertRedirect('/posts');
        $response->assertSessionHas('status');
    }
}
```

### Validation Error Test with Datasets (Pest)

```php
dataset('invalid_post_payloads', [
    'missing title'  => [['body' => 'Content'],          ['title']],
    'missing body'   => [['title' => 'Title'],           ['body']],
    'empty title'    => [['title' => '', 'body' => 'X'], ['title']],
    'title too long' => [['title' => str_repeat('a', 256), 'body' => 'X'], ['title']],
]);

it('rejects invalid input on store', function (array $payload, array $errors) {
    actingAs(User::factory()->create())
        ->postJson('/api/posts', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errors);
})->with('invalid_post_payloads');
```

### Testing Middleware Behavior

```php
public function test_throttle_limits_api_requests()
{
    $user = User::factory()->create();

    // Make 60 requests (the default throttle limit)
    for ($i = 0; $i < 60; $i++) {
        $this->actingAs($user)->getJson('/api/posts');
    }

    // The 61st request should be rate-limited
    $response = $this->actingAs($user)->getJson('/api/posts');
    $response->assertStatus(429);
}
```

With the `JMac\Testing\Traits\AdditionalAssertions` package:
```php
$this->assertActionUsesMiddleware(
    PostController::class,
    'store',
    ['auth', 'verified']
);
```

### Testing Single-Action Controllers

```php
class PublishPostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_publishes_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->unpublished()->create();

        $response = $this->actingAs($user)
            ->patch("/posts/{$post->id}/publish");

        $response->assertRedirect('/posts');
        $this->assertTrue($post->fresh()->isPublished());
    }

    public function test_unauthenticated_user_cannot_publish()
    {
        $post = Post::factory()->create();

        $this->patch("/posts/{$post->id}/publish")
             ->assertRedirect('/login');
    }
}
```

---

## Architectural Decisions

### Why Feature Tests Over Unit Tests for Controllers
Controllers are the HTTP integration point — they compose validation, authorization, business logic, and response rendering. Testing a controller in isolation (bypassing routing, middleware, and form requests) defeats the purpose of testing the controller. The integration bugs that controllers introduce happen at the boundaries between these layers, which only feature tests catch.

### Why DatabaseTransactions Over RefreshDatabase
`RefreshDatabase` drops and re-migrates the database for every test — slow for large schemas. `DatabaseTransactions` wraps each test in a database transaction that rolls back after the test — ~50x faster for most test suites. Use `RefreshDatabase` only when migration changes are being tested.

```php
// Faster alternative to RefreshDatabase
use Illuminate\Foundation\Testing\DatabaseTransactions;

class PostControllerTest extends TestCase
{
    use DatabaseTransactions;
}
```

### Why One Request Per Test
Multiple requests in a single test share application state (database, session, authenticated user). State leaks between requests produce false positives or hard-to-debug failures. A test making two POST requests checks if the second succeeds, but does not clearly indicate whether the first was necessary for the second to work.

### Why Mock at Service Boundaries, Not Controller Boundaries
Mocking a controller method (via `partialMock`) is testing implementation, not behavior. Mocking a service that makes external API calls tests the controller's integration with that boundary. The rule: mock at the system boundary (external APIs, SDKs), not at the internal layer boundary (services that contain your business logic).

---

## Tradeoffs

### Feature Test vs Unit Test for Controllers

| Aspect | Feature Test | Unit Test |
|--------|-------------|-----------|
| What it tests | Full HTTP stack: route, middleware, controller, response | Controller method in isolation |
| Integration bugs | Catches routing, middleware, validation boundary bugs | Misses integration issues entirely |
| Speed | ~10–200ms per test | ~1–10ms per test |
| Refactoring resilience | Survives internal refactoring (rename service? test still passes) | Breaks on internal refactoring |
| Complexity | No mocking needed for internal services | Requires mocking all dependencies |

### Real Database vs In-Memory SQLite

| Database | Benefit | Cost |
|----------|---------|------|
| SQLite in-memory | Fast, no external dependency | Feature differences from production DB (no full-text, different JSON support) |
| MySQL/PostgreSQL (real) | Production parity | Slower, requires database server |
| Compromise: Use SQLite for CI, test against production DB locally before deployment |

### Full Mock vs Real Service

| Approach | Benefit | Cost |
|----------|---------|------|
| Real service with real DB | Tests actual behavior, catches real bugs | Slower, requires database state setup |
| Mocked service | Fast, isolates controller testing | May miss integration bugs (query errors, unexpected parameters) |
| Compromise: Mock external services (APIs, SDKs), use real internal services (your Actions/Services) with DB |

---

## Performance Considerations

### Test Suite Execution Time
Each feature test simulates a full HTTP request: boot application, resolve middleware, dispatch route, run controller, render response. Typical time: 10–50ms for a simple test; 50–200ms for tests with database operations. A test suite of 500 controller tests takes 5–100 seconds.

### DatabaseTransactions Performance
`DatabaseTransactions` wraps each test in a transaction. The transaction overhead is ~1–5ms per test vs no transaction. `RefreshDatabase` migration cost is ~100–500ms per test suite but also runs for each test class (depending on configuration).

### Parallel Testing
Laravel's `paratest` support splits tests across multiple processes. Controller tests are trivially parallelizable when using `RefreshDatabase` (each process has its own database). `DatabaseTransactions` does not support parallelism because transactions are per-process.

```bash
php artisan test --parallel
```

---

## Production Considerations

### CI Pipeline Integration
Controller tests should be the primary test layer in CI. A typical CI pipeline:
1. Lint and static analysis (seconds)
2. Unit tests for services/actions (seconds)
3. Feature tests for controllers (minutes)
4. Browser tests for critical user flows (minutes, separate stage)

### Coverage Targets
Community consensus for controller test coverage:
- Every route must have at least one success test (assertOk)
- Every route with authentication must have an unauthorized test (assertRedirect/login, assertUnauthorized, assertForbidden)
- Every route with validation must have an invalid input test (assertSessionHasErrors, assertJsonValidationErrors)
- Every route with authorization must test both authorized and unauthorized roles
- Error routes (404, 500) should have at least one test each

### Testing External Dependencies
When controllers interact with external services (payment gateways, email APIs, cloud services), use `Http::fake()` or `Queue::fake()` to prevent real calls:

```php
use Illuminate\Support\Facades\Http;

public function test_store_charges_payment()
{
    Http::fake([
        'api.stripe.com/*' => Http::response(['id' => 'ch_123'], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/orders', ['amount' => 5000]);

    $response->assertCreated();
}
```

Prevent stray HTTP requests in tests:
```php
public function setUp(): void
{
    parent::setUp();
    Http::preventStrayRequests();
}
```

### Testing Soft-Deleted Resource Access

```php
public function test_show_returns_post_even_when_soft_deleted()
{
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();
    $post->delete();

    $response = $this->actingAs($user)
        ->getJson("/api/posts/{$post->id}");

    $response->assertNotFound(); // Default: soft-deleted models not found
}

public function test_show_with_trashed_returns_soft_deleted()
{
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();
    $post->delete();

    $response = $this->actingAs($user)
        ->getJson("/api/posts/{$post->id}?with_trashed=1");

    $response->assertOk(); // Only if controller implements withTrashed handling
}
```

---

## Common Mistakes

### Testing Implementation, Not Behavior
Why it happens: Asserting that a specific method was called with specific parameters. Why it's harmful: Tests break when internals are refactored even if the HTTP contract is unchanged. Better approach: Assert against the response, not against method calls.

### Over-Mocking
Why it happens: Mocking every service to avoid database setup. Why it's harmful: Mocked tests hide broken integration. A service interface change that adds a required parameter passes mocked tests but fails in production. Better approach: Use real services with real data for most tests. Mock only at system boundaries (external APIs, SDKs).

### Shared State Across Tests
Why it happens: Tests in the same class share setup via `setUp`. Why it's harmful: A test that modifies shared state (e.g., creating a record in one test, asserting its existence in another) creates hidden dependencies between tests. Tests should be independent. Better approach: Use `RefreshDatabase` or `DatabaseTransactions` and create fresh data per test.

### Testing Too Many Layers in One Test
Why it happens: A single test that creates a user, creates a post, makes a request, and asserts multiple response attributes. Why it's harmful: When the test fails, the failure signal is unclear — was it the setup, the request, or the assertion? Better approach: Use datasets for data-driven tests or split into focused test methods.

### Forgetting Unauthorized Cases
Why it happens: Testing only the "happy path" where the user is authenticated. Why it's harmful: The most expensive production bugs come from authorization failures. Better approach: Every authenticated route needs at least two tests: authenticated success and unauthenticated rejection.

### Using RefreshDatabase When DatabaseTransactions Suffices
Why it happens: Copying from documentation examples that use RefreshDatabase. Why it's harmful: RefreshDatabase adds ~100–500ms per test class for migrations. A suite of 50 test classes spends 5–25 seconds just on migrations. Better approach: Use DatabaseTransactions by default and RefreshDatabase only for migration tests.

### Fragile View Assertions
Why it happens: Asserting exact HTML strings with `assertSee`. Why it's harmful: UI text changes break the test even when the controller logic is correct. Better approach: Assert against view data with `assertViewHas` rather than rendered HTML. Use `assertSee` only for critical user-visible text.

---

## Failure Modes

### Flaky Tests Due to Factories
Tests that use `factory()->create()` without specifying unique field values can fail due to database uniqueness constraints. Factory sequences or explicit overrides prevent this:
```php
Post::factory()->create(['title' => 'Test Post ' . uniqid()]);
```

### In-Memory SQLite Differences
SQLite does not support MySQL/PostgreSQL-specific features. Tests that pass on SQLite may fail on production:
- `JSON_EXTRACT` vs `->` operator syntax
- Full-text search functions
- `GROUP BY` strict mode differences
- Check constraints (SQLite parses but does not enforce them)

### Time-Dependent Tests
Tests that assert against timestamps or dates can fail around midnight or on DST boundaries. Use `Carbon::setTestNow()` to freeze time:
```php
public function test_shows_created_date()
{
    Carbon::setTestNow('2026-06-01 12:00:00');
    
    $post = Post::factory()->create();
    $response = $this->actingAs($user)->getJson("/api/posts/{$post->id}");
    
    $response->assertJsonPath('data.created_at', '2026-06-01T12:00:00.000000Z');
}
```

### Unresolved Container Bindings
When mocking a service that is not bound in the container, the test resolves a real instance instead. Always verify that mocked services are actually resolved by the controller. Use `$this->expectNotToPerformAssertions()` or explicit mock expectations to catch unresolved mocks.

---

## Ecosystem Usage

### Spatie Testing Guidelines
Spatie's internal guidelines recommend feature tests for all HTTP endpoints with structured assertion patterns. Their packages use `TestResponse` assertions extensively. Spatie's `pest-plugin-route-testing` provides batch route testing for GET endpoints.

### Laravel Jetstream Tests
Jetstream's test suite uses feature tests for all team management controllers. Tests verify authentication, authorization, and database side effects. Jetstream tests demonstrate the "one test per controller action" pattern with clear authorization boundaries.

### Tighten Testing Patterns
Tighten's blog recommends the "pest-driven development" approach with datasets for validation testing. Their patterns emphasize testing controller behavior (response structure, status codes) over controller implementation (method calls, internal logic).

### Community Standard
The dominant community testing framework (2025–2026) is Pest for new projects and PHPUnit for established projects. Most teams maintain a mix of both. The feature-test-heavy approach (80% feature, 20% unit) is the consensus recommendation for Laravel controller testing.

---

## Related Knowledge Units

### Prerequisites
- Controller Architecture — How controllers are dispatched and what they do
- Route Definition — How routes map to controller methods
- Form Requests — Testing validation through controllers

### Related Topics
- Resource Controllers — Testing all 7 resource methods
- Single-Action Controllers — Testing `__invoke()` methods
- Dependency Injection — Mocking controller dependencies
- Thin Controller Principles — Testing delegation from controllers to services

### Advanced Follow-up Topics
- API Resources — Testing JSON response structure
- Controller Middleware — Testing middleware behavior on controllers
- Service Layer Pattern — Unit testing extracted business logic separately from controller tests

---

## Research Notes

### Source Analysis
- `Illuminate\Testing\TestResponse.php` — All assertion methods
- `Illuminate\Foundation\Testing\Concerns\MakesHttpRequests.php` — HTTP test helpers
- `Illuminate\Foundation\Testing\Concerns\InteractsWithAuthentication.php` — actingAs
- `Illuminate\Foundation\Testing\Concerns\MocksApplicationServices.php` — mock/instance helpers

### Key Insight
Controller tests are NOT about testing the controller. They are about testing the HTTP contract: given a request, does the application return the correct response? The controller is one layer in the stack, and testing it in isolation misses the integration bugs that make controllers the most failure-prone layer.

### Key Controversy
The balance of feature tests vs unit tests is the most debated testing topic in the community. The 80/20 split (feature/unit) is the consensus, but specific project needs vary. API-heavy projects with complex business logic may benefit from more unit tests. Simple CRUD applications with thin controllers may require mostly feature tests.

### Version-Specific Notes
- `TestResponse` fluent JSON assertions: Laravel 8+
- `assertJsonValidationErrors`: Laravel 8+
- `assertValid`: Laravel 9+
- `withoutMiddleware` with specific middleware classes: Laravel 8+
- `assertNoContent`: Laravel 9+
- `actingAsGuest`: Laravel 11+
- TestResponse macros: Laravel 6+
- Parallel testing (`paratest`): Add via Composer, documented in Laravel 9+
