# ECC Anti-Patterns — Controller Testing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Testing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Mocking Services in Controller Tests
2. Over-Asserting Response Details
3. Testing Business Logic Through Controllers
4. Testing Without Authentication Context
5. Not Testing Validation Errors

---

## Repository-Wide Anti-Patterns

- One Giant Test Method Testing Multiple Behaviors
- No `RefreshDatabase` or `DatabaseTransactions` Trait
- Only Happy-Path Tests (No Authorization or Validation Error Tests)
- Testing Framework Internals
- Using `assertExactJson()` for Dynamic Data

---

## Anti-Pattern 1: Mocking Services in Controller Tests

### Category
Testing | Maintainability

### Description
Using `$this->mock()`, `Mockery`, or partial mocks to replace service dependencies when testing a controller.

### Why It Happens
Developers want to isolate the controller from its dependencies, treating controller tests like unit tests. They believe mocking makes tests faster and more focused.

### Warning Signs
- `$this->mock(UserService::class)` or `Mockery::mock()` in controller test
- `shouldReceive()->once()` expectations on service methods
- Tests pass but the real service code path is never exercised
- Refactoring dependency injection (constructor → method) breaks mock-based tests

### Preferred Alternative
Use real service implementations with factory-created test data. Controller tests are feature tests — they should exercise the full HTTP-to-service path.

### Related Rules
- Rule: Do Not Mock Services in Controller Tests
- Rule: Test One Behavior Per Test Method

---

## Anti-Pattern 2: Over-Asserting Response Details

### Category
Testing | Maintainability

### Description
Asserting every detail of the response — exact JSON structure, full HTML content, specific timestamps — making tests brittle and prone to false failures.

### Why It Happens
Developers want "complete" verification and write assertions for everything visible in the response at the time of writing.

### Warning Signs
- `assertExactJson()` with full response body including timestamps
- Asserting exact HTML string content with `assertSee()` on full pages
- Tests fail when a new field is added to a JSON response
- Tests fail when a timestamp format changes slightly
- Tests require updating for every frontend template change

### Preferred Alternative
Assert structure and key data only. Use `assertJsonStructure()` for JSON contracts. Use `assertViewHas()` for view data. Assert status codes and response type.

### Related Rules
- Rule: Avoid Over-Asserting Response Details

---

## Anti-Pattern 3: Testing Business Logic Through Controllers

### Category
Testing | Architecture

### Description
Asserting business logic results (tax calculations, service call counts, complex computed values) in controller feature tests instead of service-level unit tests.

### Why It Happens
Developers skip creating service unit tests and put all assertions in the controller test because it is the most accessible test entry point.

### Warning Signs
- Asserting calculated values like `$order->tax`, `$order->total` in controller tests
- Asserting that a specific service method was called (`$service->shouldHaveReceived('create')`)
- Complex business rule verification in feature tests
- Service unit tests are missing or empty — all coverage is in feature tests

### Preferred Alternative
Write service unit tests for business logic assertions. Controller tests should only verify HTTP behavior: status codes, redirects, response structure, validation errors.

### Related Rules
- Rule: Do Not Assert Business Logic in Controller Tests
- Rule: Test One Behavior Per Test Method

---

## Anti-Pattern 4: Testing Without Authentication Context

### Category
Testing | Reliability

### Description
Calling HTTP test helpers on authenticated routes without calling `$this->actingAs($user)` first, causing tests to fail with misleading 302 redirects.

### Why It Happens
Developers forget that the route requires authentication. They write the test assuming the route is public or that the default test user is authenticated.

### Warning Signs
- Test expects `assertOk()` but receives `assertRedirect()` with 302 to `/login`
- Test fails intermittently depending on test execution order
- Developer adds `actingAs()` only after the test fails, indicating it was forgotten
- Multiple tests fail with the same "expected 200, got 302" error

### Preferred Alternative
Always call `$this->actingAs($user)` for authenticated routes. Test guest access separately by omitting `actingAs()` and asserting the redirect.

### Related Rules
- Rule: Use actingAs() for Authenticated Routes
- Rule: Test Three Authorization Scenarios Per Protected Action

---

## Anti-Pattern 5: Not Testing Validation Errors

### Category
Testing | Security

### Description
Only testing the "happy path" of store and update actions without testing validation rule failures.

### Why It Happens
Validation seems like "framework behavior" that doesn't need testing. Developers assume that if the FormRequest rules are written, they must work.

### Warning Signs
- Store test sends valid data and asserts redirect — no invalid data tests
- Update test sends valid data and asserts response — no invalid data tests
- A validation rule change does not break any test
- Missing required fields or invalid format data do not produce test failures

### Preferred Alternative
Write a test for every validation rule in each store and update FormRequest. Submit invalid data and assert `assertSessionHasErrors(['field'])`.

### Related Rules
- Rule: Test Validation Errors for Every Store and Update Action
