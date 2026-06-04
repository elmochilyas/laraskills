# Validation Exceptions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Validation Exceptions
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Validation exceptions in Laravel are thrown when form request validation or manual validation fails. `ValidationException` carries the validation errors, the request input, and the error bag. Laravel's handler automatically redirects back with errors flashed to the session (HTML) or returns JSON with 422 status (API).

The engineering value is standardized validation error handling across all controllers. You don't write error-handling code in each controller — the framework intercepts the exception and produces the correct response for the request type.

---

## Core Concepts

### ValidationException Structure

```php
namespace Illuminate\Validation;

class ValidationException extends Exception
{
    public $validator;          // The Validator instance
    public $response;          // Optional custom response
    public $errorBag;          // The error bag name (default: 'default')
    public $status = 422;      // HTTP status code

    public function errors(): array;
    public function errorBag(): string;
    public function getValidator(): Validator;
}
```

### How Validation Exceptions Are Thrown

```php
// Form Request — automatic
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'min:8'],
        ];
    }
    // Throws ValidationException automatically on validation failure
}

// Manual validation
$validator = Validator::make($request->all(), [
    'email' => 'required|email',
]);

if ($validator->fails()) {
    throw new ValidationException($validator);
}

// validate() helper — also throws ValidationException
$request->validate([
    'email' => 'required|email',
]);
```

### Default Response Behaviour

| Request Type | Behaviour |
|---|---|
| HTML (normal request) | Redirect back to previous URL, flash errors to session |
| JSON (API, expects JSON) | 422 response with JSON errors object |
| Inertia | Redirect back (standard), Inertia converts to errors prop |
| AJAX (X-Requested-With) | 422 JSON response |

---

## Mental Models

### The Automatic Redirect

Validation failures trigger an automatic redirect back to the form. This is the Laravel convention for HTML forms. The user is returned to the form with their old input and error messages. No manual error handling code needed.

### The Error Bag

Errors are stored in a named bag (default: `'default'`). Multiple forms on the same page can use different error bags (`->errorBag('login')`) so errors from the login form don't interfere with the registration form.

---

## Internal Mechanics

### RedirectResponse Construction

When `ValidationException` is thrown in an HTTP context:

1. Handler detects `ValidationException`
2. Creates a redirect response to `$exception->redirectTo` (or back())
3. Flashes errors to session: `$request->session()->flash('errors', $exception->errors())`
4. Flashes input: `$request->session()->flashInput($request->except($dontFlash))`
5. Redirects with status 302

### JSON Response Construction

If the request expects JSON:

1. Returns `response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422)`
2. `errors` is a key-value object: `{'email': ['The email field is required.']}`
3. Status code is always 422 (Unprocessable Entity)

### Inertia Behaviour

Inertia intercepts the 422 redirect response, reads the flashed errors from the session, and injects them into the page's `errors` prop automatically.

---

## Patterns

### Custom Validation Response

```php
// In FormRequest
protected function failedValidation(Validator $validator)
{
    throw (new ValidationException($validator))
        ->errorBag('create_user')
        ->redirectTo(route('users.create'));
}

// With custom error format
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
    public function attributes(): array
    {
        return ['errorBag' => 'login'];
    }
}

class RegisterRequest extends FormRequest
{
    protected $errorBag = 'registration';
}
```

### Manual Validation with Custom Error Bags

```php
$validator = Validator::make($input, $rules);

if ($validator->fails()) {
    throw (new ValidationException($validator))
        ->errorBag('checkout');
}
```

### API Validation Error Format

```php
// AppServiceProvider or Handler
Validator::extend('api_error_format', function ($attribute, $value, $parameters, $validator) {
    // Not needed — handle in the exception handler
});

// Handler
$this->renderable(function (ValidationException $e, Request $request) {
    if ($request->is('api/*')) {
        return response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $this->transformApiErrors($e->errors()),
        ], 422);
    }
});

protected function transformApiErrors(array $errors): array
{
    return collect($errors)->map(fn ($messages, $field) => [
        'field' => $field,
        'messages' => $messages,
        'code' => Str::of($field)->snake().'_invalid',
    ])->values()->toArray();
}
```

---

## Architectural Decisions

### Form Request vs Manual Validation

| Concern | Form Request | Manual Validation |
|---|---|---|
| Location | Dedicated request class | Controller method |
| Reusability | Auto-injected in any controller | Must manually call |
| Single responsibility | Focused on validation | Mixed with other logic |
| Testing | Test request class independently | Test within controller test |
| Complexity | One class per form | Inline code |

