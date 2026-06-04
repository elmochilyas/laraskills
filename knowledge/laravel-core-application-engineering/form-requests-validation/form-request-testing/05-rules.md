# Form Request Testing — Engineering Rules

---

## Rule 1: Test FormRequests via HTTP Integration Tests — Not Unit Tests

---

## Category

Testing

---

## Rule

Test FormRequests by sending HTTP requests to routes that use them and asserting on the response. Do not unit-test FormRequest methods (`rules()`, `authorize()`, `messages()`) in isolation.

---

## Reason

FormRequests integrate deeply with the container, router, and request lifecycle. Unit-testing them requires extensive mocking that is fragile and does not validate the actual request pipeline. Integration tests exercise the full stack — route, middleware, validation, authorization, and controller — with a single HTTP call.

---

## Bad Example

```php
// Unit-testing FormRequest internals — fragile, incomplete
public function test_rules_contains_email()
{
    $request = new StoreUserRequest();
    $rules = $request->rules();
    $this->assertArrayHasKey('email', $rules);
}
```

---

## Good Example

```php
// Integration test — exercises the full pipeline
public function test_store_user_validates_email()
{
    $response = $this->post('/users', ['email' => 'invalid']);
    $response->assertSessionHasErrors(['email']);
}
```

---

## Exceptions

Custom validation rules (invokable classes) should be unit-tested in isolation. The FormRequest that uses them should be integration-tested.

---

## Consequences Of Violation

Testing fragility: tests break when FormRequest internals change. Incomplete coverage: unit tests miss pipeline behavior (authorization order, error formatting).

---

## Rule 2: Test Authorization Failure Separately from Validation

---

## Category

Testing

---

## Rule

Write dedicated test cases that verify unauthorized users receive a 403 response, independent of the input data provided. Test authorization and validation as separate concerns.

---

## Reason

Authorization failures must occur before validation — unauthorized users should never receive validation errors (which could leak information about valid input). Testing them together hides whether the 403 came from authorization or a coincidental validation issue.

---

## Bad Example

```php
// Tests auth but with no assertion on the input quality
public function test_unauthorized_user_cannot_update_post()
{
    $user = User::factory()->create();
    $post = Post::factory()->create(['user_id' => 999]);

    $response = $this->actingAs($user)->put("/posts/{$post->id}", [
        'title' => 'Valid Title', // 200? Or did auth pass or fail?
    ]);

    // If this passes, was it auth denying or validation?
    $response->assertStatus(403);
}
```

---

## Good Example

```php
public function test_unauthorized_user_gets_403_regardless_of_input()
{
    $user = User::factory()->create();
    $post = Post::factory()->create(['user_id' => 999]);

    // Even with perfectly valid data, auth should deny
    $response = $this->actingAs($user)->put("/posts/{$post->id}", [
        'title' => 'A completely valid title here',
    ]);

    $response->assertStatus(403);
}
```

---

## Exceptions

When the authorization check depends on input data (which is valid), the input must be valid to test authorization logic correctly.

---

## Consequences Of Violation

Testing gaps: auth bypass may be masked by coincidental validation errors. Security risks: authorization logic never properly verified.

---

## Rule 3: Assert on Field-Specific Errors — Not Generic Checks

---

## Category

Testing

---

## Rule

Assert validation errors on specific field names using `assertSessionHasErrors(['field'])` (web) or `assertJsonValidationErrors(['field'])` (API). Do not use generic `assertSessionHasErrors()` without field arguments.

---

## Reason

A generic assertion may pass even when the wrong field has the error, or when an unexpected field fails. Field-specific assertions ensure the exact expected field produced the error, making tests precise and preventing regression where errors move to wrong fields.

---

## Bad Example

```php
public function test_email_is_required()
{
    $response = $this->post('/users', ['name' => 'John']);

    // Passes even if name has the error instead of email
    $response->assertSessionHasErrors();
}
```

---

## Good Example

```php
public function test_email_is_required()
{
    $response = $this->post('/users', ['name' => 'John']);

    $response->assertSessionHasErrors(['email']); // Precisely asserts email failed
}
```

---

## Exceptions

When testing that a submission has NO errors (success case), `assertSessionHasNoErrors()` is the correct assertion.

---

## Consequences Of Violation

Testing gaps: tests pass when wrong field has errors. Maintenance risks: error regressions go undetected.

---

## Rule 4: Use Pest Datasets for Combinatorial Rule Testing

---

## Category

Testing

---

