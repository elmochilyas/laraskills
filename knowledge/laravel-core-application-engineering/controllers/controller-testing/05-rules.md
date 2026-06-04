# ECC Behavioral Rules — Controller Testing

---

## Rule: Test Every Controller Action

---

## Category

Testing

---

## Rule

Write at least one feature test for every public controller action. Every `index`, `store`, `show`, `update`, and `destroy` method must have a corresponding test that verifies the HTTP response.

---

## Reason

Controller actions are the contract between the HTTP layer and consumers. Untested actions can silently break status codes, redirect targets, or response structure, causing production incidents that unit tests on services cannot catch.

---

## Bad Example

```php
class PostControllerTest extends TestCase
{
    public function test_store_creates_post()
    {
        // store is tested
    }
    // index, show, update, destroy have NO tests
}
```

---

## Good Example

```php
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_posts() { /* ... */ }
    public function test_authenticated_users_can_list_posts() { /* ... */ }
    public function test_store_creates_post_and_redirects() { /* ... */ }
    public function test_store_validates_required_fields() { /* ... */ }
    public function test_show_displays_post() { /* ... */ }
    public function test_update_modifies_post_and_redirects() { /* ... */ }
    public function test_destroy_removes_post_and_redirects() { /* ... */ }
}
```

---

## Exceptions

Controllers that only call `Route::redirect()` or `Route::view()` do not need dedicated tests. Prototype-only controllers not yet deployed may skip tests temporarily.

---

## Consequences Of Violation

Reliability risks: untested actions break silently. Maintenance risks: refactoring controllers requires manual verification of every action.

---

## Rule: Test Three Authorization Scenarios Per Protected Action

---

## Category

Testing

---

## Rule

For every controller action that requires authorization, test three scenarios: unauthenticated (guest), authenticated but unauthorized (wrong role/permission), and authenticated and authorized (happy path).

---

## Reason

Each authorization scenario can fail independently. Guests should be redirected to login, unauthorized users should receive 403, and authorized users should receive the expected response. Testing only the happy path misses permission escalation and access control bugs.

---

## Bad Example

```php
public function test_destroy_removes_post()
{
    $this->actingAs(User::factory()->create())
        ->delete('/posts/1')
        ->assertRedirect('/posts');
    // No test for guest access or unauthorized user access
}
```

---

## Good Example

```php
public function test_guests_cannot_destroy_posts()
{
    $post = Post::factory()->create();
    $this->delete("/posts/{$post->id}")->assertRedirect('/login');
}

public function test_non_admin_users_cannot_destroy_posts()
{
    $post = Post::factory()->create();
    $this->actingAs(User::factory()->create())
        ->delete("/posts/{$post->id}")
        ->assertForbidden();
}

public function test_admin_can_destroy_posts()
{
    $post = Post::factory()->create();
    $this->actingAs(User::factory()->admin()->create())
        ->delete("/posts/{$post->id}")
        ->assertRedirect('/posts');
}
```

---

## Exceptions

Public actions (index, show) that require no authorization only need the happy-path test. Actions that are truly public-only require no authorization test scenarios.

---

## Consequences Of Violation

Security risks: authorization gaps go undetected until production. Testing risks: permission escalation vulnerabilities pass CI.

---

## Rule: Test Validation Errors for Every Store and Update Action

---

## Category

Testing

---

## Rule

Write a test for each validation rule in every `store` and `update` FormRequest. Submit invalid data and assert `->assertSessionHasErrors(['field'])` or `->assertInvalid(['field'])`.

---

## Bad Example

```php
public function test_store_creates_post()
{
    $this->actingAs(User::factory()->create())
        ->post('/posts', ['title' => 'Valid Title', 'body' => 'Valid Body'])
        ->assertRedirect('/posts');
    // No validation error tests — missing fields go unvalidated
}
```

---

## Good Example

```php
public function test_store_requires_title()
{
    $this->actingAs(User::factory()->create())
        ->post('/posts', ['body' => 'Valid Body'])
        ->assertSessionHasErrors(['title']);
}

public function test_store_requires_body()
{
    $this->actingAs(User::factory()->create())
        ->post('/posts', ['title' => 'Valid Title'])
        ->assertSessionHasErrors(['body']);
}

public function test_store_title_must_be_unique()
{
    Post::factory()->create(['title' => 'Taken Title']);
    $this->actingAs(User::factory()->create())
        ->post('/posts', ['title' => 'Taken Title', 'body' => 'Body'])
        ->assertSessionHasErrors(['title']);
}
```

---

## Exceptions

