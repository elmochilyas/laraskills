# Input Preparation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** input-preparation, sanitization, testing, security, production

## Executive Summary
Phase 3 covers testing input preparation logic, security sanitization patterns (XSS prevention, SQL injection safe-guarding), integration with DTOs, production monitoring for transformation errors, and patterns for handling file uploads and multipart data preparation.

## Core Concepts

### Defense in Depth via Sanitization
Input preparation is the first layer of defense against malformed or malicious input. While validation rejects invalid data, sanitization should normalize data to a safe baseline before validation rules evaluate it.

### Deterministic Preparation
`prepareForValidation()` must be **deterministic** — given the same input, it must always produce the same prepared output. Non-deterministic operations (random generation, timestamps) belong in `passedValidation()` instead.

## Internal Mechanics

### Security Sanitization Pipeline
```php
protected function prepareForValidation(): void
{
    // Layer 1: Trim whitespace
    $this->trimStrings(['name', 'email', 'description']);

    // Layer 2: Strip dangerous characters
    $this->merge([
        'name' => strip_tags($this->input('name')),
        'description' => strip_tags($this->input('description')),
    ]);

    // Layer 3: Normalize encoding
    $this->merge([
        'email' => normalizer_normalize($this->input('email'), Normalizer::FORM_C),
    ]);

    // Layer 4: Type coercion
    $this->merge([
        'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
    ]);
}
```

### Null Handling Strategy
```php
protected function prepareForValidation(): void
{
    // Convert empty strings to null for nullable fields
    foreach (['phone', 'company', 'bio'] as $field) {
        if ($this->has($field) && $this->input($field) === '') {
            $this->merge([$field => null]);
        }
    }
}
```

## Patterns

### Testing prepareForValidation() in Isolation
```php
public function test_prepare_for_validation_trims_email(): void
{
    $request = new StoreUserRequest([], [
        'email' => '  USER@EXAMPLE.COM  ',
        'name' => 'John Doe',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->prepareForValidation();

    $this->assertEquals('user@example.com', $request->input('email'));
}

public function test_prepare_for_validation_coerces_boolean(): void
{
    $request = new StorePostRequest([], [
        'title' => 'Test',
        'is_published' => 'true',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->prepareForValidation();

    $this->assertTrue($request->input('is_published'));
}

public function test_prepare_for_validation_sets_defaults(): void
{
    $request = new IndexPostsRequest([], [], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->prepareForValidation();

    $this->assertEquals(1, $request->input('page'));
    $this->assertEquals(15, $request->input('per_page'));
    $this->assertEquals('created_at', $request->input('sort'));
}

public function test_empty_string_converted_to_null(): void
{
    $request = new UpdateProfileRequest([], [
        'bio' => '',
        'phone' => '',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->prepareForValidation();

    $this->assertNull($request->input('bio'));
    $this->assertNull($request->input('phone'));
}
```

### File Upload Preparation
```php
protected function prepareForValidation(): void
{
    if ($this->hasFile('avatar')) {
        $file = $this->file('avatar');

        // Validate mime type early before rules()
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes, true)) {
            return; // Let rules() handle the error
        }

        $this->merge([
            'avatar_path' => $file->getRealPath(),
            'avatar_size' => $file->getSize(),
            'avatar_mime' => $file->getMimeType(),
        ]);
    }
}
```

