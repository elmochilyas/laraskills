# Input Preparation — Rules

## Use merge() Over replace()
---
## Category
Maintainability | Framework Usage
---
## Rule
Use `$this->merge()` for targeted input modifications in `prepareForValidation()` — never use `$this->replace()`.
---
## Reason
`merge()` adds or overwrites specific keys while preserving the rest of the input. `replace()` destroys the entire input array, losing data that other hooks or the controller may need.
---
## Bad Example
```php
protected function prepareForValidation(): void
{
    $this->replace(['email' => strtolower($this->input('email'))]);
    // All other input keys lost
}
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
    ]);
    // Other keys preserved
}
```
---
## Exceptions
No common exceptions — always prefer `merge()`.
---
## Consequences Of Violation
Original input data silently discarded; downstream code receives incomplete data; difficult-to-debug missing field issues.

---

## Keep Transformations Focused
---
## Category
Maintainability | Code Organization
---
## Rule
Group related transformations into distinct `merge()` calls or extract complex logic to named helper methods — keep `prepareForValidation()` readable.
---
## Reason
A single `merge()` call with 10 unrelated transformations is hard to read, test, and debug. When one transformation fails, it is unclear which line caused the problem.
---
## Bad Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'phone' => preg_replace('/[^0-9]/', '', $this->input('phone')),
        'slug' => Str::slug($this->input('title')),
        'quantity' => (int) $this->input('quantity', 1),
        'page' => max(1, (int) $this->input('page', 1)),
        'per_page' => min(max(1, (int) $this->input('per_page', 15)), 100),
        'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN),
    ]);
}
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge(['email' => $this->sanitizeEmail($this->input('email'))]);
    $this->merge(['phone' => $this->sanitizePhone($this->input('phone'))]);
    $this->merge(['slug' => Str::slug($this->input('title'))]);
    $this->mergePaginationDefaults();
}

private function sanitizeEmail(?string $email): ?string
{
    return $email ? strtolower(trim($email)) : null;
}
```
---
## Exceptions
Simple one-line coercions like `(int)` or `trim` do not require extraction — use judgment based on total complexity.
---
## Consequences Of Violation
Unreadable `prepareForValidation()`; difficult to test individual transformations; high cognitive load when modifying pre-validation logic.

---

## Never Perform Side Effects in prepareForValidation()
---
## Category
Reliability | Security
---
## Rule
Do not perform database writes, job dispatches, API calls, or any I/O operations inside `prepareForValidation()`.
---
## Reason
`prepareForValidation()` runs before validation rules execute. If validation fails, side effects already occurred but the request is rejected — producing irreversible partial state.
---
## Bad Example
```php
protected function prepareForValidation(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
    Post::where('id', $this->input('id'))->increment('views'); // DB write before validation
}
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
}
// DB writes in controller or service layer after validation
```
---
## Exceptions
No common exceptions — `prepareForValidation()` is for sanitization, coercion, and defaults only.
---
## Consequences Of Violation
Partial database state on validation failure; irreversible operations triggered by invalid requests; debugging nightmare.

---

## Type-Coerce Before Validation
---
## Category
Framework Usage | Reliability
---
## Rule
Coerce input types (string to int, string to boolean) inside `prepareForValidation()` before the validator evaluates rules.
---
## Reason
Laravel validation rules like `integer` or `boolean` fail when input arrives as strings (common in JSON APIs). Type coercion before validation ensures rules evaluate against the correct types.
---
## Bad Example
```php
// Input: {"quantity": "5", "is_active": "true"}
// Rules fail because values are strings
'quantity' => ['required', 'integer', 'min:1'],
'is_active' => ['required', 'boolean'],
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'quantity' => (int) $this->input('quantity', 1),
        'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN),
    ]);
}
```
---
## Exceptions
No common exceptions — always coerce types when the input source may deliver strings for typed fields.
---
## Consequences Of Violation
Valid requests rejected because of type mismatch; fragile client-side workarounds; inconsistent validation between JSON and form-data.

---

## Handle Null Input Gracefully
---
## Category
Reliability
---
## Rule
Assume any input field may be `null` and handle it gracefully in `prepareForValidation()` using defaults or explicit null checks.
---
## Reason
`$this->input('key')` returns `null` when the field is absent. Without null-safe operations, calling `strtolower(null)` or `(int) null` produces unexpected results or type errors.
---
## Bad Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower($this->input('email')), // TypeError if null
    ]);
}
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => $this->input('email')
            ? strtolower($this->input('email'))
            : null,
        'quantity' => (int) $this->input('quantity', 1),
    ]);
}
```
---
## Exceptions
Fields that are always required and validated as such may skip null checks, but defense-in-depth is recommended.
---
## Consequences Of Violation
TypeError 500 errors on nullable fields; `(int) null` producing 0 silently; data corruption from unexpected type coercion.

---

## Don't Modify Data Used in authorize()
---
## Category
Security
---
## Rule
Never modify input values in `prepareForValidation()` that the `authorize()` method already inspected for authorization decisions.
---
## Reason
`authorize()` runs before `prepareForValidation()`. If `authorize()` used a field value to make an access decision, changing that value in `prepareForValidation()` invalidates the authorization check.
---
## Bad Example
```php
public function authorize(): bool
{
    return $this->input('role') === 'admin'; // Used role for auth decision
}

protected function prepareForValidation(): void
{
    $this->merge(['role' => 'user']); // Changed role — auth now invalid
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
    $this->merge(['slug' => Str::slug($this->input('title'))]); // Not used in auth
}
```
---
## Exceptions
No common exceptions — authorization decisions must be based on data that is not later modified.
---
## Consequences Of Violation
Authorization bypass via input manipulation; privilege escalation; security audit finds exploitable endpoint.

---

## Preserve Original Input Keys for Audit Trails
---
## Category
Security | Maintainability
---
## Rule
When transforming a value in `prepareForValidation()`, preserve the original value under a different key for audit trail purposes.
---
## Reason
Overwriting the original value loses the ability to trace back to what the user actually submitted. Audit trails and debugging often require comparing the original input with the sanitized output.
---
## Bad Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))), // Original lost
    ]);
}
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email_original' => $this->input('email'),
        'email' => strtolower(trim($this->input('email'))),
    ]);
}
```
---
## Exceptions
When the transformation is idempotent (e.g., `trim`) preservation is optional but still recommended.
---
## Consequences Of Violation
Cannot audit original user input; difficult to debug sanitization issues; compliance gaps for data integrity requirements.