Index and show actions that accept only optional query-string filters may omit validation error tests. When a FormRequest's validation rules are tested in a dedicated FormRequest test, the controller test only needs one representative validation-error test.

---

## Consequences Of Violation

Security risks: invalid or malicious input bypasses validation. Reliability risks: unvalidated fields cause database constraint violations in production.

---

## Rule: Do Not Mock Services in Controller Tests

---

## Category

Testing

---

## Rule

Never use `$this->mock()`, `Mockery`, or partial mocks to replace service dependencies when testing a controller. Use real service implementations with factory-created test data.

---

## Reason

Mocking services couples the test to the controller's injection implementation. A change from constructor injection to method injection breaks the mock. Real implementations test the full interaction between HTTP layer and business logic, catching wiring errors that mocks hide.

---

## Bad Example

```php
public function test_store_creates_post()
{
    $this->mock(UserService::class, function ($mock) {
        $mock->shouldReceive('create')->once()->andReturn(true);
    });

    $this->actingAs(User::factory()->create())
        ->post('/users', [...])
        ->assertRedirect('/users');
}
```

---

## Good Example

```php
public function test_store_creates_user_and_redirects()
{
    $this->actingAs(User::factory()->create())
        ->post('/users', [
            'name' => 'John',
            'email' => 'john@example.com',
        ])
        ->assertRedirect('/users');

    $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
}
```

---

## Exceptions

External API calls (payment gateways, SMS providers, third-party APIs) should be faked using Laravel's HTTP fake (`Http::fake()`) rather than making real network calls. This is faking, not mocking — the controller still exercises real code paths.

---

## Consequences Of Violation

Testing risks: mocks create false confidence — the test passes but the real code path may be broken. Maintenance risks: refactoring dependency injection breaks mock-based tests.

---

## Rule: Test One Behavior Per Test Method

---

## Category

Testing

---

## Rule

Each test method must verify exactly one behavior — one assertion category (status, redirect, validation error, response structure). Do not combine multiple assertions that test different concerns in a single method.

---

## Reason

When a test with multiple assertions fails, the developer must debug which assertion failed and why. Single-behavior tests pinpoint exactly which behavior broke, reducing debugging time.

---

## Bad Example

```php
public function test_store()
{
    $response = $this->actingAs(User::factory()->create())
        ->post('/posts', ['title' => 'T', 'body' => 'B']);

    $response->assertRedirect('/posts');
    $this->assertDatabaseHas('posts', ['title' => 'T']);
    $response->assertSessionHas('success');
    $this->assertCount(1, Post::all());
}
```

---

## Good Example

```php
public function test_store_creates_post_in_database()
{
    $this->actingAs(User::factory()->create())
        ->post('/posts', ['title' => 'Test', 'body' => 'Content']);

    $this->assertDatabaseHas('posts', ['title' => 'Test']);
}

public function test_store_redirects_to_index()
{
    $this->actingAs(User::factory()->create())
        ->post('/posts', ['title' => 'Test', 'body' => 'Content'])
        ->assertRedirect('/posts');
}
```

---

## Exceptions

Sequential assertions that verify the same concern (e.g., `assertOk()` and `assertJsonStructure(...)` on the same response) are acceptable because they all verify the response structure.

---

## Consequences Of Violation

Testing risks: failures are ambiguous, requiring manual debugging. Maintenance risks: refactoring one behavior breaks a test that covers multiple concerns.

---

## Rule: Use RefreshDatabase or DatabaseTransactions for Isolation

---

## Category

Testing

---

## Rule

Apply the `RefreshDatabase` or `DatabaseTransactions` trait to every controller test class that interacts with the database. Do not rely on manual cleanup between tests.

---

## Reason

