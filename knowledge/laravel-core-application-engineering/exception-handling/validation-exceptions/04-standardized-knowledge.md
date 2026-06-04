# Validation Error Formatting

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Validation Error Formatting
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

## Overview

Validation exceptions in Laravel are thrown when form request validation or manual validation fails. `ValidationException` carries the validation errors, the request input, and the error bag. Laravel's handler automatically redirects back with errors flashed to the session (HTML) or returns JSON with 422 status (API).

The engineering value is standardized validation error handling across all controllers. You don't write error-handling code in each controller — the framework intercepts the exception and produces the correct response for the request type.

## Core Concepts

- **ValidationException Structure:** Carries the Validator instance, optional custom response, error bag name, and 422 status. Methods: `errors()`, `errorBag()`, `getValidator()`.
- **Default Response Behavior:** HTML → redirect back with flashed errors and input. JSON/API → 422 JSON response with errors object. AJAX → 422 JSON. Inertia → redirect back, Inertia converts to errors prop.
- **Error Bag:** Named bag for errors (default: `'default'`). Multiple forms on the same page use different error bags to avoid interference.
- **How ValidationExceptions Are Thrown:** FormRequest (automatic on validation failure), `Validator::validate()`, `$request->validate()`, or manual `throw new ValidationException($validator)`.

## When To Use

- All form validation — ValidationException is the standard Laravel mechanism
- API validation — returns structured 422 JSON with field-level errors
- Custom validation responses via `failedValidation()` override on FormRequest
- Named error bags for pages with multiple independent forms

## When NOT To Use

- Do NOT catch `ValidationException` in controllers — let the framework handle it
- Do NOT replace ValidationException with custom exceptions for standard validation — use the built-in mechanism
- Do NOT use ValidationException for non-validation errors (business rule violations) — use custom exceptions

## Best Practices (WHY)

- **Why use FormRequest over manual validation:** Auto-injected into controllers, reusable, focused on validation, independently testable. The framework handles the exception automatically.
- **Why use named error bags:** Multiple forms on one page need separate error states. Named bags prevent the login form's errors from appearing on the registration form.
- **Why not catch ValidationException in controllers:** The framework handles it correctly — redirect for HTML, JSON for API. Catching it yourself risks inconsistent handling.
- **Why validate on the server:** Client-side validation is user experience, not security. Server validation is the definitive check. Never trust client-side validation alone.

## Architecture Guidelines

- Use FormRequest classes for complex validation (not inline in controllers)
- Use named error bags when a page has multiple independent forms
- Customize `failedValidation()` on FormRequest for custom error responses
- Log validation failures at INFO level (not ERROR) — they're expected behavior
- Test validation failure paths in every form submission test
- For API responses, format validation errors consistently (field → messages)

## Performance

Validation exception handling is on the hot path (every form submission that fails). The exception adds ~0.5ms for redirect/response generation — negligible compared to the validation rules themselves.

## Security

- Server-side validation is the definitive security boundary — never trust client-side validation
- ValidationException prevents invalid data from reaching the application layer
- Ensure CSRF tokens are included in AJAX requests — missing CSRF produces 419, not 422

## Common Mistakes

1. **Not Using Form Requests for Complex Validation:** Validation logic inline in controllers makes controllers bloated and violates single responsibility. Extract to FormRequest.

2. **Forgetting to Check Validation in Tests:** Every form submission test should test both the success path and the validation failure path. Use `assertSessionHasErrors()` for HTML, `assertJsonValidationErrors()` for JSON.

3. **Catching ValidationException Incorrectly:** `catch (ValidationException $e) { return response()->json($e->errors(), 422); }` prevents the framework from handling the redirect. Let the framework handle it.

4. **Validation Rules That Never Fail:** A buggy validation rule that always passes allows invalid data through. Write tests that verify rules reject invalid data.

## Anti-Patterns

- **The Inline Validation Controller:** A controller method with 50 lines of inline `$request->validate()` calls instead of a FormRequest. Bloated, untestable, non-reusable.
- **The Caught-and-Rethrown:** Catching `ValidationException` only to re-throw it or return the same response. The framework already handles it correctly — don't intercept.
- **The Missing Validation Test:** No test for validation failure paths. Invalid data may pass through unchecked, causing downstream errors.

## Examples

### ValidationException Structure
```php
namespace Illuminate\Validation;

class ValidationException extends Exception
{
    public $validator;      // The Validator instance
    public $response;       // Optional custom response
    public $errorBag;       // The error bag name (default: 'default')
    public $status = 422;   // HTTP status code

    public function errors(): array;
    public function errorBag(): string;
    public function getValidator(): Validator;
}
```

### Custom Validation Response via failedValidation()
```php
class StoreUserRequest extends FormRequest
{
    protected function failedValidation(Validator $validator)
    {
        throw (new ValidationException($validator))
            ->errorBag('create_user')
            ->redirectTo(route('users.create'));
    }
}

// With custom error format for API
protected function failedValidation(Validator $validator)
{
    $response = response()->json([
        'message' => 'Validation failed',
        'errors' => $validator->errors()->toArray(),
        'code' => 'VALIDATION_ERROR',
    ], 422);

    throw new ValidationException($validator, $response);
}
```

### Error Bag for Multiple Forms
```php
class LoginRequest extends FormRequest
{
    protected $errorBag = 'login';
}

class RegisterRequest extends FormRequest
{
    protected $errorBag = 'registration';
}
```

### Testing Validation Failures
```php
// HTML form
$response->assertSessionHasErrors(['email']);

// API
$response->assertStatus(422);
$response->assertJsonValidationErrors(['email']);
```

## Related Topics

- **Exception Handler Configuration** — where validation exceptions fit
- **HTTP Exception Rendering** — other HTTP exceptions (404, 403)
- **JSON Error Formatting** — API validation error responses
- **Form Requests & Validation** — how validation rules are defined

## AI Agent Notes

- Use FormRequest classes for HTTP form validation (not inline validation)
- Handle API validation error formatting in the exception handler
- Do NOT catch `ValidationException` in controllers — let the framework handle it
- Log validation failures at INFO level, not ERROR
- Use named error bags for pages with multiple forms
- Test validation failure paths: `assertSessionHasErrors()` / `assertJsonValidationErrors()`

## Verification

- [ ] FormRequest classes are used for complex validation (not inline)
- [ ] Validation failure paths are tested for every form/endpoint
- [ ] `failedValidation()` is customized when custom error format is needed
- [ ] Named error bags are used for pages with multiple forms
- [ ] Validation failures are logged at INFO level
- [ ] API validation errors return structured field-level errors in JSON
- [ ] CSRF tokens are included in AJAX requests for non-API routes
