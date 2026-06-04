# Form Request Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Form Request Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Form Requests are tested primarily through HTTP integration tests that simulate full request cycles — submitting data, asserting validation errors, and verifying successful passes. Unit-testing FormRequests in isolation is not idiomatic Laravel, as the FormRequest's operation depends on the container, router, and request lifecycle. Integration tests that exercise the full controller + request + validation pipeline provide the most reliable coverage.

---

## Core Concepts

### Integration Testing (Preferred)

Send an HTTP request to the route that uses the FormRequest:

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

The FormRequest auto-validates as part of the route dispatch. Errors appear in session (web) or JSON response (API).

### Testing Validation Passes

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

### Testing Authorization Failures

```php
public function test_unauthenticated_user_cannot_store_user()
{
    $response = $this->post('/users', [
        'name' => 'John',
        'email' => 'john@example.com',
    ]);

    $response->assertStatus(403); // AuthorizationException → 403
}
```

---

## Mental Models

### The Request as a Black Box

A FormRequest is tested by what goes in (request data + auth state) and what comes out (errors, response status, redirect). Internal methods like `rules()` and `authorize()` are implementation details — test the observable behavior.

### The Validation Boundary

The test validates the boundary: "Can bad data reach the controller?" If the test sends invalid data and receives validation errors, the boundary is working. If invalid data produces a 200, the boundary is broken.

---

## Internal Mechanics

### How Validation Errors Surface in Tests

When `ValidationException` is thrown, Laravel's exception handler converts it:

- **Web requests** (no `Accept: application/json`): Redirect back + flash errors to session
- **API requests** (with `Accept: application/json`): JSON response with 422 status

In tests:

```php
// Web — errors are in session
$response->assertSessionHasErrors(['email']);
$response->assertSessionHasErrors('email', 'The email field is required.');

// API — errors are in JSON
$response->assertJsonValidationErrors(['email']);
$response->assertJsonValidationErrorFor('email');
$response->assertInvalid(['email']);  // Laravel 11+ shorthand
```

### Testing Specific Error Messages

```php
$response->assertSessionHasErrors([
    'email' => 'The email must be a valid email address.',
]);
```

For JSON:

```php
$response->assertJson([
    'message' => 'The given data was invalid.',
    'errors' => [
        'email' => ['The email must be a valid email address.'],
    ],
]);
```

---

## Patterns

### Pest Datasets for Rule Conditions

Test each rule condition with a data provider:

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
    'valid plus' => ['john+tag@example.com', true],
]);
```

### FormRequest Isolation via resolve()

For testing the request class in semi-isolation:

```php
public function test_rules_contain_required_fields()
{
    $request = new StoreUserRequest();
    $rules = $request->rules();

    $this->assertArrayHasKey('email', $rules);
    $this->assertArrayHasKey('password', $rules);
    $this->assertContains('required', $rules['email']);
}
```

This tests only the rule structure, not the validation behavior. Useful for verifying that `rules()` returns the expected array shape.

### Testing Custom Validation Rules

Invokable rules can be tested directly:

```php
class ValidPostalCodeTest extends TestCase
{
    public function test_passes_for_valid_zip()
    {
        $rule = new ValidPostalCode();
        $rule->validate('zip', '90210', function ($message) {
            $this->fail('Should not fail');
        });
        $this->assertTrue(true);
    }