Tests that leak database state cause false positives (records from a previous test affect the next test's assertions) and false negatives (assertions fail because of leftover data). Automatic isolation guarantees deterministic test runs.

---

## Bad Example

```php
class PostControllerTest extends TestCase
{
    public function test_store_creates_post()
    {
        Post::factory()->create(['title' => 'Existing']);
        // Test depends on this exact database state
    }

    public function test_index_lists_posts()
    {
        // If test_store ran first, this test sees extra records
    }
}
```

---

## Good Example

```php
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_post()
    {
        $this->actingAs(User::factory()->create())
            ->post('/posts', ['title' => 'New Post'])
            ->assertRedirect('/posts');

        $this->assertDatabaseCount('posts', 1);
    }

    public function test_index_lists_posts()
    {
        Post::factory()->count(3)->create();

        $this->actingAs(User::factory()->create())
            ->get('/posts')
            ->assertOk();
    }
}
```

---

## Exceptions

Tests that do not interact with the database at all may omit the trait. `DatabaseTransactions` may replace `RefreshDatabase` for faster test runs when the schema is stable.

---

## Consequences Of Violation

Testing risks: flaky tests that pass or fail depending on execution order. Reliability risks: CI pipelines produce inconsistent results.

---

## Rule: Use actingAs() for Authenticated Routes

---

## Category

Testing

---

## Rule

Always call `$this->actingAs($user)` before sending HTTP requests to authenticated routes. Do not assume a route is accessible without authentication context.

---

## Reason

Forgotten authentication context causes tests to receive 302 redirects to the login page instead of the expected response. The test then fails not because the behavior is wrong, but because the test setup is incomplete.

---

## Bad Example

```php
public function test_can_list_posts()
{
    $this->get('/admin/posts')
        ->assertOk();
    // Fails with 302 — route requires auth
}
```

---

## Good Example

```php
public function test_admin_can_list_posts()
{
    $user = User::factory()->admin()->create();

    $this->actingAs($user)
        ->get('/admin/posts')
        ->assertOk();
}

public function test_guests_are_redirected_to_login()
{
    $this->get('/admin/posts')
        ->assertRedirect('/login');
}
```

---

## Exceptions

Tests that explicitly verify redirect-to-login behavior for guests should NOT use `actingAs()`.

---

## Consequences Of Violation

Testing risks: tests fail with misleading errors (expected 200, got 302). Developer productivity: debugging authentication setup wastes development time.

---

## Rule: Do Not Assert Business Logic in Controller Tests

---

## Category

Testing

---

## Rule

Do not assert that specific services were called, specific queries ran, or complex business results matched specific calculations in controller tests. Leave those assertions to service-level unit tests.

---

## Reason

Controller tests verify HTTP behavior, not business logic correctness. Asserting business logic in controller tests duplicates the service test, slows down the test suite (controller tests boot the framework), and breaks when business logic is refactored without changing HTTP behavior.

---

## Bad Example

```php
public function test_order_store_calculates_tax_correctly()
{
    $this->actingAs(User::factory()->create())
        ->post('/orders', ['amount' => 100])
        ->assertRedirect('/orders');

    $order = Order::first();
    $this->assertEquals(10.0, $order->tax); // Business logic assertion
    $this->assertEquals(110.0, $order->total); // Business logic assertion
}
```

---

## Good Example

```php
// Controller test — only HTTP behavior
public function test_store_creates_order_and_redirects()
{
    $this->actingAs(User::factory()->create())
        ->post('/orders', ['amount' => 100])
        ->assertRedirect('/orders');
}

// Service test — business logic
public function test_order_service_calculates_tax()
{
    $service = new OrderService();
    $order = $service->createOrder(100);
    $this->assertEquals(10.0, $order->tax);
    $this->assertEquals(110.0, $order->total);
}
```

---

## Exceptions

Asserting `assertDatabaseHas()` to confirm a record was created is acceptable — it verifies the controller correctly delegated the create operation, not the business logic of the created record.

---

## Consequences Of Violation

Performance risks: slow test suite from framework boot for every test. Maintenance risks: refactoring business logic requires updating controller tests. Testing risks: service tests and controller tests overlap without clear ownership.

---

## Rule: Avoid Over-Asserting Response Details

---

## Category

Testing

---

## Rule

Assert the structure and key data of a response, not the exact content or formatting. For JSON, use `assertJsonStructure()` over `assertExactJson()`. For views, assert the view name and key data variables, not the rendered HTML.

---

## Reason

Over-asserting response details makes tests brittle — any frontend change, formatting tweak, or field addition breaks the test. Structural assertions verify the contract without coupling to presentation details.

---

## Bad Example

```php
$this->actingAs(User::factory()->create())
    ->getJson('/api/users/1')
    ->assertExactJson([
        'id' => 1,
        'name' => 'John',
        'email' => 'john@example.com',
        'created_at' => '2026-01-01T00:00:00Z',
    ]);
```

---

## Good Example

```php
$this->actingAs(User::factory()->create())
    ->getJson('/api/users/1')
    ->assertOk()
    ->assertJsonStructure([
        'data' => ['id', 'name', 'email'],
    ]);
```

---

## Exceptions

When testing a search endpoint, asserting a specific expected count or result order is acceptable. When testing idempotent operations, asserting the exact unchanged state is acceptable.

---

## Consequences Of Violation

Maintenance risks: minor frontend changes break tests. Developer productivity: false failures from formatting differences waste debugging time.
