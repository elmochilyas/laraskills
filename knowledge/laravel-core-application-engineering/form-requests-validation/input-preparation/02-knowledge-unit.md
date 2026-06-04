# Input Preparation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Input Preparation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Input preparation in FormRequests normalizes, sanitizes, and enriches request data before validation rules execute. The primary hook is `prepareForValidation()`, which fires as the first step in the validation pipeline — before authorization and before rules. A secondary hook, `passedValidation()`, fires after successful validation for post-processing validated data. The `merge()` method on the underlying Request class provides the mechanism for adding or overriding data in the validation input.

---

## Core Concepts

### prepareForValidation() Timing

The hook fires first in the pipeline:

```
prepareForValidation() → passesAuthorization() → getValidatorInstance() → fails() → passedValidation()
```

Because it runs before authorization AND before validation, `prepareForValidation()` is safe for:
- Type coercion (string to boolean, comma-separated to array)
- Default value injection
- Field normalization (trimming, case formatting)
- Computed field addition (slugs, hashes, timestamps)

It is NOT safe for:
- Database-dependent transformations (user data not yet resolved)
- Authorization checks (use `authorize()`)

### merge() Mechanics

The Request's `merge()` method mutates the internal `$this->request` ParameterBag:

```php
$this->merge(['normalized_field' => strtolower($this->input('field'))]);
```

This affects `$this->all()`, which is the default source for `validationData()`. The merged data is visible to validation rules and to the controller (if using `$request->input()` after resolution).

---

## Mental Models

### The Pre-Validation Workbench

`prepareForValidation()` is the workbench where raw HTTP input is shaped into validation-ready data. Think of it as the arrival hall: raw data enters in various formats (checkbox strings, comma-separated lists, null strings) and exits in normalized, predictable types. The validation rules that follow operate on clean, predictable data because the workbench has already processed the raw input.

### The One-Way Transformation

Data transformations in `prepareForValidation()` are one-way — once merged, the original raw input is overwritten. This is intentional: if a field needs to be available in its raw form later (e.g., for logging), extract the raw value to a separate property before merging. The mental model is "normalize before validate" — the controller and service layer should never see the raw, unnormalized input.

---

## Internal Mechanics

### prepareForValidation() in the Pipeline

From `ValidatesWhenResolvedTrait`:

```php
public function validateResolved()
{
    $this->prepareForValidation();

    if (! $this->passesAuthorization()) {
        $this->failedAuthorization();
    }

    $instance = $this->getValidatorInstance();
    // ...
}
```

The trait calls `$this->prepareForValidation()` as a no-op by default:

```php
protected function prepareForValidation()
{
    //
}
```

The FormRequest class does NOT override this method — it relies on the trait's default.

### merge() with validationData()

`validationData()` returns the data that the validator sees:

```php
public function validationData()
{
    return $this->all();  // Returns mutated request data
}
```

All `merge()` calls before validation run affect the validator's input. `replace()` overwrites the entire ParameterBag; `merge()` adds individual keys.

### passedValidation() for Post-Validation

```php
protected function passedValidation()
{
    $this->replace(['safe_data' => $this->safe()->only(['allowed_field'])]);
}
```

This fires after validation passes. The validator has already read the data, so modifying `$this->request` at this point does not affect the validated result. Use `passedValidation()` for logging, not data transformation.

---

## Patterns

### Type Coercion

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN),
        'tags' => is_string($this->tags)
            ? array_map('trim', explode(',', $this->tags))
            : $this->tags,
        'amount' => (float) $this->amount,
    ]);
}
```

Converts form-string booleans and comma-separated strings to native PHP types before validation sees them.

### Default Value Injection

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'status' => $this->status ?? 'draft',
        'sort_order' => $this->sort_order ?? 0,
        'metadata' => $this->metadata ?? [],
    ]);
}
```

Ensures validation rules like `'status' => 'required|in:draft,published'` receive a value even when the client omits the field.

### Slug/Identifier Generation

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->title),
    ]);
}
```

Computed fields that depend on other input values should be generated here, not in the rules or controller.

### Sanitization with SanitizesInputs Trait

For teams that prefer a dedicated trait:

```php
trait SanitizesInputs
{
    protected function sanitize(array $fields): void
    {
        foreach ($fields as $field => $sanitizer) {
            if ($this->has($field)) {
                $this->merge([
                    $field => $sanitizer($this->input($field)),
                ]);
            }
        }
    }
}

class StorePostRequest extends FormRequest
{
    use SanitizesInputs;

