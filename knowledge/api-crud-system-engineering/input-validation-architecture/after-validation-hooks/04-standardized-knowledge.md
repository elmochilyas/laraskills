# After Validation Hooks

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-after-validation-hooks |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Advanced |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Post-validation hooks (`passedValidation()` and `Validator::after()`) run after all rules pass, allowing side effects, data transformation, and cross-field validation logic. These hooks are the bridge between "data is valid" and "data is ready for use" — the last opportunity to mutate input before it reaches the controller.

## Core Concepts

- **`passedValidation()`**: Called after all rules pass but before `validated()` returns. Used for derived data computation and normalization.
- **`Validator::after()` Callback**: Runs after all rules pass but can still reject the request by adding errors. Used for cross-field or external-service validation.
- **Lifecycle Order**: `authorize()` → `prepareForValidation()` → `rules()` → `Validator::make()` → `passes()` → `after()` callbacks → `passedValidation()` → `validated()`.
- **Merge in Hooks**: Use `$this->merge()` in `passedValidation()` to inject computed values into validated data.

## When To Use

- For computed fields (totals, slugs, UUIDs) that derive from validated input
- For cross-field validation rules that cannot be expressed as single-attribute rules
- For external-service validation (fraud checks, blacklist) that must block the request
- For injecting audit fields (created_by, created_ip) after validation
- For data normalization (lowercasing email, converting to cents)

## When NOT To Use

- For field-level validation rules — these belong in `rules()`
- For database writes or side effects — validation should be side-effect free
- For business logic that belongs in the controller or service layer
- For operations that should happen after the controller executes

## Best Practices (WHY)

- **Use `passedValidation()` for data normalization**: Keeps normalization in the request layer, not scattered across controllers.
- **Use `after()` for cross-field/external validation**: Runs once, not per-field — more efficient than custom rules.
- **Check errors before `after()` logic**: `after()` runs even when validation fails (Laravel 10+) — check `$validator->errors()->isEmpty()`.
- **Keep hooks side-effect free**: No DB writes, job dispatches, or external API calls with side effects.
- **Merge new keys, don't modify validated keys**: Use `merge()` to add computed fields; don't change already-validated values.
- **Use short timeouts for external calls in `after()`**: 2-3 seconds max to avoid blocking the request.
- **Never dispatch jobs from `passedValidation()`**: Validation is not transactional.

## Architecture Guidelines

- Use `passedValidation()` for in-memory data transformations only (no I/O).
- Use `Validator::after()` for external service validation that must block the request.
- Wrap `after()` body in try/catch to prevent 500 errors on service failures.
- Log `passedValidation()` side effects for debugging.
- Keep `passedValidation()` methods focused — one transformation per hook.
- Consider extracting complex after-validation logic to dedicated classes.

## Performance Considerations

- `after()` callbacks run synchronously during validation — slow callbacks delay the response.
- External API calls in `after()` should have short timeouts (2-3s).
- `passedValidation()` is fast — use for in-memory transformations only.
- Avoid DB queries in `passedValidation()` — they add latency to the validation pipeline.
- Multiple `after()` callbacks run sequentially — minimize count.

## Security Considerations

- Never trust user input in `passedValidation()` — validate before transforming.
- External service calls in `after()` may fail — handle failures gracefully without exposing internals.
- Audit fields injected in `passedValidation()` (user ID, IP) must come from authenticated context, not user input.
- `merge()` after validation does not re-validate — ensure merged data is safe.
- Log transformations for auditability.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| DB writes in passedValidation() | Side effects during validation | Convenience | Data created even when controller fails | Move DB writes to service layer |
| Assuming after() runs only on pass | after() runs on failure too (Laravel 10+) | Not reading docs | Adds errors when already failing | Check `$validator->errors()->isEmpty()` first |
| Using after() for field-level rules | after() for simple field checks | Misunderstanding | More complex than needed | Use `rules()` for per-field rules |
| Modifying validated keys via merge() | Data inconsistency | Not using computed field names | Validated data may not match rules | Add new keys, don't change validated ones |
| No try/catch in after() with external calls | 500 error when service fails | Assuming external reliability | Downstream service failure blocks API | Wrap after() body in try/catch |

## Anti-Patterns

- **`passedValidation()` as a dumping ground**: Multiple unrelated transformations in one hook.
- **Side effects in `passedValidation()`**: Job dispatches, emails, DB writes.
- **`after()` callback without error check**: Adds errors even when primary validation already failed.
- **External API calls without timeout in `after()`**: Blocks the request indefinitely.
- **Modifying validated data after `passedValidation()`**: Defeats the purpose of the validation contract.

## Examples

```php
// Derived data computation
protected function passedValidation(): void
{
    $this->merge([
        'total' => $this->input('quantity') * $this->input('price'),
        'slug' => Str::slug($this->input('title')),
        'created_by' => $this->user()->id,
    ]);
}

// External service validation
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        try {
            $response = Http::timeout(3)->post('https://fraud.example.com/check', [
                'email' => $this->input('email'),
                'amount' => $this->input('amount'),
            ]);
            if ($response->json('risk_score') > 80) {
                $validator->errors()->add('email', 'Transaction flagged as high risk.');
            }
        } catch (\Throwable $e) {
            Log::warning('Fraud check failed', ['error' => $e->getMessage()]);
        }
    });
}
```

## Related Topics

- Form Request Design for APIs (the request class providing hooks)
- Conditional Validation Patterns (interaction between conditionals and after hooks)
- Input Preparation (pre-validation hooks that complement post-validation)
- DTO Integration: payload() Method (preparing data for DTO creation after validation)
- Manual Validator Creation (after hooks in non-FormRequest validation)

## AI Agent Notes

- Use `passedValidation()` for in-memory derived data only — no I/O.
- Use `Validator::after()` for cross-field or external-service validation.
- Always check `$validator->errors()->isEmpty()` at the start of `after()` callbacks.
- Wrap `after()` external calls in try/catch with logging.
- When merging computed data, use new key names, don't overwrite validated fields.

## Verification

- [ ] `passedValidation()` contains only in-memory transformations
- [ ] `Validator::after()` callbacks check `errors()->isEmpty()` first
- [ ] External API calls in `after()` have explicit timeouts and try/catch
- [ ] No DB writes or job dispatches exist in any validation hook
- [ ] Merged data uses new keys, not overwrites of validated fields
- [ ] Logging exists for after-validation transformations
- [ ] Integration tests verify data transformations in hooks