### Error Bag Strategy

| Approach | When |
|---|---|
| Single error bag (default) | Simple pages with one form |
| One error bag per form | Pages with multiple independent forms |
| One error bag per feature | Feature-specific error grouping |

---

## Tradeoffs

| Concern | ValidationException (automatic) | Manual Error Handling |
|---|---|---|
| Boilerplate | Minimal (framework handles it) | High (check, store, return) |
| Consistency | High (framework standard) | Varies per developer |
| Flexibility | Limited (framework default flow) | Full control |
| Readability | Clean controllers | Error-handling code mixed in |

---

## Performance Considerations

Validation exception handling is on the hot path (every form submission that fails). The overhead is small: validation runs before the exception is thrown, and the exception itself adds ~0.5ms for redirect/response generation. This is negligible compared to the validation rules themselves.

---

## Production Considerations

- Customize `resources/views/errors/422.blade.php` if you want a custom 422 error page
- Use named error bags when a page has multiple forms
- Always validate on the server — never trust client-side validation alone
- Log validation failures at `INFO` level (not ERROR) — they're expected behaviour
- Return structured validation errors in API responses for frontend consumption
- Test validation failure paths in every form submission test
- Use `$request->validateWithBag('formName', $rules)` for inline validation with custom bags

---

## Common Mistakes

### Not Using Form Requests for Complex Validation

```php
// Bad — validation logic in controller
public function store(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8',
        'terms' => 'accepted',
    ]);
    // 20 lines of validation in controller...
}

// Good — extracted to FormRequest
public function store(StoreUserRequest $request)
{
    User::create($request->validated());
}
```

### Forgetting to Check Validation in API Tests

```php
// Test for successful validation
$response->assertSessionHasNoErrors();

// Test for validation failure
$response->assertSessionHasErrors(['email']);
// For API:
$response->assertStatus(422);
$response->assertJsonValidationErrors(['email']);
```

### Catching ValidationException Incorrectly

```php
// Bad — prevents the framework from handling the redirect
try {
    $request->validate([...]);
} catch (ValidationException $e) {
    return response()->json($e->errors(), 422);
}

// Good — let the framework handle it (or customize in FormRequest)
```

---

## Failure Modes

### Validation Rules That Never Fail

A validation rule that always passes (due to a bug) allows invalid data through. The application proceeds with bad data and crashes later with an unclear error. Mitigate: write tests that verify validation rules reject invalid data.

### Missing CSRF Token on AJAX Validation

An AJAX POST request without a CSRF token fails CSRF validation before reaching the form validation. The user gets a 419 (CSRF token mismatch) instead of a 422 with field errors. Ensure AJAX requests include the CSRF token in the header.

---

## Ecosystem Usage

### Laravel Form Requests

Form Requests are the primary ecosystem mechanism for validation. They automatically throw ValidationException when validation rules fail, integrating seamlessly with the handler.

### Livewire

Livewire's validation system integrates with Laravel's validator but does not throw ValidationException — errors are stored in the component's `$errors` property and rendered inline.

### Inertia.js

Inertia intercepts 422 redirect responses and converts flashed validation errors into the page's `errors` prop, providing a seamless form validation experience.

### Spatie Laravel Validation Rules

The spatie/laravel-validation-rules package provides reusable validation rules that throw standard ValidationException instances when they fail.

---

## Related Knowledge Units

- **Form Requests & Validation** (this workspace) — how validation rules are defined
- **Exception Fundamentals** (this workspace) — where validation exceptions fit
- **HTTP Exceptions** (this workspace) — other HTTP exceptions (404, 403)
- **API Exception Handling** (this workspace) — JSON validation error responses
- **Exception Testing** (this workspace) — testing validation failure paths

---

## Research Notes

- `ValidationException` extends `Exception` — it's a regular PHP exception
- The exception is thrown in the `FormRequest::failedValidation()` method
- Override `failedValidation()` to customize the response
- `errorBag` property controls which session bag errors are stored in
- `redirectTo` property controls where the user is redirected
- The `errors()` method returns a `MessageBag` instance (array of arrays)
- Inertia automatically reads flashed validation errors and makes them available as `$page.props.errors`
- Livewire validates via the `#[Rule]` attribute and stores errors in the component's `$errors` property
- API validation errors use the format: `{'field': ['message1', 'message2']}`
- Laravel 11+ can customize validation error JSON format in the exception handler
