# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | After Validation Hooks |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

After-validation hooks give FormRequests the ability to mutate the validator before validation runs, react to successful validation, and intercept validation failures. The three primary hooks — `withValidator()`, `passedValidation()`, and `failedValidation()` — fire at specific points in the `validateResolved()` pipeline. A fourth mechanism, `Validator::after()`, registers callbacks that execute after the main rule pass, enabling cross-field validation and post-rule assertions.

---

## Core Concepts

| Hook | Timing | Purpose |
|------|--------|---------|
| `withValidator()` | After validator constructed, before `passes()` | Mutate rules, add `after()` callbacks, inject data |
| `passedValidation()` | After all rules pass | Post-validation side effects, data transformation |
| `failedValidation()` | After rule failure | Custom error response, logging |
| `Validator::after()` | After main rule iteration | Cross-field validation, post-rule assertions |

---

## When To Use

- `withValidator()`: Adding cross-field validation rules, injecting data into the validator
- `passedValidation()`: Logging successful validation, merging computed data into the request
- `failedValidation()`: Returning custom JSON error structures for API endpoints
- `Validator::after()`: Cross-field assertions that must run after all individual field rules

## When NOT To Use

- Simple validation that can be expressed with `rules()` array
- Authorization checks (use `authorize()` instead)
- Business logic that belongs in services or actions

---

## Best Practices

- **Use `withValidator()` for adding `after()` callbacks** — don't override the entire validator
- **Keep `passedValidation()` lightweight** — it runs on every successful validation, avoid heavy operations
- **Use `failedValidation()` for API standardization** — return consistent JSON error structures
- **Use `Validator::after()` for cross-field validation** — checks that involve two or more fields together
- **Don't mutate validated data in `after()` callbacks** — they fire after validation, the validated result is already computed

---

## Architecture Guidelines

- `withValidator()` fires during `getValidatorInstance()`, which is called inside `validateResolved()`
- `after()` callbacks are registered inside `withValidator()` but execute during `$instance->fails()`
- `after()` callbacks fire even when main rules fail — useful for cross-field checks that should run regardless
- `passedValidation()` only fires when all rules pass — safe for success-only side effects
- `failedValidation()` default implementation throws `ValidationException` — can be overridden for custom responses
- Multiple `after()` callbacks can be registered; they execute in registration order

---

## Performance

After-validation hooks add minimal overhead. `withValidator()` runs once per FormRequest. `after()` callbacks run in the per-validation lifecycle — keep them lightweight. `passedValidation()` and `failedValidation()` each run at most once per request.

---

## Security

`passedValidation()` should not perform authorization checks — those belong in `authorize()`. `after()` callbacks should not expose sensitive data in error messages. `failedValidation()` should not leak information about why validation failed beyond the field-level error.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Mutating request in `after()` callback | Assuming after() can change validated data | Changes don't affect validated result | Use `prepareForValidation()` for mutations |
| Heavy logic in `passedValidation()` | Treating it as a business logic hook | Slows every successful form submission | Move to service/action layer |
| Overriding validator completely | Using `validator()` method without understanding | Loses default FormRequest behavior | Use `withValidator()` for modifications |
| NOT checking fails() in `withValidator()` | Adding after() callbacks unconditionally | after() fires even when not needed | Add conditions in after() callback logic |
| Information leakage in failedValidation() | Custom error messages with too much detail | Exposes internal state | Keep error messages generic |

---

## Anti-Patterns

- **Business logic in `passedValidation()`**: Creating records, sending emails, dispatching jobs
- **Throwing exceptions in `after()` callbacks**: Use `$validator->errors()->add()` instead
- **Heavy database queries in `withValidator()`**: Should only configure, not execute queries
- **Duplicate validation in `after()`**: Re-implementing rules that already exist in the rules array

---

## Examples

**withValidator() with after() callback:**
```php
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->start_date >= $this->end_date) {
            $validator->errors()->add('end_date', 'End date must be after start date.');
        }
    });
}
```

**passedValidation() for data enrichment:**
```php
protected function passedValidation(): void
{
    $this->merge(['validated_at' => now()]);
}
```

**failedValidation() for custom API response:**
```php
protected function failedValidation(Validator $validator)
{
    throw new HttpResponseException(response()->json([
        'success' => false,
        'errors' => $validator->errors(),
    ], 422));
}
```

**Execution order with validateResolved():**
```
prepareForValidation()
  → passesAuthorization()
  → getValidatorInstance()  // withValidator() fires here
  → fails()                 // after() callbacks fire during fails()
    → [true] → failedValidation()
    → [false] → passedValidation()
```

---

## Related Topics

- form-request-fundamentals — Overall FormRequest pipeline
- input-preparation — The prepareForValidation() hook
- authorization-in-requests — The authorize() flow
- form-request-testing — Testing hooks
- conditional-validation — Cross-field validation with after()

---

## AI Agent Notes

- `withValidator()` fires during `getValidatorInstance()`, INSIDE `validateResolved()`
- `Validator::after()` property is an array of closures — they execute in registration order
- `after()` callbacks fire even when main rules fail — errors accumulate from both phases
- `passedValidation()` default is a no-op — override for post-validation behavior
- `failedValidation()` default throws `ValidationException` with redirect/error bag

---

## Verification

- [ ] `withValidator()` used for validator configuration, not heavy logic
- [ ] `after()` callbacks used for cross-field validation
- [ ] `passedValidation()` only for lightweight post-processing
- [ ] `failedValidation()` overridden for consistent API error format
- [ ] No business logic (DB writes, API calls) in validation hooks
- [ ] After() callbacks do not mutate the request
- [ ] Execution order understood and respected
- [ ] Tests cover both pass and fail paths for custom hooks
