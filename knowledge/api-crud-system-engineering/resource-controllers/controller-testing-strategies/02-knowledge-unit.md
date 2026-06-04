# Controller Testing Strategies

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Testing Strategies
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Testing resource controllers requires a strategy that covers the full HTTP lifecycle: request construction, validation, authorization, controller execution, and response inspection. Laravel's HTTP test helpers—`get()`, `post()`, `put()`, `delete()`, `patch()`—provide a fluent interface for asserting status codes, JSON structure, database changes, and redirect targets.

A comprehensive controller test strategy includes: status code assertions for every action, JSON structure validation via `assertJsonStructure()`, database assertions (`assertDatabaseHas`), authorization tests (authenticated vs. unauthenticated), and edge case tests (missing resources, invalid input, unverified users). Well-tested controllers give confidence that the HTTP contract is correctly implemented.

---

## Core Concepts

- **HTTP Test Methods**: `$this->get()`, `$this->post()`, `$this->put()`, `$this->delete()`, `$this->patch()` simulate full HTTP requests.
- **Status Code Assertions**: `assertOk()`, `assertCreated()`, `assertNoContent()`, `assertNotFound()`, `assertForbidden()`, `assertStatus()`.
- **JSON Assertions**: `assertJson()`, `assertJsonStructure()`, `assertJsonFragment()`, `assertJsonCount()`, `assertExactJson()`.
- **Database Assertions**: `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertSoftDeleted()`, `assertModelExists()`.
- **Partial Mocks**: Mocking controller dependencies for unit-level controller tests without database setup.
- **Form Request Testing**: Testing form request rules and authorization independently from the controller.

---

## Mental Models

- **Controller as Black Box**: The test sends an HTTP request and inspects the HTTP response. What happens inside is irrelevant.
- **Contract Tests**: Each test asserts one clause of the HTTP contract: "POST /photos with valid data returns 201."
- **Coverage Pyramid Base**: HTTP tests cover the controller layer at the top of the testing pyramid; they are slower than unit tests but provide the highest confidence.

---

## Internal Mechanics

Laravel's HTTP tests use `Illuminate\Foundation\Testing\Concerns\MakesHttpRequests`. Each test method creates a `Request` instance, runs it through the full HTTP kernel (including middleware), and returns a `TestResponse` instance.

```php
$response = $this->postJson('/api/photos', ['title' => 'Sunset']);
$response->assertCreated();
$response->assertJsonStructure(['data' => ['id', 'title']]);
```

The `TestResponse` class wraps `Illuminate\Http\Response` and provides assertion methods that throw `PHPUnit\Framework\AssertionFailedError` on failure. Key methods:

- `assertCreated()` — asserts 201 status code
- `assertNoContent()` — asserts 204 status code
- `assertJsonStructure([...])` — validates the JSON structure matches an array of expected keys
- `assertJsonFragment([...])` — asserts the response contains a subset of JSON

Database assertions use `assertDatabaseHas($table, $data)` which runs a `WHERE` query against the database. This requires the test to use the `DatabaseTransactions` trait or `RefreshDatabase` for isolation.

---

## Patterns

- **Full CRUD Test Suite**:
  ```php
  class PhotoControllerTest extends TestCase
  {
      use RefreshDatabase;

      /** @test */
      public function can_list_photos()
      {
          Photo::factory()->count(3)->create();

          $response = $this->getJson('/api/photos');

          $response->assertOk();
          $response->assertJsonCount(3, 'data');
      }

      /** @test */
      public function can_create_a_photo()
      {
          $data = Photo::factory()->raw();

          $response = $this->postJson('/api/photos', $data);

          $response->assertCreated();
          $response->assertJsonStructure(['data' => ['id', 'title']]);
          $this->assertDatabaseHas('photos', ['title' => $data['title']]);
      }

      /** @test */
      public function can_show_a_photo()
      {
          $photo = Photo::factory()->create();

          $response = $this->getJson("/api/photos/{$photo->id}");

          $response->assertOk();
          $response->assertJson(['data' => ['id' => $photo->id]]);
      }

      /** @test */
      public function can_update_a_photo()
      {
          $photo = Photo::factory()->create();

          $response = $this->putJson("/api/photos/{$photo->id}", [
              'title' => 'Updated Title',
          ]);

          $response->assertOk();
          $this->assertDatabaseHas('photos', ['title' => 'Updated Title']);
      }

      /** @test */
      public function can_delete_a_photo()
      {
          $photo = Photo::factory()->create();

          $response = $this->deleteJson("/api/photos/{$photo->id}");

          $response->assertNoContent();
          $this->assertDatabaseMissing('photos', ['id' => $photo->id]);
      }
  }
  ```
- **Authorization Test**:
  ```php
  /** @test */
  public function guests_cannot_create_photos()
  {
      $response = $this->postJson('/api/photos', Photo::factory()->raw());

      $response->assertUnauthorized();
  }
  ```
- **Validation Error Test**:
  ```php
  /** @test */
  public function store_validates_required_fields()
  {
      $response = $this->postJson('/api/photos', []);

      $response->assertStatus(422);
      $response->assertJsonValidationErrors(['title']);
  }
  ```
