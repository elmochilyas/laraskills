# Skill: Create FormRequest-Validated Endpoint

## Purpose

Build a validated controller endpoint using a FormRequest class with typed rules, authorization gates, named error bags for multi-form pages, and proper test coverage for both success and validation failure paths.

## When To Use

- When creating a new form submission endpoint
- When refactoring inline `$request->validate()` into a reusable, testable class
- When the same validation rules are needed across multiple controllers
- When a page has multiple independent forms requiring separate error states

## When NOT To Use

- Simple single-field validation with a single rule may remain inline
- Validation that is never reused and has only 1–2 rules may remain inline
- Business rule validation (e.g., "user already has an active subscription") should be a custom exception, not a FormRequest rule

## Prerequisites

- A controller action that accepts form input
- Understanding of Laravel validation rule syntax (string and array formats)
- Understanding of error bag isolation for multi-form pages

## Inputs

- Route URI and HTTP method (POST, PUT, PATCH)
- Field names and their validation rules
- Authorization policy (who can perform this action)
- Error bag name (if the page has multiple forms)
- Custom error messages (if framework defaults need overrides)

## Workflow

1. Create a FormRequest class using `php artisan make:request StoreUserRequest`.

2. Define `authorize()` to gate access (return `true` if no authorization needed):
   ```php
   public function authorize(): bool
   {
       return true; // Or check gate: return auth()->user()->can('create', User::class);
   }
   ```

3. Define `rules()` using array syntax (preferred over pipe-strings for consistency):
   ```php
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
   ```

4. If the page has multiple independent forms, set the error bag:
   ```php
   protected $errorBag = 'create_user'; // Default is 'default'
   ```

5. Inject the FormRequest into the controller method (the framework validates automatically):
   ```php
   public function store(StoreUserRequest $request)
   {
       $user = User::create($request->validated());
       return redirect()->route('users.show', $user);
   }
   ```

6. Write tests for both the success path and validation failure path:
   ```php
   public function test_creates_user()
   {
       $response = $this->post('/users', [
           'name' => 'John',
           'email' => 'john@example.com',
           'password' => 'password123',
           'password_confirmation' => 'password123',
       ]);
       $response->assertCreated();
   }

   public function test_validates_required_fields()
   {
       $response = $this->post('/users', []);
       $response->assertSessionHasErrors(['name', 'email', 'password']);
   }
   ```

7. Never catch `ValidationException` in the controller — the framework handles it automatically (redirect for HTML, JSON for API).

## Validation Checklist

- [ ] FormRequest is used instead of inline `$request->validate()` for 3+ rules
- [ ] `authorize()` method gates access (or returns `true` for public endpoints)
- [ ] Rules use array syntax for consistency and extensibility
- [ ] Named error bag is set when the page has multiple forms
- [ ] Controller uses `$request->validated()` instead of `$request->all()`
- [ ] Tests exist for success path (assertCreated, assertRedirect)
- [ ] Tests exist for validation failure paths (assertSessionHasErrors)
- [ ] `ValidationException` is never caught in the controller

## Common Failures

1. **Inline validation**: 20+ lines of validation rules in the controller method instead of a FormRequest — bloated, unreusable, untestable.

2. **No authorization check**: The FormRequest's `authorize()` always returns `true` when the action should be gated (e.g., admin-only endpoints).

3. **Catching ValidationException**: Wrapping the FormRequest validation in a try/catch — the framework already handles the response correctly.

4. **Missing validation failure tests**: Only testing the success path — a buggy validation rule allows invalid data through without detection.

5. **No error bag isolation**: Multiple forms on the same page share the default error bag, causing errors from one form to appear on the other.

## Decision Points

- **FormRequest vs inline**: Extract to FormRequest when validation involves 3+ rules, or validation logic is reused across multiple controllers.
- **String rules vs array rules**: Use array syntax (`['required', 'email']`) for consistency and easier extensibility. Pipe-string syntax (`'required|email'`) is simpler for single rules.

## Performance Considerations

- FormRequest instantiation and rule execution adds ~1–5ms per request
- This is negligible compared to database queries and view rendering
- Validation failure responses (redirect/JSON) are fast — ~0.5ms overhead

## Security Considerations

- Server-side validation is the definitive security boundary — never trust client-side validation alone
- `$request->validated()` returns only validated fields — prevents mass assignment
- CSRF tokens are required for non-API routes — missing CSRF produces a 419 error (not 422)
- Validation rules prevent malformed data from reaching the application layer

## Related Rules

- Use FormRequest Classes Instead of Inline Validation in Controllers
- Never Catch ValidationException in Controllers
- Log Validation Failures at INFO Level, Not ERROR
- Use Named Error Bags for Pages with Multiple Independent Forms
- Test Validation Failure Paths for Every Form and Endpoint
- Always Perform Server-Side Validation — Never Trust Client-Side Alone
- Use assertSessionHasErrors() for HTML and assertJsonValidationErrors() for API Validation Tests

## Related Skills

- Customize Validation Error Responses (this file, below)
- Implement Content-Negotiated HTTP Error Responses (http-exceptions)

## Success Criteria

- FormRequest classes are used for all validation with 3+ rules
- Validation failure tests exist for every endpoint
- Multiple forms on the same page use isolated error bags
- Controller actions use `$request->validated()` for mass assignment protection
- `ValidationException` is never caught in controller code

---

# Skill: Customize Validation Error Responses

## Purpose

