# Input Preparation — Engineering Rules

---

## Rule 1: Use prepareForValidation() for Type Coercion Before Validation

---

## Category

Design

---

## Rule

Override `prepareForValidation()` to coerce form input strings to native PHP types before validation rules execute. Handle checkboxes, comma-separated strings, numeric strings, and boolean form values.

---

## Reason

HTML form inputs are always strings. Validation rules operate on the raw input unless coerced. Without explicit type coercion, `'0'` passes `required_if` differently than `false`, and comma-separated strings pass `array` validation incorrectly.

---

## Bad Example

```php
// Validation sees "on" instead of true
'is_active' => ['required', 'boolean'], // "on" fails boolean rule
```

---

## Good Example

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN),
    ]);
}
// Now boolean validation works correctly
```

---

## Exceptions

For API requests with JSON bodies, types are often already native PHP types. Type coercion may not be needed for JSON-sourced input.

---

## Consequences Of Violation

Reliability risks: validation rules fail on correct data due to type mismatch. User experience: valid form submissions rejected due to string-typed form values.

---

## Rule 2: Do Not Execute Database Queries in prepareForValidation()

---

## Category

Architecture

---

## Rule

Do not perform database queries, API calls, or I/O operations inside `prepareForValidation()`. This hook runs before authorization, so queries execute even on requests that will be rejected.

---

## Reason

`prepareForValidation()` is the first step in the validation pipeline — it runs before `authorize()`. Any query here is wasted on unauthorized requests. Additionally, input preparation should be a fast, side-effect-free normalization step.

---

## Bad Example

```php
protected function prepareForValidation(): void
{
    $user = User::find($this->user_id); // DB query — runs before authorize()
    $this->merge([
        'display_name' => $user->profile->display_name, // N+1 potential
    ]);
}
```

---

## Good Example

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'display_name' => $this->display_name ?? $this->name,
    ]);
    // No I/O — normalization only
}
// Domain enrichment happens in the service layer
```

---

## Exceptions

Read-only cache lookups (e.g., `Cache::get('config')`) are acceptable if the cache is local and fast.

---

## Consequences Of Violation

Performance risks: wasted database queries on unauthorized requests. Scalability risks: multiplied load under high traffic to public endpoints.

---

## Rule 3: Use merge() — Not passedValidation() — for Data Transformation

---

## Category

Framework Usage

---

## Rule

Apply data transformations (default values, computed fields, type coercion) in `prepareForValidation()` using `$this->merge()`. Do not use `passedValidation()` for data transformation — it fires after the validated result is computed.

---

## Reason

`prepareForValidation()` fires before validation — values merged here are available to the validator and appear in `validated()`. `passedValidation()` fires after validation passes — merging data there does NOT affect the result of `validated()`.

---

## Bad Example

```php
protected function passedValidation(): void
{
    $this->merge(['slug' => Str::slug($this->title)]);
    // slug is NOT in validated() — transformation is invisible
}
```

---

## Good Example

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->title),
        'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN),
    ]);
}
// slug and is_active appear in validated()
```

---

## Exceptions

Use `passedValidation()` only for lightweight side effects like logging or merging metadata that does NOT need to appear in validated output.

---

## Consequences Of Violation

Reliability risks: transformed data silently missing from validated result. Debugging difficulty: developers expect merged data to appear in validated output.

---

## Rule 4: Do Not Place Authorization Logic in prepareForValidation()

---

## Category

Security

---

## Rule

Do not perform authorization checks, role validation, or access control logic inside `prepareForValidation()`. Authorization belongs exclusively in the `authorize()` method.

---

## Reason

Although `prepareForValidation()` runs before `authorize()`, it is not designed for security. Authorization logic belongs in the dedicated `authorize()` method, which is intentional, testable, and understood by all Laravel developers as the access control gate.

---

## Bad Example

```php
protected function prepareForValidation(): void
{
    if ($this->user()->cannot('create', Post::class)) {
        abort(403); // Authorization in the wrong place
    }
    $this->merge(['slug' => Str::slug($this->title)]);
}
```

---

## Good Example

```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}

protected function prepareForValidation(): void
{
    $this->merge(['slug' => Str::slug($this->title)]);
}
```

---

## Exceptions

No common exceptions. Authorization and input preparation are separate concerns with dedicated methods.

---

## Consequences Of Violation

Maintenance risks: authorization logic scattered across methods. Testing risks: authorization tests must work around input preparation. Security risks: non-standard authorization flow may be overlooked.

---

## Rule 5: Set Default Values for Optional Fields in prepareForValidation()

---

## Category

Design

---

## Rule

Use `prepareForValidation()` with `$this->merge()` to set default values for optional fields that may be absent from the request, ensuring validation rules receive predictable input.

---

## Reason

Optional fields absent from the request are not available to validation rules as `null` — they are simply missing. This causes some rules (e.g., `nullable|string`) to behave unexpectedly. Explicit defaults make validation behavior deterministic.

---

## Bad Example

```php
// When 'status' is absent, validation may not process it at all
'status' => ['nullable', 'string', 'in:draft,published,archived']
// Missing status is not validated — no error, no default
```

---

## Good Example

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'status' => $this->status ?? 'draft',
        'sort_order' => $this->sort_order ?? 0,
        'metadata' => $this->metadata ?? [],
    ]);
}

// Validation now always receives these fields with defaults
```

---

## Exceptions

When the absence of a field is semantically meaningful (distinguish between "false" and "not submitted"), do not set a default — use `nullable` and `present` rules instead.

---

## Consequences Of Violation

Reliability risks: validation behavior differs based on which fields are submitted. Data integrity risks: absent fields produce unexpected null values in database.

---

## Rule 6: Extract Raw Values Before Overwriting if Original Is Needed

---

## Category

Maintainability

---

## Rule

When `prepareForValidation()` overwrites a value via `merge()`, extract the original raw value to a property first if it is needed later for logging, auditing, or debugging.

---

## Reason

`merge()` overwrites the input data in the request's ParameterBag. The original raw value is lost. Without preservation, it becomes impossible to compare "what the user submitted" versus "what was validated," which is critical for audit trails and debugging malformed submissions.

---

## Bad Example

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->email)), // Original email lost
    ]);
}
```

---

## Good Example

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->email)),
        'email_original' => $this->email, // Preserve for logging/audit
    ]);
}
```

---

## Exceptions

When the original value contains sensitive data (passwords, secrets), do not preserve it. Use sanitized logging approaches instead.

---

## Consequences Of Violation

Audit risks: cannot trace user-submitted values vs normalized values. Debugging difficulty: lost original values hinder troubleshooting malformed input.
