# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Form Request Testing |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Form Requests are tested primarily through HTTP integration tests that simulate full request cycles — submitting data, asserting validation errors, and verifying successful passes. Unit-testing FormRequests in isolation is not idiomatic Laravel, as the FormRequest's operation depends on the container, router, and request lifecycle. Integration tests that exercise the full controller + request + validation pipeline provide the most reliable coverage.

---

## Core Concepts

- **Integration testing preferred**: Send HTTP request to route using the FormRequest — tests the full pipeline
- **Validation error assertions**: `assertSessionHasErrors()` (web), `assertJsonValidationErrors()` (API)
- **Authorization failure testing**: Assert 403 status when unauthorized user submits request
- **Passing validation assertions**: `assertSessionHasNoErrors()` and verify expected redirect/response
- **Black-box testing**: Test what goes in (data + auth) and what comes out (errors, status code) — not internal methods

---

## When To Use

- Every FormRequest should have tests covering:
  - Valid data passes
  - Each rule violation produces correct error
  - Authorization failure for unauthorized users
  - Boundary cases (empty strings, nulls, max lengths, special characters)

## When NOT To Use

- Unit-testing FormRequest in isolation (unnecessary due to integration with container/router)
- Testing built-in Laravel rules (test your custom rules, not `required` or `email` behavior)
- Testing rules that you haven't explicitly defined in the request

---

## Best Practices

- **Test the validation boundary** — "Can bad data reach the controller?" If invalid data produces 200, the boundary is broken
- **Use Pest datasets** for combinatorial rule testing — one test case per rule condition
- **Test authorization separately** from validation — test that unauthorized user gets 403 regardless of input
- **Assert on field-specific errors** — `assertSessionHasErrors(['email'])` rather than generic error checks
- **Test JSON and web responses** differently — `assertJsonValidationErrors()` for API, `assertSessionHasErrors()` for web
- **Use Laravel 11+ `assertInvalid()` shorthand** for cleaner test assertions

---

## Architecture Guidelines

- Web requests (no `Accept: application/json`): Redirect back + flash errors to session
- API requests (with `Accept: application/json`): JSON response with 422 status and `errors` object
- `assertSessionHasErrors(['email'])` checks the session error bag for specific field errors
- `assertInvalid(['email'])` (Laravel 11+) works for both web and API contexts
- Authorization: `$response->assertStatus(403)` for `AuthorizationException`
- Use `$this->actingAs($user)` to set authenticated user for authorization tests

---

## Performance

Integration tests for FormRequests are fast enough for CI pipelines. A typical validation test completes in 50-200ms. Use RefreshDatabase or DatabaseTransactions for isolation. Batch similar test cases with Pest datasets to reduce boilerplate.

---

## Security

FormRequest tests are critical for security validation. They ensure:
- Unauthorized users are rejected before validation runs
- Malformed input is properly rejected
- SQL injection and XSS vectors are blocked by rules
- Business rule violations produce appropriate errors

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Testing Laravel's built-in rules | Testing `required` behavior | Redundant tests | Test only your custom rules |
| Unit-testing FormRequest in isolation | Testing framework familiarity | Fragile tests, container mocking required | Use integration tests |
| Forgetting authorization tests | Testing only validation | Auth bypass goes undetected | Always test auth failure + success |
| Asserting on generic messages | Asserting `assertSessionHasErrors()` without field | Miss if wrong field has error | Assert on specific field: `assertSessionHasErrors(['email'])` |
| Not testing boundary conditions | Only testing valid data | Edge cases fail in production | Test nulls, empty strings, max lengths |

---

## Anti-Patterns

- **Testing private/protected methods**: Testing `rules()`, `authorize()`, `messages()` directly instead of through HTTP
- **One test for all rules**: A single test case trying to verify all rules at once
- **Testing framework internals**: Asserting on the Validator object instead of the response
- **Skipping authorization tests**: Assuming `authorize()` works without verification

---

## Examples

**Integration test for validation:**
```php
public function test_store_user_validates_email()
{
    $response = $this->post('/users', [
        'name' => 'John',
        'email' => 'not-an-email',
    ]);

    $response->assertSessionHasErrors(['email']);
}
```

**Testing validation passes:**
```php
public function test_store_user_creates_with_valid_data()
{
    $response = $this->post('/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123!',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/users');
}
```

**Testing authorization failure:**
```php
public function test_unauthenticated_user_cannot_store_user()
{
    $response = $this->post('/users', ['name' => 'John', 'email' => 'john@example.com']);

    $response->assertStatus(403);
}
```

**Pest dataset for combinatorial testing:**
```php
it('validates the email field', function ($email, $shouldPass) {
    $response = $this->post('/users', [
        'name' => 'John',
        'email' => $email,
        'password' => 'secret123!',
    ]);

    $shouldPass
        ? $response->assertSessionHasNoErrors('email')
        : $response->assertSessionHasErrors('email');
})->with([
    'valid email' => ['john@example.com', true],
    'missing @' => ['notanemail', false],
    'empty string' => ['', false],
    'null' => [null, false],
]);
```

**API JSON validation error testing:**
```php
public function test_api_returns_validation_errors()
{
    $response = $this->postJson('/api/users', ['email' => 'invalid']);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['email']);
}
```

---

## Related Topics

- form-request-fundamentals — Core FormRequest architecture
- authorization-in-requests — Testing authorization in requests
- custom-validation-rules — Testing custom rules
- validation-rule-patterns — Rule syntax understanding for test coverage

---

## AI Agent Notes

- FormRequest tests are integration tests — they exercise the full route + controller + request pipeline
- Validation errors surface as redirect (web) or JSON (API) through Laravel's exception handler
- `assertInvalid(['email'])` works in both web and API contexts since Laravel 11
- Use Pest `with()` datasets for testing multiple rule conditions with minimal boilerplate
- `$this->actingAs($user)` sets the authenticated user for authorization tests

---

## Verification

- [ ] Integration tests for each FormRequest
- [ ] Tests cover valid data passing validation
- [ ] Tests cover each rule violation
- [ ] Tests cover authorization failure (403)
- [ ] Boundary conditions tested (nulls, empty, max length)
- [ ] API and web response formats tested separately
- [ ] Task datasets used for combinatorial rule testing
- [ ] No unit-testing of FormRequest in isolation