Override the default validation error response format by customizing `failedValidation()` on FormRequest classes for per-endpoint needs, or configuring a global `renderable()` for `ValidationException` when the entire application needs a consistent custom format.

## When To Use

- When the default validation error format doesn't match the API contract requirements
- When a specific endpoint needs a unique error format (custom status codes, additional metadata)
- When integrating with a frontend framework that expects a specific error shape
- When standardizing all validation errors across the application

## When NOT To Use

- The default Laravel validation error format is sufficient — it already provides field-to-messages mapping
- Application is pure web (Blade) with no API — the redirect-back behavior is correct
- The only customization needed is error messages — use `messages()` method on FormRequest instead

## Prerequisites

- FormRequest class for the endpoint (see "Create FormRequest-Validated Endpoint")
- Understanding of the ValidationException and its constructor parameters
- API error envelope format defined (see "Configure Global API Error Handler" in api-exception-handling)

## Inputs

- The Validator instance (with errors, failed rules, and input)
- Custom response format (JSON structure, redirect URL, headers)
- Error bag name (for multi-form isolation)

## Workflow

1. Choose the customization scope:
   - **Per-endpoint**: Override `failedValidation()` on a single FormRequest
   - **Global**: Add a `renderable()` callback for `ValidationException` in the exception handler

2. For per-endpoint customization, override `failedValidation()` on the FormRequest:
   ```php
   class StoreUserRequest extends FormRequest
   {
       protected function failedValidation(Validator $validator)
       {
           $response = response()->json([
               'message' => 'Validation failed',
               'errors' => $validator->errors()->toArray(),
               'code' => 'VALIDATION_ERROR',
           ], 422);

           throw new ValidationException($validator, $response);
       }
   }
   ```

3. To set a custom redirect URL on validation failure:
   ```php
   protected function failedValidation(Validator $validator)
   {
       throw (new ValidationException($validator))
           ->errorBag('create_user')
           ->redirectTo(route('users.create'));
   }
   ```

4. For global customization across the entire application, add a `renderable()` callback for `ValidationException` in the exception handler (placed before the catch-all):
   ```php
   $exceptions->renderable(function (ValidationException $e, Request $request) {
       if (!$request->is('api/*') && !$request->expectsJson()) {
           return; // Fall through to default redirect-back for web
       }

       return response()->json([
           'error' => [
               'message' => 'Validation failed.',
               'type' => 'validation_error',
               'code' => 422,
               'details' => $e->errors(),
           ],
           'request_id' => $request->header('X-Request-Id'),
       ], 422);
   });
   ```

5. Ensure validation failures are logged at INFO level (not ERROR) in the handler:

6. Test the custom format:
   ```php
   // API
   $response = $this->postJson('/api/users', []);
   $response->assertStatus(422);
   $response->assertJsonValidationErrors(['email']);
   $response->assertJson(['code' => 'VALIDATION_ERROR']);

   // HTML — still redirects back
   $response = $this->post('/users', []);
   $response->assertSessionHasErrors(['email']);
   ```

## Validation Checklist

- [ ] Custom `failedValidation()` throws `ValidationException` with the desired response
- [ ] Global `renderable()` for `ValidationException` does not interfere with web redirect-back behavior
- [ ] API responses include structured field-to-messages error mapping
- [ ] Validation errors are logged at INFO level (not ERROR)
- [ ] Tests verify both the custom format and the default redirect-back behavior
- [ ] `failedValidation()` is used instead of middleware or controller code for customization

## Common Failures

1. **No fallthrough for web**: The global `renderable()` for `ValidationException` returns JSON for all requests, even web requests — breaks the redirect-back behavior.

2. **Customizing via middleware**: Modifying the validation response in middleware instead of `failedValidation()` — spreads logic across layers.

3. **Inconsistent format**: Some endpoints use custom `failedValidation()` while others use the default — clients must handle multiple error shapes.

4. **Missing catch-all ValidationException**: A `renderable()` for `ValidationException` is not registered, but the catch-all `Throwable` handler fires and returns a generic 500 instead of a 422.

## Decision Points

- **Per-endpoint vs global**: Use `failedValidation()` on a per-FormRequest basis when different endpoints need different formats. Use a global `renderable()` for `ValidationException` when the entire application shares a unified error contract.
- **Custom vs default message**: If only error messages need changing, use the `messages()` method on the FormRequest instead of `failedValidation()`.

## Performance Considerations

- `failedValidation()` is called only on validation failure — not on the hot path
- Custom response formatting adds ~0.1ms overhead
- Negligible impact

## Security Considerations

- Validation error messages may reveal accepted input formats (password requirements, field patterns)
- This is acceptable — it's part of the API contract
- Do not include the submitted input values in the error response
- CSRF tokens still required for non-API routes

## Related Rules

- Customize failedValidation() for Non-Standard Error Responses
- Never Catch ValidationException in Controllers
- Structure API Validation Errors as Field → Messages Mapping
- Log Validation Failures at INFO Level, Not ERROR
- Test Validation Failure Paths for Every Form and Endpoint

## Related Skills

- Create FormRequest-Validated Endpoint (this file, above)
- Configure Global API Error Handler (api-exception-handling)
- Implement API Validation Error Responses (api-exception-handling)

## Success Criteria

- Custom validation error format matches the API contract
- Web forms still redirect back with flashed errors
- All endpoints use a consistent validation error format (either default or custom)
- Validation errors are logged at the correct severity (INFO)
- Customization is done via `failedValidation()` or handler `renderable()`, not middleware
