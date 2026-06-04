# Anti-Patterns: Validation Error Formatting

## 1. The Inline Validation Controller

A controller method with 50 lines of inline `$request->validate()` calls instead of a FormRequest class.

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

Inline validation violates single responsibility, bloats controllers, makes validation logic untestable independently, and prevents reuse across controllers. Use dedicated FormRequest classes for any validation with 3+ rules:

```php
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

class UserController
{
    public function store(StoreUserRequest $request)
    {
        $user = User::create($request->validated());
    }
}
```

## 2. The Caught-and-Rethrown

Catching `ValidationException` in controllers only to re-throw it or return the same response.

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

Laravel's exception handler already produces the correct response: redirect back with errors for HTML, 422 JSON for API, Inertia errors for Inertia requests. Catching it yourself risks inconsistent handling and duplicates framework behavior. When you need additional data with the error response, override `failedValidation()` on the FormRequest instead.

## 3. The Missing Validation Test

No test for validation failure paths — only the success path is tested.

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

A buggy validation rule that always passes allows invalid data to reach the application layer. Validation failure tests catch rules that don't validate, rules that are too permissive, and rules that throw errors instead of returning validation messages. Every form submission test should test both the success path and the validation failure path:

```php
public function test_validates_required_fields()
{
    $response = $this->postJson('/users', []);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'email', 'password']);
}
```

## 4. The Cross-Form Error Pollution

Multiple independent forms on the same page sharing the default error bag, causing validation errors from one form to appear on the other.

```php
// Both forms use the default error bag — errors mix
class LoginRequest extends FormRequest {}
class RegisterRequest extends FormRequest {}
```

Without named error bags, validation errors from one form appear on the other form, confusing users. Named bags isolate error state per form:

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

## 5. The Flat Validation Message

Returning a flat error string for API validation failures instead of a structured field-to-messages mapping.

```php
// Flat error message — frontend can't map to form fields
return response()->json(['message' => 'The email field is required.'], 422);
```

Frontend frameworks (React, Vue) map field-level errors to form inputs using the field name as the key. A flat message string requires clients to parse and extract field errors, which is brittle and non-standard. Always return structured field-to-messages mapping:

```php
return response()->json([
    'message' => 'Validation failed.',
    'errors' => [
        'email' => ['The email field is required.'],
        'password' => ['The password must be at least 8 characters.'],
    ],
], 422);
```

## 6. The Over-Logged Validation

Logging validation failures at ERROR level, filling monitoring dashboards with noise.

```php
// Validation errors logged as ERROR — fills monitoring dashboards
protected $levels = [
    ValidationException::class => LogLevel::ERROR,
];
```

Validation failures are expected application behavior, not system errors. Logging them as ERROR creates noise that buries real server errors and triggers false alerts in monitoring systems. Always ensure `ValidationException` is logged at INFO level or not reported at all.

## 7. The Client-Trusting Server

Relying solely on client-side validation without server-side validation as the definitive security boundary.

```php
// No server-side validation — trusts client
public function store(Request $request)
{
    $user = User::create($request->all()); // SQL injection, mass assignment, invalid data
}
```

Client-side validation is a user experience enhancement — it can be bypassed by disabling JavaScript, using curl, or modifying requests. Server-side validation is the only authoritative security boundary. Always validate all input on the server side, regardless of client-side validation.
