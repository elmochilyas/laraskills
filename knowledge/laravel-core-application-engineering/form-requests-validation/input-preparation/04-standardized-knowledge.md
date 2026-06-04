# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Input Preparation |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Input preparation in FormRequests normalizes, sanitizes, and enriches request data before validation rules execute. The primary hook is `prepareForValidation()`, which fires as the first step in the validation pipeline — before authorization and before rules. A secondary hook, `passedValidation()`, fires after successful validation for post-processing validated data. The `merge()` method provides the mechanism for adding or overriding data in the validation input.

---

## Core Concepts

- **prepareForValidation()**: First step in the pipeline — runs BEFORE authorization and validation rules
- **merge()**: Mutates the request's internal ParameterBag, affecting `$request->all()` and validation input
- **Type coercion**: Convert string booleans, comma-separated strings, and form inputs to native PHP types
- **Default value injection**: Set default values for optional fields before validation
- **One-way transformation**: Once merged, original raw input is overwritten — intentional design

---

## When To Use

- Form inputs with non-standard formats (checkboxes returning "on"/"off", comma-separated strings)
- Fields that need type conversion before validation (string to boolean, string to array)
- Computed fields that need to be validated (slugs, hashes, timestamps)
- Default values for optional fields that are absent from the request

## When NOT To Use

- Authorization checks (use `authorize()`)
- Business logic transformations (belongs in services/actions)
- Database-dependent transformations (user data not yet resolved)

---

## Best Practices

- **Use `merge()` to add or override data** — `$this->merge(['field' => value])` before validation sees it
- **Coerce types early** — convert form strings to native PHP types so validation rules operate on correct types
- **Set defaults for optional fields** — prevent nullable validation issues when fields are absent
- **Don't use `prepareForValidation()` for authorization** — it runs before `authorize()`, but authorization belongs in `authorize()`
- **Use `passedValidation()` only for lightweight post-processing** — logging, not data transformation
- **Extract raw values before overwriting** if the original input is needed later (e.g., for logging)

---

## Architecture Guidelines

- `prepareForValidation()` is a no-op in the trait — override in FormRequest
- `merge()` affects `validationData()` which defaults to `$request->all()`
- `replace()` overwrites the entire ParameterBag; `merge()` adds individual keys
- `passedValidation()` fires after validation passes — modifying request at this point does NOT affect validated result
- `validationData()` can be overridden to return a different data source for the validator
- Cast values using PHP functions: `filter_var()`, `(float)`, `array_map()`

---

## Performance

Input preparation runs once per FormRequest. The cost is proportional to the number of transformations. Simple type coercions are negligible (~0.001ms per field). Avoid database queries or API calls in `prepareForValidation()`.

---

## Security

Input preparation is a normalization step, not a security boundary. It runs before authorization — values can be tampered with by unauthorized users. Ensure transformations don't introduce vulnerabilities (e.g., don't execute user input as code). Strip or encode dangerous characters as needed.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Database queries in prepareForValidation() | Needing related data | Runs before auth, wasted queries | Move to service layer |
| Modifying request after validation | Using passedValidation() for data transform | Changes don't affect validated result | Use prepareForValidation() instead |
| Not coercing types | Assuming form strings are native types | Validation rules operate on wrong types | Coerce before validation |
| Overwriting raw data without backup | merge() overwrites original | Original value lost | Extract to property before merging |
| Authorization in prepareForValidation() | Early access check | Runs too early, before auth check | Use authorize() method |

---

## Anti-Patterns

- **Database queries in prepareForValidation()**: Loading user profiles, checking existence — belongs in services
- **Authorization logic in prepareForValidation()**: The hook runs before `authorize()`, but authorization doesn't belong here
- **Throwing exceptions in prepareForValidation()**: Use `merge()` for transformations; `authorize()` for access control
- **Heavy computation**: Expensive operations in what should be a lightweight normalization step

---

## Examples

**Type coercion:**
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

**Default value injection:**
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

**Field normalization:**
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'email' => strtolower(trim($this->email)),
        'phone' => preg_replace('/[^0-9]/', '', $this->phone),
    ]);
}
```

**Pipeline order:**
```
prepareForValidation() → passesAuthorization() → getValidatorInstance() → fails() → passedValidation()
```

---

## Related Topics

- form-request-fundamentals — Overall FormRequest pipeline
- after-validation-hooks — passedValidation() and other hooks
- form-request-dto-integration — Using validated data for DTO construction
- conditional-validation — Rules that depend on prepared data

---

## AI Agent Notes

- `prepareForValidation()` is a no-op by default in `ValidatesWhenResolvedTrait`
- The FormRequest class does NOT override this method — relies on the trait's default
- All `merge()` calls before validation affect the validator's input
- `passedValidation()` fires after validation — modifying request at this point does not affect validated result
- `validationData()` returns `$this->all()` by default — override for custom data source

---

## Verification

- [ ] `prepareForValidation()` overridden for type coercion
- [ ] `merge()` used for adding/overriding data
- [ ] No database queries in prepareForValidation()
- [ ] No authorization logic in prepareForValidation()
- [ ] Types coerced before validation rules execute
- [ ] Default values set for optional fields
- [ ] Raw values preserved before overwriting if needed for logging
- [ ] Tests verify input is normalized before validation
