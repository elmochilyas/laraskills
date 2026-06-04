# Manual Validator Creation — Rules

## Use FormRequests for HTTP, Validator::make() for Non-HTTP
---
## Category
Architecture | Framework Usage
---
## Rule
Use FormRequests for HTTP endpoint validation; use `Validator::make()` only for non-HTTP contexts — service layers, queued jobs, CLI commands, and API response validation.
---
## Reason
FormRequests provide lifecycle hooks (authorize, prepareForValidation, passedValidation) that are tightly coupled to the HTTP request lifecycle. Using `Validator::make()` for HTTP validation bypasses these hooks and duplicates functionality.
---
## Bad Example
```php
class PostController
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required'],
        ]);
        // Bypasses FormRequest lifecycle — no authorize(), no hooks
    }
}
```
---
## Good Example
```php
class PostController
{
    public function store(StorePostRequest $request): JsonResponse
    {
        // FormRequest handles validation lifecycle
    }
}
// Validator::make() reserved for non-HTTP use
```
---
## Exceptions
When a controller method validates data from multiple sources (request + DB + external) that cannot be expressed in a single FormRequest.
---
## Consequences Of Violation
Missing authorization checks; unused lifecycle hooks; inconsistent validation patterns across the codebase.

---

## Check passes() Before Calling validated()
---
## Category
Reliability | Framework Usage
---
## Rule
Always call `$validator->passes()` or `$validator->fails()` to check validation outcome before calling `$validator->validated()`.
---
## Reason
`validated()` throws a `ValidationException` if validation failed. Without a prior check, downstream code must catch the exception to handle validation failures gracefully.
---
## Bad Example
```php
$validator = Validator::make($data, $rules);
$validated = $validator->validated(); // Throws if validation fails
```
---
## Good Example
```php
$validator = Validator::make($data, $rules);
if ($validator->fails()) {
    throw new ValidationException($validator);
}
$validated = $validator->validated(); // Safe after fail check
```
---
## Exceptions
When throwing `ValidationException` immediately is the desired behavior — but prefer explicit `fails()` check for clarity.
---
## Consequences Of Violation
Unhandled `ValidationException` crashes in non-HTTP contexts (jobs, commands); missing error handling; silent 500 errors.

---

## Use ValidationException for Service-Layer Validation
---
## Category
Architecture | Maintainability
---
## Rule
Throw `Illuminate\Validation\ValidationException` from service-layer validation to maintain consistent error handling with FormRequests.
---
## Reason
`ValidationException` is the standard Laravel validation error mechanism. Throwing it from services allows the framework's exception handler and API error formatter to process validation errors uniformly.
---
## Bad Example
```php
// In PostService
if ($validator->fails()) {
    throw new \RuntimeException('Invalid data'); // Custom exception — inconsistent
}
```
---
## Good Example
```php
// In PostService
if ($validator->fails()) {
    throw new ValidationException($validator); // Framework standard
}
```
---
## Exceptions
Contexts where validation failure is not exceptional (e.g., polling for valid data) — return a `ValidationResult` object instead of throwing.
---
## Consequences Of Violation
Inconsistent error handling; service-layer validation bypasses the API error formatter; multiple exception types to catch.

---

## Create Fresh Validator Per Item in Batch Processing
---
## Category
Reliability | Framework Usage
---
## Rule
Create a new `Validator::make()` instance for each item in a batch/loop — validators are single-use and cache results after the first `passes()`/`fails()` call.
---
## Reason
A Validator instance caches validation results after the first assertion. Reusing the same validator across multiple items returns cached results from the first item's validation.
---
## Bad Example
```php
$validator = Validator::make([], $rules); // Single validator
foreach ($items as $item) {
    $validator->setData($item); // Does not reset cached results
    // passes() returns cached result from first item
}
```
---
## Good Example
```php
foreach ($items as $index => $item) {
    $validator = Validator::make($item, $rules); // Fresh per item
    if ($validator->passes()) {
        $valid[$index] = $validator->validated();
    }
}
```
---
## Exceptions
No common exceptions — always create a fresh `Validator` per validation context.
---
## Consequences Of Violation
Incorrect validation results in batch processing; valid items rejected or invalid items accepted.

---

## Catch ValidationException in Queued Jobs
---
## Category
Reliability
---
## Rule
Catch `ValidationException` inside queued job `handle()` methods and log the failure — never let it bubble up to the job worker.
---
## Reason
An uncaught `ValidationException` in a queued job causes the job to be released back to the queue and retried indefinitely, consuming worker resources and never making progress.
---
## Bad Example
```php
class ProcessPostJob implements ShouldQueue
{
    public function handle(): void
    {
        $validator = Validator::make($this->data, $rules);
        if ($validator->fails()) {
            throw new ValidationException($validator); // Retries forever
        }
    }
}
```
---
## Good Example
```php
public function handle(): void
{
    $validator = Validator::make($this->data, $rules);
    if ($validator->fails()) {
        Log::warning('Job validation failed', [
            'job' => static::class,
            'errors' => $validator->errors(),
        ]);
        $this->fail($validator->errors()); // Mark as failed, no retry
    }
}
```
---
## Exceptions
Jobs that should retry when data arrives (e.g., eventual consistency) may re-queue with delay instead of failing immediately.
---
## Consequences Of Violation
Infinite job retry loop; queue worker exhaustion; log flooding; delayed processing of legitimate jobs.

---

## Use Same Rule Arrays as FormRequests for Consistency
---
## Category
Maintainability
---
## Rule
When validating the same data in a service layer that is also validated by a FormRequest, reference the same rule arrays rather than duplicating them.
---
## Reason
Duplicated rules inevitably diverge — a change to the FormRequest may not be reflected in the service layer, creating an inconsistent validation surface.
---
## Bad Example
```php
// In StorePostRequest
'title' => ['required', 'string', 'max:255'];

// In PostService (duplicated — already outdated)
'title' => ['required', 'string']; // Missing max:255
```
---
## Good Example
```php
// Shared rule set
class PostRules
{
    public static function create(): array
    {
        return ['title' => ['required', 'string', 'max:255']];
    }
}
// Used by both FormRequest and service
```
---
## Exceptions
When service-layer validation has additional constraints not applicable to HTTP — append extra rules rather than duplicating existing ones.
---
## Consequences Of Violation
Rules diverge between HTTP and non-HTTP paths; regression in one path undetected.

---

## Return ValidationResult for Batch Processing
---
## Category
Testing | Maintainability
---
## Rule
Return a `ValidationResult` value object (with `passes`, `data`, `errors`) from service methods that perform batch validation, instead of returning booleans.
---
## Reason
A `ValidationResult` provides structured feedback about which items passed and failed, enabling the caller to handle partial success without catching exceptions or parsing error arrays.
---
## Bad Example
```php
public function validateBatch(array $items): bool
{
    foreach ($items as $item) {
        $v = Validator::make($item, $this->rules);
        if ($v->fails()) { return false; } // Loses which item failed
    }
    return true;
}
```
---
## Good Example
```php
public function validateBatch(array $items): ValidationResult
{
    $valid = []; $errors = [];
    foreach ($items as $i => $item) {
        $v = Validator::make($item, $this->rules);
        $v->passes()
            ? $valid[$i] = $v->validated()
            : $errors[$i] = $v->errors();
    }
    return new ValidationResult(
        passes: empty($errors), valid: $valid, errors: $errors
    );
}
```
---
## Exceptions
Simple single-item validation where a boolean return suffices.
---
## Consequences Of Violation
Lost error information; callers must re-validate to determine which items failed; inconsistent error handling patterns.
