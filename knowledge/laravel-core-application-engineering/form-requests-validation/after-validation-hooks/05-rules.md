# After Validation Hooks — Engineering Rules

---

## Rule 1: Use withValidator() for Validator Modification, Not Override

---

## Category

Framework Usage

---

## Rule

Use `withValidator()` to modify the validator instance or add `after()` callbacks. Do not override the `validator()` method unless you need complete control over the validator construction.

---

## Reason

The `validator()` method constructs the entire validator. Overriding it loses default FormRequest behavior (message customization, attribute names, custom resolvers). The `withValidator()` hook is designed for safe modifications after construction.

---

## Bad Example

```php
// Overriding validator() — risky, loses defaults
public function validator()
{
    $validator = Validator::make($this->all(), $this->rules());
    $validator->after(function ($validator) {
        // cross-field check
    });
    return $validator;
}
```

---

## Good Example

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        // cross-field check
    });
}
```

---

## Exceptions

Override `validator()` when you need to change the validator class, inject a custom presence verifier, or modify the validator factory behavior globally.

---

## Consequences Of Violation

Maintenance risks: unexpected behavior when default FormRequest features (messages(), attributes()) stop working.

---

## Rule 2: Keep passedValidation() Lightweight

---

## Category

Performance

---

## Rule

Limit `passedValidation()` to lightweight, read-only operations. Do not execute database writes, dispatch jobs, send emails, or perform any heavy business logic.

---

## Reason

`passedValidation()` runs on every successful validation submission. Heavy operations here slow every form submission and violate separation of concerns — post-validation side effects belong in services or actions.

---

## Bad Example

```php
protected function passedValidation(): void
{
    Mail::to($this->user())->send(new WelcomeMail());
    $this->user()->increment('login_count');
    Log::channel('audit')->info('User logged in', $this->validated());
}
```

---

## Good Example

```php
protected function passedValidation(): void
{
    $this->merge(['validated_at' => now()]);
}
// Business logic moved to service layer
```

---

## Exceptions

Audit logging may be acceptable if it uses an ultra-lightweight mechanism (e.g., async log writer). For production, dispatch a queued job instead.

---

## Consequences Of Violation

Performance risks: increased response time for every valid submission. Maintenance risks: business logic hidden inside validation hooks, hard to find and test.

---

## Rule 3: Do Not Put Business Logic in Validation Hooks

---

## Category

Architecture

---

## Rule

Never create records, send notifications, dispatch jobs, or execute business operations inside `withValidator()`, `passedValidation()`, `failedValidation()`, or `after()` callbacks. Validation hooks are for validation concerns only.

---

## Reason

Validation hooks run as part of the HTTP request lifecycle. Business logic in these hooks creates tight coupling between validation and domain operations, makes testing harder, and violates the Single Responsibility Principle.

---

## Bad Example

```php
protected function passedValidation(): void
{
    $invoice = Invoice::create($this->validated());
    $this->merge(['invoice_id' => $invoice->id]);
}
```

---

## Good Example

```php
// Validation hook — only validation
protected function passedValidation(): void
{
    $this->merge(['validated_at' => now()]);
}

// Controller — orchestrates the action
public function store(StoreInvoiceRequest $request, CreateInvoiceAction $action)
{
    return $action->execute($request->payload());
}
```

---

## Exceptions

No common exceptions. All business logic must live in services, actions, jobs, or controllers — never in validation hooks.

---

## Consequences Of Violation

Maintenance risks: business logic scattered across request classes. Testing risks: validation tests must now mock business operations. Reliability risks: business operations may fail silently inside hooks.

---

## Rule 4: Use Validator::after() for Cross-Field Validation

---

## Category

Design

---

## Use `after()` callbacks registered inside `withValidator()` for validation that involves two or more fields together. Do not put cross-field logic in individual field rules.

---

## Reason

Individual field rules run per-attribute without access to other field values. The `after()` callback fires after all field rules have executed and receives the full validator instance, enabling checks like "end_date must be after start_date."

---

## Bad Example

```php
// Impossible — can't reference other fields in individual rules
'end_date' => ['required', 'date', 'after:start_date'] // This works but for date comparison only
```

---

## Good Example

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->start_date >= $this->end_date) {
            $validator->errors()->add('end_date', 'End date must be after start date.');
        }
    });
}
```

---

## Exceptions

Use `after:field` and `before:field` for simple date comparisons that native rules already support. Reserve `after()` callbacks for logic the native rules cannot express.

---

## Consequences Of Violation

Maintenance risks: complex cross-field logic shoehorned into individual rules. Performance risks: redundant checks across multiple field rules.

---

## Rule 5: Test Both Pass and Fail Paths for Custom Hooks

