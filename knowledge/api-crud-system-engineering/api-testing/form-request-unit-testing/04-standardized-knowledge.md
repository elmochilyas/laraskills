# ECC Standardized Knowledge — Form Request Unit Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Form Request Unit Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Form request unit tests validate the `rules()`, `authorize()`, `messages()`, and `prepareForValidation()` methods of custom form request classes in isolation — without hitting a controller or the HTTP kernel. Instantiate the request with test data, call `rules()` to verify the returned validation rules, call `authorize()` with different user states to test authorization logic, and verify custom error messages. Unit testing form requests provides faster feedback and more deterministic validation than feature-level validation tests, especially for complex conditional validation logic.

## Core Concepts

- **Instantiation**: `$request = new StorePostRequest([...])` — create with input data
- **`rules()`**: Returns validation rules array — test returns correct rules for different inputs
- **`authorize()`**: Returns boolean — test with authenticated/unauthenticated user states
- **`messages()`**: Returns custom error messages — test specific field error messages
- **`prepareForValidation()`**: Transforms input before validation — test input modification
- **`validator()`**: `$request->validator()->fails()` / `->passes()` — execute validation
- **User resolver**: `$request->setUserResolver(fn() => $user)` — mock authenticated user

## When To Use

- Any form request with custom `rules()`, `authorize()`, or `prepareForValidation()` logic
- Complex conditional validation (different rules based on user role, resource type, or input combinations)
- Form requests with custom error messages
- As the primary validation test alongside feature-level validation tests

## When NOT To Use

- Simple form requests with no custom logic (delegating entirely to controller validation)
- Feature-level route wiring verification (use feature validation tests instead)
- Testing controller behavior or service layer integration

## Best Practices

- **Test rules return value**: `$request = new StorePostRequest(); assertIsArray($request->rules())`.
- **Test dynamic rules**: Use `@dataProvider` with different input combinations to assert different rule sets.
- **Test authorize with different users**: `$request->setUserResolver(fn() => $adminUser); assertTrue($request->authorize())`.
- **Test validation persistence**: Assert `$request->validator()->passes()` with valid data, `->fails()` with invalid.
- **Test error messages**: `$request->validator()->errors()->get('title')` returns custom error messages.
- **Test prepareForValidation**: Create request with raw input, call `prepareForValidation()`, assert transformed input.

## Architecture Guidelines

- Unit testing form requests prioritizes test speed and isolation over feature-level coverage.
- Many teams adopt both: unit tests for rule correctness and feature tests for route-level wiring.
- The container and redirector must be set up before calling `$request->validator()`.

## Performance Considerations

- Form request unit tests are among the fastest — <5ms even with 50 rules.
- Run in pre-CI stage to fail fast on validation rule errors.
- Use PestPHP datasets to exhaustively cover all conditional rule combinations without performance impact.

## Security Considerations

- Test `authorize()` with all relevant user roles/permissions — gaps in authorization logic can expose endpoints.
- Ensure validation rules don't leak internal information in error messages.
- Test that `prepareForValidation()` doesn't override security-critical fields (e.g., `is_admin`).

## Common Mistakes

- Not calling `$request->setContainer(app())` before `$request->validator()` — validator factory unavailable.
- Not setting up the user resolver when testing `authorize()` — `$request->user()` returns null.
- Forgetting `prepareForValidation()` is called automatically by the framework but must be called manually in unit tests.
- Testing rules exhaustively at the unit level but skipping feature-level verification — route-to-form-request wiring untested.

## Anti-Patterns

- **Feature-test-only validation**: Skipping unit tests entirely — every validation rule change requires a full HTTP round trip to verify.
- **Duplicate coverage**: Testing the exact same validation scenarios at unit level and feature level — choose unit tests for rule correctness, feature tests for wiring.
- **Testing framework validation logic**: Asserting that `required` rule works — trust Laravel's validator; test your custom rules only.

## Examples

```php
it('requires title for store', function () {
    $request = new StorePostRequest([], ['title' => '']);
    $request->setContainer(app());
    $request->setRedirector(redirect());

    expect($request->validator()->fails())->toBeTrue();
    expect($request->validator()->errors()->get('title'))->toContain('The title field is required.');
});

it('allows admin to create', function () {
    $request = new StorePostRequest();
    $request->setUserResolver(fn() => User::factory()->admin()->make());

    expect($request->authorize())->toBeTrue();
});

it('transforms slug in prepareForValidation', function () {
    $request = new StorePostRequest([], ['title' => 'Hello World']);
    $request->prepareForValidation();

    expect($request->input('slug'))->toBe('hello-world');
});
```

## Related Topics

- **Prerequisites**: Laravel Form Requests, feature-test-structure, PHPUnit Mocking
- **Siblings**: validation-failure-testing, layer-isolation-in-tests, dto-unit-testing
- **Advanced**: Dynamic form request rule generation, Form request inheritance and composition, Automating form request tests from OpenAPI specs

## AI Agent Notes

- Form request unit tests are the only way to test `prepareForValidation()` transformations and complex conditional rule logic without HTTP overhead.
- Laravel 11's FormRequest uses the same base class — patterns haven't changed since Laravel 5.5.
- Always pair unit tests with at least one feature-level validation test per form request to verify routing.

## Verification

- [ ] Every form request with custom `rules()` has a unit test for rule correctness
- [ ] `authorize()` is tested with both authorized and unauthorized user states
- [ ] `prepareForValidation()` transformations are tested explicitly
- [ ] Custom error messages are verified
- [ ] At least one feature-level test verifies the form request is wired to the correct route