    public function test_fails_for_invalid_zip()
    {
        $rule = new ValidPostalCode();
        $failed = false;
        $rule->validate('zip', 'not-a-zip', function ($message) use (&$failed) {
            $failed = true;
            $this->assertStringContainsString('ZIP', $message);
        });
        $this->assertTrue($failed);
    }
}
```

### Testing withValidator Hook Behavior

```php
public function test_cross_field_validation_fails_when_dates_overlap()
{
    $response = $this->post('/bookings', [
        'start_date' => '2025-01-10',
        'end_date' => '2025-01-05', // before start
    ]);

    $response->assertSessionHasErrors(['end_date']);
}
```

The `withValidator()` logic is tested indirectly through the full request cycle.

---

## Architectural Decisions

### Integration vs Unit for FormRequests

| Test Type | Tests | Confidence | Fragility |
|-----------|-------|-----------|-----------|
| Integration (HTTP) | Full pipeline: middleware → request → rules → errors | High | Low — requires route setup |
| Structure (rules array) | Rule definitions exist | Low | Low — breaks only on rule changes |
| Isolation (resolve + validate) | FormRequest with mocked container | Medium | High — container mocking is brittle |

Prefer integration tests. They validate the complete validation boundary including authorization, rule parsing, and error formatting.

### Extracting Rule Tests to Custom Rule Classes

When a FormRequest has complex custom rules, extract the rule to an invokable class and unit-test it directly. Keep the FormRequest's integration test focused on the orchestration (which rules apply, not how each rule works).

---

## Tradeoffs

### Integration Tests vs Unit Tests for Form Request Coverage

Integration tests validate the full request lifecycle — routing, authorization, validation rules, and error formatting — giving the highest confidence that the FormRequest works correctly. The tradeoff is speed: integration tests are 10-100x slower than unit tests and require database setup, route definitions, and authentication state. A balanced strategy uses integration tests for critical validation paths and structure tests (inspecting the `rules()` array shape) for routine coverage.

### Test Speed vs Test Fidelity

Pest datasets enable testing many rule variations with a single test method. The tradeoff is that dataset-driven tests produce generic failure messages ("Failed asserting that false is true") that are harder to debug than individual test methods with descriptive names. For complex validation logic, individual tests with descriptive names provide better failure diagnostics despite the additional boilerplate.

---

## Performance Considerations

### Full Stack Test Overhead

FormRequest tests typically run as full HTTP integration tests through Laravel's `$this->post()`, which bootstraps the framework, resolves middleware, and executes the routing stack. Each test takes 50-200ms depending on application complexity. For FormRequest suites with 50+ test cases, parallel test execution (via Pest parallel or PHPUnit parallel) is recommended to keep CI pipeline times manageable.

### Database Transactions for Isolation

Using `DatabaseTransactions` trait rather than `RefreshDatabase` reduces per-test setup time by avoiding schema re-migration. FormRequest tests that validate `Rule::unique()` or `Rule::exists()` need database state but don't need a fresh schema — transactions roll back mutations after each test, providing isolation without the migration overhead.

---

## Production Considerations

### Test Coverage for Conditional Logic

FormRequest tests must cover all conditional branches in `rules()`, `authorize()`, and `withValidator()`. In production, an untested conditional branch can silently allow invalid data through or reject valid submissions. Use Pest dataset providers to systematically test each condition without writing repetitive test methods.

### Error Message Verification

Asserting on specific error messages in tests protects against accidental message changes that could break API contracts. Use `assertSessionHasErrors(['email' => 'The email must be a valid address.'])` to pin error message content. When messages are localized, test at least the default locale and one secondary locale to verify translation coverage.

---

## Common Mistakes

### Using assertSessionHasErrors Without Route

```php
// WRONG — FormRequest not resolved, no validation triggered
public function test_rules()
{
    $request = new StoreUserRequest();
    $request->setContainer(app());
    $request->validateResolved(); // Fails — no route context
}
```

Resolving a FormRequest manually outside a route context misses the request lifecycle. Always test through a route.

### Forgetting csrf_token for Web Routes

```php
// WRONG — token mismatch before validation
$this->post('/users', ['name' => 'John']);

// CORRECT — include CSRF token or use withoutMiddleware
$this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);
$this->post('/users', ['name' => 'John']);
```

### Ignoring Authorization in Tests

```php
// Tests pass because there's no authenticated user
// But authorize() might return false when auth is missing
$this->post('/admin/users', ['name' => 'John']);
```

Always test with the appropriate authentication state:

```php
public function test_admin_only_action()
{
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->post('/admin/users', ['name' => 'John']);
    $response->assertSessionHasNoErrors();
}
```

---

## Failure Modes

### Stale Route Definitions

A FormRequest works because the route dispatches to a controller method that type-hints it. If the route changes or the method signature changes, the FormRequest is never resolved, and validation never runs. Integration tests catch this — the request passes without errors even with invalid data.

### Environment-Dependent Rules

Rules like `Rule::unique()` depend on database state. Tests that share a database may produce false failures:

```php
public function test_email_uniqueness()
{
    User::factory()->create(['email' => 'existing@example.com']);
    $response = $this->post('/users', ['email' => 'existing@example.com']);
    $response->assertSessionHasErrors('email'); // Passes only in isolation
}
```

Use `RefreshDatabase` or `DatabaseTransactions` to ensure clean state per test.

---

## Ecosystem Usage

### Laravel Nova

Nova's test suite uses full HTTP integration tests for its FormRequest validation, following the same pattern of sending HTTP requests and asserting on validation errors. Nova's Dusk tests also verify that validation errors render correctly in the Nova UI, covering both the backend validation and the frontend error display.

### Laravel Jetstream

Jetstream provides both PHPUnit feature tests and Pest tests for its authentication and team management FormRequests. The Jetstream test suite demonstrates the pattern of testing authorization failures (403 assertions) separately from validation failures (422/redirect assertions), keeping each test focused on a single concern.

### Laravel Spark

Spark's test suite uses dataset-driven Pest tests to cover billing validation rules across multiple subscription tiers and plan configurations. Each dataset row tests a different combination of plan type, billing interval, and coupon code, ensuring comprehensive coverage without test method proliferation.

---

## Related Knowledge Units

- **Form Request Fundamentals** (this subdomain) — validation pipeline and hooks
- **Custom Validation Rules** (this subdomain) — testing invokable rules
- **Controller Testing** (controllers subdomain) — testing controller + request interaction
- **Service Testing** (service-layer-pattern subdomain) — testing services with pre-validated DTOs

---

## Research Notes

### Testing Precognitive Validation

Laravel Precognition adds complexity to FormRequest testing because the same request behaves differently depending on whether it's a precognitive request. Tests must verify both precognitive and full validation states. Use `$this->withHeaders(['Precognition-Validate-Only' => 'email'])` to simulate precognitive requests in integration tests.

### Future Direction — FormRequest Snapshot Testing

Future testing approaches could use snapshot testing for FormRequests, where the entire validated output is compared against a stored snapshot. This would catch unintended changes to rule definitions without writing explicit assertions for every field.

### Framework Source Reference
- `Illuminate\Foundation\Testing\Concerns\MakesHttpRequests` — HTTP test helpers
- `Illuminate\Foundation\Http\FormRequest::validated()` — validated output
- `Illuminate\Support\Facades\Validator` — manual validation in tests