---

## Category

Testing

---

---

## Rule

Write integration tests that cover both scenarios for every custom hook: validation success (verifying `passedValidation()` behavior) and validation failure (verifying `failedValidation()` response structure and `after()` error messages).

---

## Reason

Custom hooks modify the response or the request state. Without explicit tests for both paths, hook failures — especially in `failedValidation()` — can produce broken error responses in production.

---

## Bad Example

```php
// Only tests the happy path
public function test_valid_data_passes(): void
{
    $response = $this->post('/invoices', ['amount' => 100]);
    $response->assertSessionHasNoErrors();
}
```

---

## Good Example

```php
public function test_valid_data_passes(): void
{
    $response = $this->post('/invoices', ['amount' => 100]);
    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/invoices');
}

public function test_invalid_data_returns_json_errors(): void
{
    $response = $this->postJson('/api/invoices', ['amount' => -1]);
    $response->assertStatus(422);
    $response->assertJsonStructure(['success' => false, 'errors']);
}
```

---

## Exceptions

If `passedValidation()` is not overridden (default no-op), testing that path is not required.

---

## Consequences Of Violation

Reliability risks: broken error responses in production. Testing gaps: untested hooks may contain bugs that only surface in edge cases.

---

## Rule 6: Do Not Execute Database Queries in withValidator()

---

## Category

Performance

---

## Rule

Avoid database queries, API calls, or any I/O operations inside `withValidator()`. Use this hook exclusively for validator configuration — adding callbacks, setting rules, or merging data.

---

## Reason

`withValidator()` fires during `getValidatorInstance()`, which is called inside `validateResolved()`. Unauthorized requests are still resolved through this path. Executing queries here wastes resources on requests that will be rejected by `authorize()`.

---

## Bad Example

```php
public function withValidator(Validator $validator): void
{
    $user = User::with('subscriptions')->find($this->user()->id); // DB query
    $settings = Setting::where('user_id', $this->user()->id)->first(); // Another query
    // configuration using query results
}
```

---

## Good Example

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        // I/O belongs here if at all, or better in service layer
    });
}
```

---

## Exceptions

Cache lookups (not DB queries) may be acceptable if the cache is in-memory and the check is trivial (e.g., `Cache::get('config')`).

---

## Consequences Of Violation

Performance risks: wasted database queries on requests that will be rejected. Scalability risks: multiplied query load under high traffic.

---

## Rule 7: Do Not Mutate Validated Data in after() Callbacks

---

## Category

Framework Usage

---

## Rule

Do not modify the request or its input inside `after()` callbacks. These callbacks fire after the validated result has been computed, so mutations will not appear in `validated()` output.

---

## Reason

The `after()` callback fires during the `fails()` pass, after the main rule loop has completed. The validated result is already captured. Mutations at this point create a misleading expectation that data has changed when it has not.

---

## Bad Example

```php
$validator->after(function ($validator) {
    $this->merge(['computed' => someCalculation()]); // Will NOT be in validated()
});
```

---

## Good Example

```php
// Do mutations in prepareForValidation() instead
protected function prepareForValidation(): void
{
    $this->merge(['computed' => someCalculation()]);
}
```

---

## Exceptions

No common exceptions. Use `prepareForValidation()` for data transformation and `passedValidation()` for post-processing that does not need to affect `validated()`.

---

## Consequences Of Violation

Maintenance risks: developers expect mutations to appear in validated data but they do not. Reliability risks: subtle bugs where computed values are silently missing.

---

## Rule 8: Do Not Leak Sensitive Information in failedValidation()

---

## Category

Security

---

## Rule

Return generic, field-level error messages in `failedValidation()` custom responses. Do not include internal state, stack traces, database values, or system details in validation error output.

---

## Reason

Custom responses in `failedValidation()` are sent directly to the HTTP client. Overly detailed error messages can expose internal application state, database contents, or system architecture to attackers.

---

## Bad Example

```php
protected function failedValidation(Validator $validator)
{
    throw new HttpResponseException(response()->json([
        'error' => 'Validation failed because user with role ' . $this->user()->role . ' cannot perform this action',
        'debug' => $validator->errors()->all(),
        'sql' => 'SELECT * FROM users...',
    ], 422));
}
```

---

## Good Example

```php
protected function failedValidation(Validator $validator)
{
    throw new HttpResponseException(response()->json([
        'success' => false,
        'errors' => $validator->errors(),
    ], 422));
}
```

---

## Exceptions

Development/staging environments may include additional detail, but only behind environment checks (`if (app()->isLocal()) { ... }`).

---

## Consequences Of Violation

Security risks: sensitive data exposure. Compliance risks: leaking PII or protected data in error responses.
