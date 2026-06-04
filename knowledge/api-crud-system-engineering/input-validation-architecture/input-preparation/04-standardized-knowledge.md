# Input Preparation

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-input-preparation |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

The `prepareForValidation()` hook provides a normalization layer between raw HTTP input and validation. It runs after authorization but before rule evaluation, making it the ideal place for sanitization, type coercion, default value injection, and pre-validation data transformation.

## Core Concepts

- **`prepareForValidation()` Hook**: Runs after `authorize()` and before `rules()`. Used to normalize input before the validator sees it.
- **Sanitization vs Validation**: Sanitization normalizes input (trim, lowercase), validation asserts constraints. They happen at different stages.
- **`merge()` vs `replace()`**: `merge()` adds/overwrites specific keys; `replace()` replaces entire input. Use `merge()`.
- **Type Coercion**: Convert input types (string to int, string to boolean) before validation.
- **Default Value Injection**: Provide defaults for optional fields before validation runs.

## When To Use

- For any endpoint that accepts user input requiring normalization
- When input needs type coercion before validation (string IDs to integers)
- When default values should be applied to optional fields
- For sanitization (trim, lowercase, strip_tags) before rules evaluate
- For computed fields that derive from user input (slug from title)

## When NOT To Use

- For side effects (DB writes, job dispatches) — belongs in controller/service
- For validation — belongs in `rules()`
- For post-validation transformation — belongs in `passedValidation()`
- For data that should not be validated (system-only fields)

## Best Practices (WHY)

- **Use `merge()` over `replace()`**: Preserves existing input; additive, not destructive.
- **Keep transformations focused**: One concern per `merge()` call — readability matters.
- **Document all transformations**: Comment what each transformation does and why.
- **Handle `null` input**: `$this->input('key')` returns null if missing — handle gracefully.
- **Type-coerce before validation**: Validator receives typed data, reducing rule failures.
- **Don't modify data that `authorize()` already checked**: Authorization decisions may be invalidated.
- **Test `prepareForValidation()` thoroughly**: It affects all downstream logic and is often overlooked.

## Architecture Guidelines

- Use `prepareForValidation()` for sanitization, defaults, and coercion only.
- Extract complex transformation logic to dedicated methods.
- Apply defaults via `$this->input('key', $defaultValue)` for simplicity.
- Use `Request` macros for common sanitization patterns (sanitizeEmail, sanitizePhone).
- Preserve original input keys for audit trails when modifying values.
- Log prepared data keys at debug level for troubleshooting.

## Performance Considerations

- `prepareForValidation()` runs once per request — negligible overhead.
- Avoid DB queries in `prepareForValidation()` — they block validation.
- String operations (trim, regex) are fast — use freely.
- JSON decode on large strings may be slow — limit metadata field size.
- Type coercion is in-memory and instant.

## Security Considerations

- Sanitize HTML/JS from input to prevent stored XSS.
- Strip tags from description fields before storage.
- Type coercion without validation can produce unexpected results (`(int)` on non-numeric string = 0).
- Default values should not override explicit user intent — only apply to absent fields.
- Never sanitize in a way that removes malicious intent without alerting — log sanitization events.
- Preserve original values alongside sanitized versions for audit trails.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Side effects in prepareForValidation() | DB writes, job dispatches | Convenience | Side effects happen even if validation fails | Move to controller/service |
| Modifying data after authorize() | Auth decision based on now-changed data | Order unawareness | Auth bypass via input modification | Only add new fields, don't change existing |
| Forgetting null input handling | `$this->input('key')` returns null | No default handling | TypeError on null operations | Use `$this->input('key', '')` or null check |
| Over-merging | Too many unrelated transformations | No method extraction | Hard to read and debug | Extract to named methods |
| Type coercing without validation | `(int)` on non-numeric = 0 | Assuming clean input | Silent data corruption | Validate after coercion |
| merge() after validation() call | Merged data not in validated() | Wrong lifecycle position | Data missing from downstream | Only merge in prepareForValidation() |
| Removing original input keys | Lost original data for audit | Overwriting instead of merging | Can't trace back to original input | Preserve originals under different keys |

## Anti-Patterns

- **`prepareForValidation()` as a dumping ground**: All kinds of unrelated transformations.
- **Modifying input values that `authorize()` already checked**: Security risk.
- **Sensitive data manipulation**: Don't transform passwords, tokens, or secrets in preparation.
- **Replacing entire input**: `replace()` is destructive and loses the original request data.
- **Over-sanitization**: Removing characters that users intentionally provided (formatting, special chars).

## Examples

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->input('email'))),
        'phone' => preg_replace('/[^0-9]/', '', $this->input('phone')),
        'slug' => Str::slug($this->input('title')),
        'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
        'quantity' => (int) $this->input('quantity', 1),
        'page' => max(1, (int) $this->input('page', 1)),
        'per_page' => min(max(1, (int) $this->input('per_page', 15)), 100),
    ]);
}
```

## Related Topics

- Form Request Design for APIs (the request class that hosts prepareForValidation)
- After Validation Hooks (post-validation hooks that complement pre-validation)
- Conditional Validation Patterns (how conditionals interact with prepared input)
- DTO Integration: payload() Method (prepared data flowing to DTO)
- Pagination Parameter Validation (paginate defaults through preparation)

## AI Agent Notes

- Use `prepareForValidation()` for sanitization, coercion, and defaults only.
- Never perform side effects (DB writes, API calls) in `prepareForValidation()`.
- Use `merge()` not `replace()` for targeted additions.
- Handle null input gracefully with defaults or null checks.
- When type-coercing, validate the result doesn't produce unexpected values.

## Verification

- [ ] `prepareForValidation()` contains only sanitization, coercion, and defaults
- [ ] No DB queries, job dispatches, or API calls in `prepareForValidation()`
- [ ] `merge()` is used instead of `replace()`
- [ ] Null input is handled with defaults or explicit checks
- [ ] Type coercion produces expected values before validation
- [ ] Original input keys are preserved when values are transformed
- [ ] Tests verify prepared data matches expected transformed values
