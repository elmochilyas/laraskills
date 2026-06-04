# Custom Validation Rules — Rules

## Prefer Rule Classes over Closures for Reusable Logic
---
## Category
Maintainability | Code Organization
---
## Rule
Implement reusable validation logic as Rule classes (`php artisan make:rule`) rather than closures; reserve closures for trivial one-off checks that will never be reused.
---
## Reason
Rule classes are testable in isolation, injectable via constructor, serializable for route caching, and discoverable by filename — closures are inline, untestable, and cannot be shared.
---
## Bad Example
```php
'sku' => ['required', function ($attr, $value, $fail) {
    if (!preg_match('/^SKU-\d{6}$/', $value)) {
        $fail("Invalid SKU format.");
    }
}], // Cannot be reused, tested, or cached
```
---
## Good Example
```php
'sku' => ['required', new ValidSkuFormatRule],
```
---
## Exceptions
Single-endpoint validation that is trivially simple (e.g., a two-line regex check used in exactly one place) may use a closure, but extract to a Rule class when a second usage appears.
---
## Consequences Of Violation
Duplicate closure definitions across multiple FormRequests; validation logic that cannot be unit tested; route caching failures.

---

## Call $fail(), Never Return bool
---
## Category
Framework Usage | Reliability
---
## Rule
Call the `$fail` closure to reject a value inside `__invoke()`; never return a boolean from the rule method.
---
## Reason
Modern Laravel `ValidationRule` interface uses `$fail()` to halt validation for the attribute. Returning `bool` from a rule that implements the old `passes()` API produces no error — the value silently passes.
---
## Bad Example
```php
public function __invoke(string $attribute, mixed $value, Closure $fail): void
{
    if (!str_starts_with($value, 'SKU-')) {
        return false; // No error generated — value passes
    }
}
```
---
## Good Example
```php
public function __invoke(string $attribute, mixed $value, Closure $fail): void
{
    if (!str_starts_with($value, 'SKU-')) {
        $fail("The {$attribute} must start with 'SKU-'.");
    }
}
```
---
## Exceptions
No common exceptions — this is a mandatory interface contract.
---
## Consequences Of Violation
Invalid data silently passes validation; security constraints are not enforced; production data corruption.

---

## Inject Dependencies via Constructor, Never Inject the Request
---
## Category
Architecture | Testing
---
## Rule
Accept external dependencies (repositories, services) through the Rule class constructor; never inject the HTTP `Request` or FormRequest object.
---
## Reason
Injecting the Request couples the Rule to the HTTP layer, making it unusable in non-HTTP contexts (jobs, commands, service-layer validation) and untestable without mocking the entire HTTP stack.
---
## Bad Example
```php
class UniqueSkuRule implements ValidationRule
{
    public function __construct(private Request $request) {} // HTTP coupling
    public function __invoke(...): void { ... }
}
```
---
## Good Example
```php
class UniqueSkuRule implements ValidationRule
{
    public function __construct(
        private SkuRepository $skus,
        private ?int $ignoreId = null,
    ) {}
    public function __invoke(...): void { ... }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Rule unusable in queue jobs, CLI commands, and service layers; brittle tests that require HTTP environment setup.

---

## Keep Rules Stateless — No Instance Properties Across Invocations
---
## Category
Reliability | Framework Usage
---
## Rule
Never store per-validation state in Rule class instance properties; `__invoke()` may be called multiple times on the same instance during a single validation pass.
---
## Reason
Laravel reuses Rule class instances for multiple attribute validations within the same `Validator::make()` call. Stateful properties leak between calls, producing false validation results.
---
## Bad Example
```php
class MaxItemsRule implements ValidationRule
{
    private int $count = 0;
    public function __invoke(...): void
    {
        $this->count++; // Leaks across calls
        if ($this->count > 5) { $fail("Too many."); }
    }
}
```
---
## Good Example
```php
class MaxItemsRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        // Stateless — all state is local
        if (is_array($value) && count($value) > 5) {
            $fail("Too many items.");
        }
    }
}
```
---
## Exceptions
Constructor-initialized, immutable properties that do not change between invocations (cached configuration, pre-fetched data).
---
## Consequences Of Violation
Intermittent validation failures; incorrect behavior that varies by field order; impossible-to-debug state leaks.

---

## Batch Expensive Operations in Constructor, Not __invoke()
---
## Category
Performance
---
## Rule
Fetch database results or external API data once in the rule's constructor and cache them; never query the database inside `__invoke()`.
---
## Reason
`__invoke()` may be called dozens or hundreds of times per validation (e.g., for each item in a bulk array). Repeated DB queries inside `__invoke()` cause N+1 query explosions.
---
## Bad Example
```php
public function __invoke(string $attribute, mixed $value, Closure $fail): void
{
    $exists = DB::table('skus')->where('sku', $value)->exists(); // N+1
    if ($exists) { $fail("SKU in use."); }
}
```
---
## Good Example
```php
public function __construct(
    private SkuRepository $skus,
    private ?int $ignoreId = null,
) {
    $this->existingSkus = $this->skus->all(); // Batched once
}
```
---
## Exceptions
Simple `exists` or `unique` checks against indexed columns where the database query is fast and the rule is used for single-field, single-item validation (not bulk).
---
## Consequences Of Violation
N+1 query problems in bulk validation endpoints; slow response times; unnecessary database load.

---

## Name Rules After the Constraint, Not the Field
---
## Category
Maintainability | Code Organization
---
## Rule
Name Rule classes after the validation constraint they enforce (e.g., `ValidCurrencyRule`, `StartBeforeEndRule`), not the field they validate (e.g., `EmailRule`).
---
## Reason
A rule named `EmailRule` suggests it validates email addresses, but the built-in `email` rule already does that. Rule names should describe the custom constraint, making their purpose obvious and reusable across any field.
---
## Bad Example
```php
class SkuRule {} // Vague — what constraint?
class EmailRule {} // Ambiguous with built-in 'email'
```
---
## Good Example
```php
class ValidSkuFormatRule {}   // Constraint: SKU format
class UniqueSkuInTenantRule {} // Constraint: uniqueness within tenant
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Naming collisions with built-in rules; confusion about rule purpose; difficulty discovering reusable rules across the codebase.

---

## Never Throw Exceptions Inside Rules — Use $fail()
---
## Category
Reliability | Framework Usage
---
## Rule
Call `$fail()` to report invalid values; never throw exceptions inside `__invoke()`.
---
## Reason
Throwing an exception inside a rule bypasses the validation error system, producing a `ValidationException` with no field-specific errors instead of a proper field-level error message.
---
## Bad Example
```php
public function __invoke(...): void
{
    if (!str_starts_with($value, 'SKU-')) {
        throw new \InvalidArgumentException("Invalid SKU"); // Wrong — breaks validation
    }
}
```
---
## Good Example
```php
public function __invoke(...): void
{
    if (!str_starts_with($value, 'SKU-')) {
        $fail("The {$attribute} must start with 'SKU-'.");
    }
}
```
---
## Exceptions
Infrastructure errors (database connection failure, external service timeout) should throw and be caught at the controller level — these are not validation failures.
---
## Consequences Of Violation
ValidationException without field error messages; generic 422 response with no actionable information for clients.