    protected function prepareForValidation(): void
    {
        $this->sanitize([
            'title' => fn ($v) => strip_tags($v),
            'body' => fn ($v) => clean($v, 'basic_html'),
        ]);
    }
}
```

---

## Architectural Decisions

### prepareForValidation() vs Controller Normalization

| | Request Layer | Controller Layer |
|--|--------------|------------------|
| Visibility | All consumers of request | Single action |
| Testability | FormRequest test | Controller test |
| DRY | Shared across actions | Per-action |
| Coupling | Tighter to HTTP format | Cleaner separation |

Normalize in the request layer if the transformation is input-format specific (e.g., checkbox → boolean). Transform in the controller/service layer if the logic is business-specific (e.g., calculating derived values).

### No Database Queries Rule

`prepareForValidation()` runs before authorization. Database queries here waste resources if the user is unauthorized. The exception is lookups that affect validation itself (e.g., loading a related record's configuration), but even these should be deferred to `withValidator()` where possible.

---

## Tradeoffs

### prepareForValidation() vs Custom ValidationData Override

`prepareForValidation()` mutates the request data in-place via `merge()`, making the transformed data visible to both validation and the controller. Overriding `validationData()` returns a transformed copy without mutating the original request. The tradeoff is visibility — `prepareForValidation()` changes affect all downstream consumers, while `validationData()` only affects the validator. Use `prepareForValidation()` when the normalized values should persist to the controller. Use `validationData()` override when you want the request instance to retain the original raw input for logging or debugging.

### Input Normalization vs Business Logic Transformation

Normalizing input format (string to boolean, comma-separated to array) is an HTTP concern that belongs in the FormRequest. Computing derived business values (totals, discounts, statuses) is a domain concern that belongs in the service layer. The tradeoff is determining the boundary — normalizing too much in the FormRequest creates coupling between the HTTP layer and business logic, while normalizing too little forces every service to handle raw HTTP formats.

## Performance Considerations

### String Operations Overhead

`prepareForValidation()` runs on every request for every FormRequest that defines it. String operations (`trim`, `explode`, `strtolower`) are negligible at the individual level. However, if `prepareForValidation()` iterates over a large array of items performing per-item transformations, the cumulative cost can affect response times. Profile endpoints with array-heavy input to identify normalization bottlenecks.

### Database Queries in Preparation

Database queries in `prepareForValidation()` run before authorization and before validation. For endpoints where most requests fail validation, these queries are wasted. A query that loads user preferences in `prepareForValidation()` runs even for completely invalid input that will be rejected immediately.

---

## Production Considerations

### Transformation Error Handling

If `prepareForValidation()` throws an exception (e.g., invalid JSON parsing, failed type cast), the user sees a 500 error with no validation feedback. In production, wrap transformation logic in try/catch and use `$this->merge()` with safe defaults when parsing fails. Log the error internally but never expose parsing failures in the exception response.

### Data Consistency Between Validation and Controller

In production, the controller must use `validated()` or `safe()` to read the prepared data. If the controller reads directly from `$request->input()`, it may receive data that was transformed by `prepareForValidation()`, but this bypasses the validation guarantee. Enforce a team convention that all FormRequest data consumption goes through `validated()`.

---

## Common Mistakes

### Overwriting Validated Data in passedValidation()

```php
protected function passedValidation(): void
{
    // WRONG — does not affect the validated data returned by validated()
    $this->merge(['secret' => encrypt($this->secret)]);
}
```

`validated()` reads from the validator's internal state, which has already been computed. `merge()` after validation affects `$request->all()` but not `$request->validated()`. Use `prepareForValidation()` for data that must appear in validated output.

### Side Effects in prepareForValidation()

```php
protected function prepareForValidation(): void
{
    // WRONG — logging side effect before validation
    Log::info('Preparing validation', $this->all());

    // WRONG — API call that can fail
    $this->merge(['geo' => GeoIP::locate($this->ip())]);
}
```

`prepareForValidation()` runs before validation. If it throws, the user sees a 500 with no validation feedback. Keep it side-effect-free.

### Assuming Input Exists

```php
protected function prepareForValidation(): void
{
    $this->merge(['slug' => Str::slug($this->title)]);
    // If 'title' is missing, slug becomes empty string, rules still run
}
```

Guard against missing input — the preparation runs before required validation checks.

---

## Failure Modes

### Merge After Replace

`$this->merge(['key' => 'value'])` after `$this->replace(['other' => 'data'])` — merge adds to, replace overwrites entirely. Order matters. Use `replace()` only when you intend to discard all original input.

### Nested Array Merging

`$this->merge(['nested' => ['key' => 'value']])` — if the request already has `nested` values, merge overwrites the entire nested array, not individual keys. Use `array_merge` manually for deep merges.

---

## Ecosystem Usage

### Laravel Nova

Nova's resource creation forms use `prepareForValidation()` extensively to normalize field values before validation. File upload fields are transformed from raw upload objects to file paths. Boolean fields from checkboxes are normalized from "on"/"off" strings to native booleans. This normalization ensures Nova's validation rules receive consistently typed data regardless of the frontend format.

### Laravel Jetstream

Jetstream's profile update FormRequests use `prepareForValidation()` to strip timezone information from date inputs before validation, ensuring consistent date-only comparisons. The team invitation flow normalizes email addresses to lowercase before validation to prevent case-sensitivity issues with the unique email check.

### Laravel Spark

Spark's billing FormRequests normalize monetary values in `prepareForValidation()` — converting user-facing formatted amounts ($1,234.56) to integer cents (123456) before validation. This normalization allows Spark's validation rules to compare amounts as integers rather than parsing formatted strings.

---

## Related Knowledge Units

- **After Validation Hooks** (this subdomain) — passedValidation() and failedValidation()
- **Form Request Fundamentals** (this subdomain) — the validation pipeline and timing
- **Form Request DTO Integration** (this subdomain) — preparing data for DTO construction

---

## Research Notes

### merge() vs replace() Behavior

`$this->merge(['key' => 'value'])` calls `$this->request->add()` on the underlying ParameterBag, which adds or overwrites individual keys. `$this->replace(['key' => 'value'])` calls `$this->request->replace()`, which replaces the ENTIRE ParameterBag content. Using `replace()` in `prepareForValidation()` destroys all original request data — only use it when you intend to completely reconstruct the input.

### Future Direction — Declarative Normalization

Future Laravel versions could introduce declarative input normalization via PHP 8 attributes, such as `#[Trim]`, `#[Cast('boolean')]`, or `#[Default('draft')]` on FormRequest methods. This would eliminate the manual `merge()` boilerplate in `prepareForValidation()` and make normalization rules visible as metadata on the request class.

### Framework Source Reference
- `Illuminate\Http\Request::merge()` — ParameterBag mutation
- `Illuminate\Http\Request::replace()` — ParameterBag replacement
- `Illuminate\Foundation\Http\FormRequest::validationData()` — data source for validator
- `Symfony\Component\HttpFoundation\ParameterBag` — underlying data store