- **Partial Mock Test (Unit Level)**:
  ```php
  /** @test */
  public function store_delegates_to_action()
  {
      $this->partialMock(CreatePhotoAction::class, function ($mock) {
          $mock->shouldReceive('execute')->once()->andReturn(Photo::factory()->make());
      });

      $response = $this->postJson('/api/photos', Photo::factory()->raw());

      $response->assertCreated();
  }
  ```

---

## Architectural Decisions

- **Why HTTP tests over unit tests for controllers?** HTTP tests exercise the full stack: routing, middleware, validation, controller execution, and response serialization. Unit tests would require mocking most of these layers, reducing confidence.
- **Why not test every validation rule individually?** Test the happy path and the most common failure paths (missing required fields, invalid formats). Full validation rule coverage belongs in the form request unit tests.
- **Why partial mock instead of full mock?** Partial mocks override specific methods while keeping the real implementation for everything else. Full mocks hide integration issues.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full-stack confidence with HTTP tests | Slower execution (database, middleware) | Use `RefreshDatabase` with in-memory SQLite for speed |
| Clear assertion API (`assertCreated`, `assertJson`) | Tests are more verbose than pure unit tests | Acceptable tradeoff for readability |
| Catches middleware and routing issues | Requires database setup for model-dependent tests | Use factories for clean test data |

---

## Performance Considerations

- HTTP tests are 10–50x slower than unit tests due to the full stack execution and database round-trips.
- Use `RefreshDatabase` with `:memory:` SQLite for faster test runs.
- Use `DatabaseTransactions` instead of `RefreshDatabase` when tests do not modify the schema (avoids re-migrating).
- Group controller tests in a `@group controller` annotation for selective execution during development.
- Use parallel testing (`php artisan test --parallel`) in CI for significant speedups.

---

## Production Considerations

- Write at least one HTTP test per controller action (5–7 tests per resource controller).
- Test authorization: unauthenticated, authenticated as non-owner, authenticated as owner.
- Test validation failures: missing required fields, invalid field formats, unique constraint violations.
- Test edge cases: empty collections, deleted resources (404), paginated responses.
- Use factories with `raw()` for request data to avoid hardcoding test values.
- Keep tests independent: each test creates its own data, never depends on other tests.

---

## Common Mistakes

- **Only testing the happy path**: Testing successful create but not validation errors or authorization failures.
  - *Why it happens:* Happy path is easier to write.
  - *Why it's harmful:* Error handling is untested; bugs in validation responses go unnoticed.
  - *Better approach:* Write at least one failure test per action.

- **Using `assertJson` when `assertJsonStructure` is more appropriate**: `assertJson(['data' => ['id' => 1]])` fails if the ID is ever different.
  - *Why it happens:* `assertJson` is the first method developers find.
  - *Why it's harmful:* Brittle tests that break on unrelated data changes.
  - *Better approach:* Use `assertJsonStructure` for structural validation and `assertJsonFragment` for specific values.

- **Not testing database state**: Asserting the response is correct but not verifying the database was affected.
  - *Why it happens:* Focusing on the HTTP response, not the side effects.
  - *Why it's harmful:* A controller could return 201 but not actually persist data.
  - *Better approach:* Always add `assertDatabaseHas` or `assertDatabaseMissing` for mutating actions.

---

## Failure Modes

- **Test pollution from shared state**: One test creates a model that affects another test's `assertJsonCount`. *Detection:* Intermittent test failures depending on execution order. *Mitigation:* Use `RefreshDatabase` or `DatabaseTransactions` trait.

- **Slow test suite discouraging test runs**: 500 HTTP tests taking 5+ minutes. *Detection:* Developers stop running tests locally. *Mitigation:* Use parallel testing; mock external services; use in-memory database.

- **Over-mocking hiding integration bugs**: A test mocks the repository and passes, but the real repository throws an exception. *Detection:* Production error that tests did not catch. *Mitigation:* Use HTTP tests (not unit tests) for controller coverage; limit mocks to external services.

---

## Ecosystem Usage

- **Laravel Breeze (Tests)**: Breeze's test suite covers authentication controllers with HTTP tests, including validation and authorization assertions.
- **Laravel Spark (Tests)**: Spark's subscription controller tests use HTTP tests with Stripe mocking for billing scenarios.
- **Laravel Horizon (Tests)**: Horizon's dashboard controller tests use HTTP tests with partial mocks for queue monitoring data.

---

## Related Knowledge Units

### Prerequisites
- PHPUnit Basics
- Resource Controller Pattern

### Related Topics
- Controller Form Request Integration
- Controller Response Selection

### Advanced Follow-up Topics
- Thin Controller Enforcement
- API Integration Testing

---

## Research Notes

### Source Analysis
- `Illuminate\Foundation\Testing\Concerns\MakesHttpRequests` — HTTP test methods
- `Illuminate\Testing\TestResponse` — assertion methods
- `Illuminate\Foundation\Testing\Concerns\InteractsWithDatabase` — database assertions

### Key Insight
HTTP tests provide the highest confidence for controller correctness because they exercise the full stack. A controller test that only asserts the response status code is better than no test, but database and JSON structure assertions significantly increase test value.

### Version-Specific Notes
- `assertJsonStructure()` and `assertJsonFragment()` added in Laravel 5.5.
- `assertCreated()`, `assertNoContent()`, `assertUnauthorized()` added in Laravel 5.8.
- Laravel 10+ uses native PHPUnit 10 assertions alongside Laravel's custom assertions.
- Laravel 11's streamlined testing configuration keeps the same assertion API.
