# Rules for Validation Exceptions

---

## Rule: Use FormRequest Classes Instead of Inline Validation in Controllers

---

## Category

Code Organization

---

## Rule

Always use dedicated FormRequest classes for complex validation logic. Never write inline `$request->validate()` with more than 2–3 rules directly in controllers.

---

## Reason

FormRequest classes are independently testable, reusable across controllers, and keep controllers focused on request handling. Inline validation in controllers violates single responsibility and bloats controller methods.

---

## Bad Example

```php
class UserController
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:admin,user',
            'terms' => 'accepted',
        ]);
        // ...store logic...
    }
}
```

---

## Good Example

```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', 'in:admin,user'],
            'terms' => ['accepted'],
        ];
    }
}

class UserController
{
    public function store(StoreUserRequest $request)
    {
        $user = User::create($request->validated());
        // ...
    }
}
```

---

## Exceptions

Single-field validation with a simple rule may be inlined. Extract to FormRequest as soon as validation involves 3+ rules or is reused.

---

## Consequences Of Violation

Maintenance risks: validation logic duplicated across controllers. Testability: inline validation cannot be unit-tested independently.

---

## Rule: Never Catch ValidationException in Controllers

---

## Category

Reliability

---

## Rule

Never wrap validation in `try/catch` for `ValidationException` in controllers. Always let the framework handle validation exceptions automatically.

---

## Reason

Laravel's exception handler already produces the correct response: redirect back with errors for HTML, 422 JSON for API, Inertia errors for Inertia requests. Catching it yourself risks inconsistent handling and duplicates framework behavior.

---

## Bad Example

```php
public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);
    } catch (ValidationException $e) {
        // Reimplementing framework behavior — unnecessary
        return response()->json(['errors' => $e->errors()], 422);
    }
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request)
{
    // Validation handled by FormRequest — exception handled by framework
    User::create($request->validated());
}
```

---

## Exceptions

When you need to include additional data (e.g. a redirect URL or custom headers) with the validation error response, override `failedValidation()` on the FormRequest instead of catching in the controller.

---

## Consequences Of Violation

Maintenance risks: duplicated error handling logic across controllers. Reliability risks: some endpoints may handle validation differently than the framework default.

---

## Rule: Log Validation Failures at INFO Level, Not ERROR

---

## Category

Maintainability

---

## Rule

Always ensure `ValidationException` is logged at INFO level (or not reported at all). Never log validation failures at ERROR level.

---

## Reason

Validation failures are expected application behavior, not system errors. Logging them as ERROR creates noise that buries real server errors and triggers false alerts in monitoring systems.

---

## Bad Example

```php
// Validation errors logged as ERROR — fills monitoring dashboards
protected $levels = [
    ValidationException::class => LogLevel::ERROR,
];
```

---

## Good Example

```php
// Validation errors excluded from ERROR-level reporting
$exceptions->dontReport([
    ValidationException::class,
]);

// Or logged at appropriate level
protected $levels = [
    ValidationException::class => LogLevel::INFO,
];
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: real errors are buried in validation-failure noise. Reliability risks: false alerts desensitize the team.

---

## Rule: Use Named Error Bags for Pages with Multiple Independent Forms

---

## Category

User Experience

---

## Rule

Always use named error bags when a single page contains multiple independent forms (e.g., login + registration on the same page). Never use the default error bag for multiple forms.

---

## Reason

Without named error bags, validation errors from one form appear on the other form, confusing users. Named bags isolate error state per form.

---

## Bad Example

```php
// Both forms use the default error bag — errors mix
class LoginRequest extends FormRequest {}
class RegisterRequest extends FormRequest {}
```

---

## Good Example

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

---

## Exceptions

Pages with a single form do not need named error bags.

---

## Consequences Of Violation

User experience: validation errors from one form appear on another form. Maintenance risks: fixing error display requires state management workarounds.

---

## Rule: Customize failedValidation() for Non-Standard Error Responses

---

## Category

Framework Usage

---

## Rule

Override `failedValidation()` on a FormRequest when you need custom error response behavior (custom JSON format, redirect URL, additional headers). Never use middleware or controller code to modify validation error responses.

---

## Reason

`failedValidation()` is the designated extension point for custom validation error behavior. Using middleware or controller code spreads error response logic across layers, making it harder to maintain.

---

## Bad Example

```php
// Customizing validation response via middleware — wrong layer
class CustomizeValidationResponse
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        if ($response->status() === 422 && $request->is('api/*')) {
            // Modify response format here — fragile
        }
        return $response;
    }
}
```

---

## Good Example

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

// Or custom API format
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

---

## Exceptions

When ALL validation responses across the application need the same custom format, configure a global `renderable()` for `ValidationException` in the exception handler instead.

---

## Consequences Of Violation

Maintenance risks: error response customization is scattered across layers. Reliability risks: some endpoints use the framework default while others have custom behavior.

---

## Rule: Test Validation Failure Paths for Every Form and Endpoint

---

## Category

Testing

---

## Rule

Always write tests for validation failure paths alongside success paths for every form or API endpoint. Never ship a form without a validation failure test.

---

## Reason

A buggy validation rule that always passes allows invalid data to reach the application layer. Validation failure tests catch rules that don't validate, rules that are too permissive, and rules that throw errors instead of returning validation messages.

---

## Bad Example

```php
// Only tests the success path — validation rules may be broken
public function test_creates_user()
{
    $response = $this->post('/users', [
        'name' => 'John',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);
    $response->assertCreated();
}
```

---

## Good Example

```php
public function test_creates_user()
{
    $response = $this->post('/users', [
        'name' => 'John',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);
    $response->assertCreated();
}

public function test_validates_required_fields()
{
    $response = $this->postJson('/users', []);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'email', 'password']);
}

