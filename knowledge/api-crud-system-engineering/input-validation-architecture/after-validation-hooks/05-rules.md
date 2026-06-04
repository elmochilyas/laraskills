# After Validation Hooks — Rules

## Keep passedValidation() Side-Effect Free
---
## Category
Maintainability | Reliability
---
## Rule
Never perform database writes, job dispatches, or external API calls with side effects inside `passedValidation()`.
---
## Reason
Validation runs in the request lifecycle before the controller; side effects may commit data even when the controller subsequently fails, causing partial state.
---
## Bad Example
```php
protected function passedValidation(): void
{
    Log::info('User created');
    UserMeta::create(['user_id' => $this->user()->id]); // DB write in validation
}
```
---
## Good Example
```php
protected function passedValidation(): void
{
    $this->merge([
        'total' => $this->input('quantity') * $this->input('price'),
        'slug' => Str::slug($this->input('title')),
    ]);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Data inconsistency, partial writes, hard-to-debug side effects that execute even on failed controller logic.

---

## Check errors()->isEmpty() in after() Callbacks
---
## Category
Reliability | Framework Usage
---
## Rule
Always guard `Validator::after()` callbacks with `$validator->errors()->isEmpty()` before adding new errors.
---
## Reason
In Laravel 10+, `after()` callbacks run even when primary validation fails; adding errors to an already-failing validator produces confusing, redundant error messages.
---
## Bad Example
```php
$validator->after(function ($validator) {
    if ($this->input('start_date') > $this->input('end_date')) {
        $validator->errors()->add('start_date', 'Start must be before end.');
    }
});
```
---
## Good Example
```php
$validator->after(function ($validator) {
    if ($validator->errors()->isNotEmpty()) {
        return;
    }
    if ($this->input('start_date') > $this->input('end_date')) {
        $validator->errors()->add('start_date', 'Start must be before end.');
    }
});
```
---
## Exceptions
When implementing cross-field validation that should always produce specific errors regardless of other failures.
---
## Consequences Of Violation
Duplicate or misleading error messages, confusing API consumers with noise from both field-level and cross-field failures.

---

## Use passedValidation() for Data, after() for Cross-Field Checks
---
## Category
Architecture | Code Organization
---
## Rule
Use `passedValidation()` for in-memory data transformations and derived computations; use `Validator::after()` for cross-field or external-service validation that may reject the request.
---
## Reason
These hooks serve different purposes — `passedValidation()` cannot reject the request, while `after()` can add errors. Mixing them creates lifecycle confusion and makes validation flow unpredictable.
---
## Bad Example
```php
protected function passedValidation(): void
{
    // Cross-field check in passedValidation (cannot reject here)
    if ($this->input('start') > $this->input('end')) {
        // Can't add error — only merge works
    }
}
```
---
## Good Example
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->input('start_date') > $this->input('end_date')) {
            $validator->errors()->add('start_date', 'Start must be before end.');
        }
    });
}

protected function passedValidation(): void
{
    $this->merge(['total' => $this->input('qty') * $this->input('price')]);
}
```
---
## Exceptions
When using `after()` with a computed value that was set in `passedValidation()` — ensure the computation occurs first.
---
## Consequences Of Violation
Inability to reject requests from `passedValidation()`, mixing transformation and validation concerns in a single hook.

---

## Wrap External Service Calls in after() With try/catch
---
## Category
Reliability | Security
---
## Rule
Always wrap external HTTP calls inside `Validator::after()` callbacks in try/catch blocks and set explicit timeouts.
---
## Reason
A failing external fraud check, blacklist, or verification service should degrade gracefully with a logged warning, not crash the endpoint with a 500 error.
---
## Bad Example
```php
$validator->after(function ($validator) {
    $response = Http::post('https://fraud.example.com/check', [...]);
    if ($response->json('risk_score') > 80) {
        $validator->errors()->add('email', 'Flagged.');
    }
});
```
---
## Good Example
```php
$validator->after(function ($validator) {
    try {
        $response = Http::timeout(3)->post('https://fraud.example.com/check', [...]);
        if ($response->json('risk_score') > 80) {
            $validator->errors()->add('email', 'Flagged.');
        }
    } catch (\Throwable $e) {
        Log::warning('Fraud check failed', ['error' => $e->getMessage()]);
    }
});
```
---
## Exceptions
When the external service is internal (same datacenter, known reliability) and the business requires hard failure.
---
## Consequences Of Violation
Downstream service outages cascade into API 500 errors; missing timeouts block the request queue indefinitely.

---

## Merge New Keys, Never Overwrite Validated Keys
---
## Category
Maintainability | Reliability
---
## Rule
Use `$this->merge()` to add new computed keys; never overwrite keys that were already validated by the rules.
---
## Reason
Overwriting a validated key changes data that passed validation without re-validating the new value, breaking the validation contract and potentially introducing invalid data.
---
## Bad Example
```php
protected function passedValidation(): void
{
    $this->merge([
        'email' => strtolower($this->input('email')), // Overwrites validated email
    ]);
}
```
---
## Good Example
```php
protected function passedValidation(): void
{
    $this->merge([
        'normalized_email' => strtolower($this->input('email')), // New key
        'slug' => Str::slug($this->input('title')),
    ]);
}
```
---
## Exceptions
When the transformation is a pure normalization (lowercase, trim) and the validation rules would also pass for the normalized value, you may overwrite — but prefer new keys for auditability.
---
## Consequences Of Violation
Validated data silently diverges from what the rules actually checked; downstream code receives values that never passed validation.

---

## Set Short Timeouts on External Calls in after()
---
## Category
Performance | Reliability
---
## Rule
Set explicit 2–3 second timeouts on any external HTTP call made inside `Validator::after()` callbacks.
---
## Reason
`after()` callbacks run synchronously during validation; slow or hanging external calls block the entire request response, degrading API throughput under load.
---
## Bad Example
```php
$validator->after(function ($validator) {
    $response = Http::post('https://service.example.com/verify', [...]); // No timeout
});
```
---
## Good Example
```php
$validator->after(function ($validator) {
    $response = Http::timeout(3)->post('https://service.example.com/verify', [...]);
});
```
---
## Exceptions
Internal services on the same network with guaranteed sub-second response times may use longer timeouts, but always set one explicitly.
---
## Consequences Of Violation
API endpoints hang indefinitely when external services are slow; connection pool exhaustion under load; poor P99 latency.