## Rule

Use Pest's `with()` dataset feature to test multiple inputs for the same validation rule in a single test case. Cover valid, invalid, boundary, and edge values.

---

## Reason

A validation rule typically has multiple failure modes. Separate test cases for each input cause massive test file bloat and discourage thorough coverage. Datasets make it trivial to cover all meaningful inputs (null, empty, valid, boundary, special characters) in a single, readable test.

---

## Bad Example

```php
public function test_email_rejects_invalid(): void { /* ... */ }
public function test_email_rejects_empty(): void { /* ... */ }
public function test_email_rejects_null(): void { /* ... */ }
public function test_email_accepts_valid(): void { /* ... */ }
```

---

## Good Example

```php
it('validates the email field', function ($email, $shouldPass) {
    $response = $this->post('/users', ['email' => $email, 'name' => 'John', 'password' => 'secret123!']);
    $shouldPass
        ? $response->assertSessionHasNoErrors('email')
        : $response->assertSessionHasErrors('email');
})->with([
    'valid email' => ['john@example.com', true],
    'missing @' => ['notanemail', false],
    'empty string' => ['', false],
    'null' => [null, false],
    'very long' => [str_repeat('a', 255) . '@b.com', false],
]);
```

---

## Exceptions

When the validation behavior depends on complex state (database records, authenticated user), use dedicated test methods for each scenario.

---

## Consequences Of Violation

Testing gaps: edge cases not covered due to boilerplate fatigue. Maintenance burden: dozens of near-identical test methods.

---

## Rule 5: Test Boundary Conditions — Not Just Happy Paths

---

## Category

Testing

---

## Rule

Include test cases for boundary conditions: empty strings, null values, maximum lengths, special characters, and type mismatches for every rule that defines constraints.

---

## Reason

Boundary conditions are where most validation bugs surface in production. Testing only valid data creates a false sense of security — the validation boundary is only proven when edge cases are verified to be properly rejected.

---

## Bad Example

```php
public function test_store_user_succeeds()
{
    $response = $this->post('/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
    $response->assertSessionHasNoErrors(); // Only happy path
}
```

---

## Good Example

```php
it('validates the name field', function ($name, $shouldPass) {
    $response = $this->post('/users', [
        'name' => $name,
        'email' => 'john@example.com',
    ]);
    $shouldPass
        ? $response->assertSessionHasNoErrors('name')
        : $response->assertSessionHasErrors('name');
})->with([
    'valid name' => ['John Doe', true],
    'empty string' => ['', false],
    'null' => [null, false],
    'single char' => ['a', true],
    'max length' => [str_repeat('a', 255), true],
    'exceeds max' => [str_repeat('a', 256), false],
    'special chars' => ['John-Doe O\'Brien', true],
]);
```

---

## Exceptions

For built-in Laravel rules (`required`, `string`, `email`), testing the behavior of the framework itself is not required — test your rule combinations, not the framework.

---

## Consequences Of Violation

Reliability risks: boundary bugs reach production. Debugging difficulty: first signal of failure is a production error, not a test.

---

## Rule 6: Use assertInvalid() for Cross-Context Assertions (Laravel 11+)

---

## Category

Testing

---

## Rule

Use `assertInvalid(['field'])` (Laravel 11+) for validation error assertions that must work in both web and API contexts. Reserve context-specific assertions when testing response format details.

---

## Reason

`assertInvalid()` works regardless of whether the request was a web form (session errors) or API JSON (422 errors). It provides a single assertion that adapts to the request context, reducing duplication in tests that must support both formats.

---

## Bad Example

```php
public function test_validation(): void
{
    // Separate tests for web and API — duplicated logic
    $webResponse = $this->post('/users', ['email' => 'bad']);
    $webResponse->assertSessionHasErrors(['email']);

    $apiResponse = $this->postJson('/api/users', ['email' => 'bad']);
    $apiResponse->assertJsonValidationErrors(['email']);
}
```

---

## Good Example

```php
public function test_validation(): void
{
    $response = $this->post('/users', ['email' => 'bad']);
    $response->assertInvalid(['email']);
    // Works for both web and API contexts in Laravel 11+
}
```

---

## Exceptions

Use `assertJsonValidationErrors()` when testing the exact JSON error structure. Use `assertSessionHasErrors()` when testing session flash behavior specifically.

---

## Consequences Of Violation

Testing overhead: duplicated test cases for web and API paths. Maintenance burden: both paths must be updated for rule changes.