public function test_validates_email_format()
{
    $response = $this->postJson('/users', [
        'email' => 'not-an-email',
    ]);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['email']);
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: invalid data passes validation and causes downstream errors. Maintenance risks: broken validation rules go undetected until production.

---

## Rule: Always Perform Server-Side Validation — Never Trust Client-Side Alone

---

## Category

Security

---

## Rule

Always validate all input on the server side, regardless of client-side validation. Never rely solely on JavaScript or HTML5 validation for security or data integrity.

---

## Reason

Client-side validation is a user experience enhancement — it can be bypassed by disabling JavaScript, using curl, or modifying requests. Server-side validation is the only authoritative security boundary.

---

## Bad Example

```php
// No server-side validation — trusts client
public function store(Request $request)
{
    $user = User::create($request->all()); // SQL injection, mass assignment, invalid data
}
```

---

## Good Example

```php
// Server-side validation is the authoritative check
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}
```

---

## Exceptions

No common exceptions. Server-side validation is mandatory for all production applications.

---

## Consequences Of Violation

Security risks: SQL injection, mass assignment, invalid data reaching application layer. Data integrity risks: malformed data corrupts database state.

---

## Rule: Structure API Validation Errors as Field → Messages Mapping

---

## Category

Design

---

## Rule

Always return API validation errors as a structured field-to-messages mapping (key = field name, value = array of error strings). Never return a flat error message for validation failures.

---

## Reason

Frontend frameworks (React, Vue) map field-level errors to form inputs using the field name as the key. A flat message string requires clients to parse and extract field errors, which is brittle and non-standard.

---

## Bad Example

```php
// Flat error message — frontend can't map to form fields
return response()->json(['message' => 'The email field is required.'], 422);
```

---

## Good Example

```php
// Structured field → messages — frontend maps directly to inputs
return response()->json([
    'message' => 'Validation failed.',
    'errors' => [
        'email' => ['The email field is required.'],
        'password' => ['The password must be at least 8 characters.'],
    ],
], 422);
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

User experience: field-level errors cannot be displayed inline. Maintenance risks: frontend developers must write brittle parsing logic for each endpoint.

---

## Rule: Use assertSessionHasErrors() for HTML and assertJsonValidationErrors() for API Validation Tests

---

## Category

Testing

---

## Rule

Always use `assertSessionHasErrors()` for HTML form validation tests and `assertJsonValidationErrors()` for API validation tests. Never assert validation errors by inspecting raw response content.

---

## Reason

These dedicated assertion methods test the actual validation error mechanism, not just the response body. `assertSessionHasErrors()` verifies errors were flashed to the session. `assertJsonValidationErrors()` verifies the structured JSON error format. Raw content assertions are brittle.

---

## Bad Example

```php
// Brittle — checks raw response content
$response = $this->post('/users', []);
$this->assertStringContainsString('The name field is required.', $response->getContent());
```

---

## Good Example

```php
// HTML form — checks session errors
$response = $this->post('/users', []);
$response->assertSessionHasErrors(['name', 'email']);

// API — checks structured validation errors
$response = $this->postJson('/api/users', []);
$response->assertStatus(422);
$response->assertJsonValidationErrors(['name', 'email']);
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability tests: validation assertions may pass when the framework error mechanism is broken. Maintenance risks: tests break when error message copy changes.
