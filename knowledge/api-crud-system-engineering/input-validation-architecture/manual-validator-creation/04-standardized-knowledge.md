# Manual Validator Creation

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-manual-validator-creation |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

`Validator::make()` enables manual validation outside FormRequests — in service layers, commands, queued jobs, and API integrations. Manual validation is necessary when the data source is not an HTTP request or when validation must occur after the controller boundary. It complements FormRequest validation, extending validation to contexts where HTTP request objects are unavailable.

## Core Concepts

- **`Validator::make()` API**: `Validator::make($data, $rules, $messages, $attributes)` — portable validation engine.
- **ValidationResult Pattern**: Return a rich result object with `passes`, `data`, and `errors` as a single unit.
- **Service-Layer Validation**: Validating data from multiple sources (request + DB + external API).
- **Batch Validation**: Per-item validation in bulk/batch processing with individual error reporting.
- **Defense in Depth**: Additional validation layer beyond FormRequest in service layer.
- **ValidationException for Consistency**: Throwing `ValidationException` in services maintains consistent error handling with FormRequests.

## When To Use

- In service layer when data comes from multiple sources
- For queued job validation before processing
- For CLI command argument/option validation
- For API client response validation
- For bulk/batch processing where each item is validated independently
- For contexts where FormRequest (HTTP-bound) cannot be used

## When NOT To Use

- For HTTP endpoint validation — FormRequest is the correct tool
- When FormRequest validation already covers the data path
- For simple CRUD where Eloquent validation suffices
- When the same rules are duplicated between FormRequest and manual validator

## Best Practices (WHY)

- **Use `Validator::make()` as complement, not replacement**: FormRequests for HTTP; manual validators for everything else.
- **Use same rule arrays as FormRequests**: Consistency across all validation contexts.
- **Use `ValidationException` for service-layer validation**: Consistent error handling with framework.
- **Return `ValidationResult` for batch processing**: Rich return with passes/data/errors.
- **Always call `validated()` after `passes()`**: Otherwise, exception on failure.
- **Catch `ValidationException` in jobs**: Prevents job failures and release loops.
- **Log validation failures with context**: Class, method, data shape for debugging.
- **Use `$stopOnFirstFailure` for performance-critical single-item validation**.

## Architecture Guidelines

- Use `Validator::make()` in service/repository layers for defense-in-depth validation.
- Create reusable validation services for common validation patterns.
- Use `ValidationResult` object for rich return types instead of boolean + array.
- For batch processing, create a fresh `Validator` per item — they are not reusable.
- Do not throw `ValidationException` in queued jobs without proper exception handling.
- Use named arguments for `Validator::make()` parameters for readability.

## Performance Considerations

- `Validator::make()` is cheap — use freely.
- Avoid recreating the same validator instance — cache rule sets for repeated validation.
- In loops (batch), each `Validator::make()` is independent — no reuse possible.
- Use `$stopOnFirstFailure` for single-item validation to avoid unnecessary rule evaluation.
- Validator instances are single-use — results cached after first `passes()`/`fails()`.

## Security Considerations

- Validation in service layer is defense-in-depth, not an alternative to FormRequest validation.
- Never trust data that bypassed FormRequest validation — always validate at the service boundary.
- Throwing `ValidationException` in services exposes validation details — ensure safe error messages.
- Log validation failures with context for anomaly detection.
- For batch processing, per-item errors should not leak data about other items.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Throwing ValidationException in job | Job released repeatedly | Not handling exceptions | Infinite retry loop | Catch, log, mark as failed |
| Reusing validator instances | Returns cached stale result | Not creating fresh validator | Wrong validation results | Create new Validator per validation |
| Not calling validated() after passes() | Exception on failure | Missing `passes()` check | Unhandled exception | Check `passes()` first, then `validated()` |
| Duplicating FormRequest rules | Two sources of truth for same endpoint | No coordination | Rules diverge | FormRequest for HTTP; service validates additional rules only |
| Missing custom messages | Generic error format | No messages array | Inconsistent with FormRequest errors | Always pass messages array |

## Anti-Patterns

- **Manual validation replacing FormRequest for HTTP endpoints**: FormRequest should be primary for HTTP.
- **Validator::make() with no error handling**: Throw or return — don't silently ignore failures.
- **Global `Validator::extend()` in service provider**: Use Rule classes for scoped validation.
- **Same validation logic in FormRequest and service layer**: Duplicate maintenance burden.
- **Ignoring validation failures in batch processing**: Log and report all failures.

## Examples

```php
// Service-layer validation
class PostService
{
    public function create(array $data, User $author): Post
    {
        $validator = Validator::make($data, [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->posts->create($validator->validated(), $author);
    }
}

// Batch validation with per-item results
foreach ($this->items as $index => $item) {
    $validator = Validator::make($item, $rules);
    if ($validator->fails()) {
        $errors[$index] = $validator->errors();
    } else {
        $valid[$index] = $validator->validated();
    }
}
```

## Related Topics

- Form Request Design for APIs (rules design applied in manual context)
- Validation Error Shape Customization (customizing errors from manual validation)
- Custom Validation Rules (using custom rules in manual validation)
- After Validation Hooks (after() hooks with manual validator)
- Bulk Request Validation (manual validation for batch processing)

## AI Agent Notes

- Use `Validator::make()` for non-HTTP contexts only — FormRequests are for HTTP endpoints.
- Use the same rule arrays as FormRequests for consistency.
- Always check `passes()` before calling `validated()`.
- In jobs, catch `ValidationException` and log gracefully — don't let it bubble.
- For batch processing, create fresh Validator per item.

## Verification

- [ ] `Validator::make()` is not used as a replacement for FormRequest HTTP validation
- [ ] Validation result is checked (`passes()`/`fails()`) before accessing validated data
- [ ] `ValidationException` is caught in job contexts
- [ ] Rule arrays are consistent with FormRequest rules (or intentionally different)
- [ ] Custom messages and attributes are passed for consistent error formatting
- [ ] Batch processing creates fresh Validator per item
- [ ] Logging exists for manual validation failures