### JSON:API Data Normalization
```php
protected function prepareForValidation(): void
{
    $data = $this->input('data');

    if (is_array($data)) {
        // Flatten JSON:API data.attributes into top-level keys for simpler rules()
        if (isset($data['attributes']) && is_array($data['attributes'])) {
            foreach ($data['attributes'] as $key => $value) {
                $this->merge(["data.attributes.{$key}" => $value]);
            }
        }

        // Normalize relationship IDs
        if (isset($data['relationships'])) {
            $this->merge([
                'relationships' => $this->normalizeRelationships($data['relationships']),
            ]);
        }
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Multi-layer sanitization pipeline | Each layer handles one concern; easy to test and modify |
| Empty-string-to-null conversion | Simplifies nullable field rules; consistent null handling |
| FIle preparation in prepareForValidation() | Early read of file metadata before validation |
| Input preserving original data | Audit trail and debugging access to raw input |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Heavy sanitization | Predictable, clean input for all downstream code | Performance overhead per request |
| Raw input preservation | Debugging and audit trail | Duplicate data in memory |
| Default injection | Reduces controller boilerplate | Silent input masking if overused |

## Performance Considerations
- String operations are fast — 50+ sanitizations add ~1ms.
- File operations (getSize, getMimeType) are filesystem calls — cache if needed.
- `normalizer_normalize()` is CPU-intensive — use only for user-supplied text.
- `strip_tags()` with long strings is O(n) — acceptable for typical input sizes.

## Production Considerations
- Log sanitization warnings when input contains stripped tags or characters.
- Do not sanitize passwords, tokens, or secrets — preserve exact input.
- Test all sanitization paths against known XSS and injection vectors.
- Document the sanitization pipeline in the request class docblock.

## Common Mistakes
- Sanitizing HTML in API requests that accept rich text (use validation rules instead).
- Converting falsy values (0, '0', false) to null — breaks boolean and numeric validation.
- Modifying input after `validated()` has been called — data inconsistency.
- Using `strip_tags()` on all string fields — may strip legitimate content.
- Assuming `prepareForValidation()` runs before every `rules()` call — it runs once.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Over-sanitization destroys valid input | Valid data rejected downstream | Test sanitization with boundary values |
| Sanitization throws exception | 500 error before validation | Wrap in try/catch; log and throw with context |
| Encoding mismatch after normalization | Validation rejects due to encoding | Normalize before comparison rules |
| File not found after preparation | Rules fail on file path | Check file existence before merging path |

## Ecosystem Usage

### Laravel Built-in String Trimming
```php
// AppServiceProvider::boot()
Request::macro('trimStrings', function (array $keys = []): void {
    foreach ($keys as $key) {
        if ($this->has($key) && is_string($this->input($key))) {
            $this->merge([$key => trim($this->input($key))]);
        }
    }
});
```

### HTML Purifier for Rich Text
```php
protected function prepareForValidation(): void
{
    if ($this->has('body')) {
        $this->merge([
            'body' => (new HTMLPurifier())->purify($this->input('body')),
        ]);
    }
}
```

### Spatie Laravel Data Input Pipeline
```php
class PostData extends Data
{
    public static function prepareForPipeline(): array
    {
        return [
            static fn (PostData $data) => $data->withSanitizedTitle(),
            static fn (PostData $data) => $data->withGeneratedSlug(),
        ];
    }

    public function withSanitizedTitle(): static
    {
        $this->title = strip_tags(trim($this->title));
        return $this;
    }
}
```

## Related Knowledge Units

### Prerequisites
- **input-preparation** — Phase 2 pre-validation preparation.
- **form-request-design-for-apis** — the request class hosting prepareForValidation().

### Related Topics
- **after-validation-hooks** — post-validation hooks that follow preparation.
- **conditional-validation-patterns** — how conditionals depend on prepared input.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — prepared data flowing to DTO payload().
- **dto-integration-todto-method** — toDto() receiving prepared data.

## Research Notes

### Source Analysis
`prepareForValidation()` is called by `ValidatesWhenResolvedTrait` in the `validateResolved()` method. The call order is: `authorize()` → `prepareForValidation()` → `rules()` → validator. This ordering guarantees that prepared data is available to both rules and downstream consumers.

### Key Insight
Input preparation creates a **clean boundary between HTTP format and internal format**. The raw request may contain string-encoded booleans, empty strings for optional fields, or JSON:API nested structures. Preparation translates these into the clean, typed format that validation rules and business logic expect.

### Version-Specific Notes
- Laravel 10: `prepareForValidation()` receives no parameters; use `$this->merge()` for modifications.
- Laravel 11: No changes.
- PHP 8.2: `str_starts_with()` and `str_contains()` available for string sanitization operations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization