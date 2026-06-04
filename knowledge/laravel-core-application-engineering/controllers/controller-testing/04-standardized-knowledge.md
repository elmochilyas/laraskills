# ECC Standardized Knowledge — Controller Testing

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Testing |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Controller testing verifies that the HTTP layer correctly translates requests into business operations and responses. The scope is: correct HTTP method and URI routing, request validation, status codes, response structure, redirect behavior, and session/flash messages. Business logic should NOT be tested through the controller — that belongs in service/action unit tests.

Laravel provides feature test helpers (`$this->get()`, `$this->post()`, etc.) that simulate HTTP requests without requiring a real web server. These tests boot the application framework, run the middleware pipeline, and return a `TestResponse` with assertions for status, headers, content, and redirects.

---

## Core Concepts

### Feature Tests vs Unit Tests
Controller tests are feature tests (boot the framework, send HTTP request, assert response). Service/action tests are unit tests (instantiate class, call method, assert result).

### HTTP Test Helpers
`$this->get($uri)`, `$this->post($uri, $data)`, `$this->put($uri, $data)`, `$this->delete($uri)` — simulate HTTP requests.

### TestResponse Assertions
`->assertStatus(200)`, `->assertOk()`, `->assertCreated()`, `->assertRedirect($uri)`, `->assertViewHas('key')`, `->assertJson($structure)`, `->assertSessionHasErrors($keys)`.

### Request Validation Testing
Test validation rules via `->assertSessionHasErrors(['field'])` or `->assertInvalid(['field'])`.

### Authentication in Tests
`$this->actingAs($user)` — acting as a specific user for authenticated routes.

---

## When To Use

- Every controller action (index, store, show, update, destroy)
- Validation rule verification for each Form Request
- Authorization checks (authenticated vs guest access)
- Response structure verification (JSON structure, view data)
- Redirect and status code verification

---

## When NOT To Use

- Testing business logic (use service/action unit tests)
- Testing query behavior (use model/repository tests)
- Testing response formatting details (use resource tests)
- Testing framework internals (framework is already tested)

---

## Best Practices

### Test One Behavior Per Test
Each test should verify one behavior: "store creates a resource," "store validates required fields," "unauthorized users get 403."

**Why:** Focused tests are easier to debug when they fail. A single failing test pinpoints exactly which behavior broke.

### Use Form Requests in Tests
Test with the Form Request data that would come from a real HTTP request.

**Why:** Form Request validation is part of the controller's behavior. Bypassing it with raw data doesn't test the real request flow.

### Test Authorization Scenarios
Test each action with: unauthenticated user, unauthorized user, authorized user.

**Why:** Authorization is a core controller responsibility. Each scenario validates that the right access control is applied.

### Don't Assert Business Logic in Controller Tests
Don't assert that `UserService::create()` was called or that the database has specific records.

**Why:** Business logic assertions belong in service/action tests. Controller tests should only verify HTTP concerns: status codes, redirects, response structure.

### Use Database Transactions
Use `RefreshDatabase` or `DatabaseTransactions` trait to isolate test data.

**Why:** Tests must not leak state between each other. Isolated test data prevents false positives from leftover records.

---

## Architecture Guidelines

### Test Structure
```php
class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_users()
    {
        $this->get('/users')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_view_users()
    {
        $this->actingAs(User::factory()->create());
        $this->get('/users')->assertOk();
    }

    public function test_store_validates_required_fields()
    {
        $this->actingAs(User::factory()->create());
        $this->post('/users', [])->assertSessionHasErrors(['name', 'email']);
    }

    public function test_store_creates_user_and_redirects()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/users', [
            'name' => 'John',
            'email' => 'john@example.com',
        ]);

        $response->assertRedirect('/users');
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }
}
```

---

## Common Mistakes

### Testing Business Logic Through Controllers
Desc: Asserting that specific services were called or complex business results are correct in controller tests.
Cause: Not writing separate service/action unit tests.
Consequence: Tests are slow (HTTP boot), brittle, and don't test business logic in isolation.
Better: Write feature tests for HTTP behavior, unit tests for business logic.

### Not Testing Validation Errors
Desc: Only testing the "happy path" without testing validation failure.
Cause: Validation seems like framework behavior.
Consequence: Missing form fields or invalid data goes unvalidated in production.
Better: Test validation errors for every Form Request rule.

### Testing Without Authentication Context
Desc: Testing authenticated routes without `$this->actingAs()`.
Cause: Assuming the route is accessible.
Consequence: Tests fail with 302 (redirect to login) instead of testing the actual behavior.
Better: Always set the authentication context for protected routes.

---

## Anti-Patterns

### Mocking Services in Controller Tests
Using `Mockery` or `$this->mock()` to replace service dependencies in controller tests. This couples the test to the controller's dependency injection implementation. Use real service implementations with test data instead.

### Over-Asserting Response
Asserting every detail of the response (full HTML structure, exact JSON keys order). This makes tests brittle — any frontend change breaks tests. Assert relevant structure, not exact content.

---

## Examples

### API Controller Test
```php
class PostApiControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_posts()
    {
        Post::factory()->count(3)->create();

        $response = $this->actingAs(User::factory()->create())
            ->getJson('/api/posts');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'title']]]);
    }

    public function test_store_requires_authentication()
    {
        $this->postJson('/api/posts', ['title' => 'Test'])
            ->assertUnauthorized();
    }
}
```

### Web Controller Test
```php
public function test_edit_returns_view_with_user()
{
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get("/users/{$user->id}/edit")
        ->assertOk()
        ->assertViewIs('users.edit')
        ->assertViewHas('user');
}
```

---

## Related Topics

### Prerequisites
- **Controller Architecture** — What controllers should do
- **Form Requests** — Validation tested via controller tests

### Closely Related
- **Service Testing** — Unit tests for delegated business logic
- **Resource Testing** — Testing response transformation
- **Form Request Testing** — Testing validation rules in isolation

### Cross-Domain
- **Testing & Reliability Engineering** — Feature vs unit test strategies

---

## AI Agent Notes

### Important Decisions
- Controller tests are feature tests (boot framework, send HTTP)
- Business logic tests are unit tests (no framework boot)
- Use `RefreshDatabase` or `DatabaseTransactions` for isolation
- Test authorization scenarios for every protected action

### Important Constraints
- Controller tests are slower than unit tests (framework boot)
- Don't mock services in controller tests
- `$this->actingAs()` sets the authenticated user for the test request
- `->assertSessionHasErrors()` validates Form Request rejection

### Rules Generation Hints
- Require controller tests for all CRUD actions
- Enforce authorization scenario testing (guest, unauthorized, authorized)
- Enforce validation error testing for store/update actions

---

## Verification

This document has been validated against:
- Laravel HTTP testing documentation
- `Illuminate\Foundation\Testing\Concerns\MakesHttpRequests` — test helpers
- `Illuminate\Testing\TestResponse` — assertion methods
