# Input Preparation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** input-preparation, sanitization, defaults, prepareForValidation, laravel

## Executive Summary
Phase 2 covers the `prepareForValidation()` hook, input sanitization strategies, default value injection, type coercion, and pre-validation data transformation. This hook runs after authorization but before rule evaluation, making it the ideal place to normalize input before validation.

## Core Concepts

### prepareForValidation() Hook
Called **after** `authorize()` and **before** `rules()` is fully resolved:
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'slug' => Str::slug($this->input('title')),
    ]);
}
```

Any data merged here is available to `rules()` and is validated as if it came from the original request.

### Input Sanitization vs Validation
Sanitization (pre-validation) and validation serve different purposes:

| Concern | Timing | Goal |
|---|---|---|
| Sanitization | `prepareForValidation()` | Normalize input to validatable form |
| Validation | `rules()` | Assert normalized input meets constraints |

## Internal Mechanics

### Merge vs Replace
```php
// Merge — adds/overwrites specific keys while preserving others
$this->merge(['normalized_phone' => $this->normalizePhone($this->input('phone'))]);

// Replace — replaces entire input data
$this->replace(['only_this_key' => 'value']);
```

Use `merge()` for targeted additions. Use `replace()` only when completely rebuilding input.

### Accessing Input in prepareForValidation()
```php
protected function prepareForValidation(): void
{
    // $this->all() — all input data
    // $this->input('key') — single key (supports dot notation)
    // $this->json()->all() — JSON body only
    // $this->route('param') — route parameter
}
```

All standard `Request` methods are available. Note: `$this->all()` returns the merged state accumulated so far.

## Patterns

### Type Coercion
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN),
        'quantity' => (int) $this->input('quantity'),
        'price' => (float) $this->input('price'),
        'tags' => is_string($this->input('tags'))
            ? array_map('trim', explode(',', $this->input('tags')))
            : $this->input('tags'),
    ]);
}
```

### Default Value Injection
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'status' => $this->input('status', 'draft'),
        'locale' => $this->input('locale', app()->getLocale()),
        'currency' => $this->input('currency', 'USD'),
        'page' => (int) $this->input('page', 1),
        'per_page' => min((int) $this->input('per_page', 15), 100),
    ]);
}
```

### String Sanitization
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'phone' => preg_replace('/[^0-9]/', '', $this->input('phone')),
        'website' => rtrim($this->input('website'), '/'),
        'description' => strip_tags($this->input('description')),
    ]);
}
```

### JSON String to Array Conversion
```php
protected function prepareForValidation(): void
{
    $metadata = $this->input('metadata');

    if (is_string($metadata)) {
        $this->merge([
            'metadata' => json_decode($metadata, true) ?? [],
        ]);
    }
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| prepareForValidation() over controller sanitization | Keeps sanitization close to validation rules | Controller — duplicates concern across methods |
| merge() over replace() | Preserves existing input; additive | replace() — destructive, loses data |
| Type coercion in preparation | Validator receives typed data; fewer rule failures | Validate raw, then coerce — two-step |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Pre-validation sanitization | Rules work on clean, predictable input | Hidden transformation; debugger must check both input and merged data |
| Default injection | Reduces nullable handling in rules() | Defaults silently override missing input |
| Heavy preparation | Simplifies rules and DTO mapping | More code in request; may duplicate transformation logic |

## Performance Considerations
- `prepareForValidation()` runs once per request — negligible overhead.
- Avoid database queries in `prepareForValidation()` — they block validation.
- String operations (trim, regex) are fast — use freely.
- JSON decode operations on large strings may be slow — limit metadata field size.

## Production Considerations
- Log prepared data keys at debug level for troubleshooting.
- Do not remove original input keys — preserve them for audit trails.
- Document all transformations in the method body with clear names.
- Test `prepareForValidation()` thoroughly — it affects all downstream logic.

## Common Mistakes
- Using `prepareForValidation()` for side effects (DB writes, dispatching events) — belongs elsewhere.
- Mutating data that was already read by `authorize()` — authorized decisions may be invalidated.
- Forgetting to handle `null` input — `$this->input('key')` returns null if missing.
- Over-merging — merging many unrelated transformations makes the method hard to read.
- Type coercing without validation — `(int)` on non-numeric string produces 0.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Coercion produces unexpected value | Validates against wrong type | Use try/catch or type-check before coercion |
| Default masks missing required field | required rule passes with default | Set defaults only for optional fields |
| Sanitization removes valid data | Valid input rejected | Test sanitization against edge cases |
| merge() after validation() call | Merged data not in validated() | Only merge in prepareForValidation() |

## Ecosystem Usage

### Spatie Laravel Data Input Preparation
```php
class PostData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
    ) {}

    public static function prepareForPipeline(): array
    {
        return [
            static fn (self $data) => $data->withSlug(),
        ];
    }

    public function withSlug(): static
    {
        $this->slug = Str::slug($this->title);
        return $this;
    }
}
```

### Laravel Request Macros for Common Sanitization
```php
// AppServiceProvider::boot()
Request::macro('sanitizeEmail', function (string $key = 'email'): void {
    $this->merge([$key => strtolower(trim($this->input($key)))]);
});

// In prepareForValidation():
$this->sanitizeEmail();
$this->sanitizePhone('phone');
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class that hosts prepareForValidation().

### Related Topics
- **after-validation-hooks** — post-validation hooks that complement pre-validation.
- **conditional-validation-patterns** — how conditionals interact with prepared input.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — prepared input flowing to DTO.
- **dto-integration-todto-method** — toDto() receiving prepared validated data.

## Research Notes

### Source Analysis
In `Illuminate\Foundation\Http\FormRequest`, `prepareForValidation()` is called by `ValidatesWhenResolvedTrait` between `authorize()` and resolving `rules()`. The method has a `void` return type — all modifications are done via `$this->merge()` or `$this->replace()`.

### Key Insight
Input preparation creates a **normalization layer** between raw HTTP input and validation. This separation means rules() can assume clean, typed, consistent data — reducing rule complexity and eliminating duplicate sanitization across controllers.

### Version-Specific Notes
- Laravel 10: `prepareForValidation()` supports `void` return; old signature with `Validator` parameter deprecated.
- Laravel 11: No changes.
- PHP 8.2: `json_validate()` available for pre-validation JSON checking.
