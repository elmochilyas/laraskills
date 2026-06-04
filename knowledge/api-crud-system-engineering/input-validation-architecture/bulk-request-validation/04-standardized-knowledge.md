# Bulk Request Validation

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-bulk-request-validation |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Advanced |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Validating arrays of resources in bulk API requests — patterns for batch creates, updates, and deletes. Bulk validation differs from single-resource validation by requiring per-item error reporting, resource limits, cross-item uniqueness checks, and batch-level validation. The validation strategy exists on a spectrum from "reject all on any failure" (all-or-nothing) to "process valid items, report failures" (partial success).

## Core Concepts

- **Per-Item vs Batch-Level Validation**: Per-item checks individual units; batch-level checks size limits and cross-item uniqueness.
- **Wildcard Rules for Bulk**: `posts.*.title` applies rules to all array elements declaratively.
- **Cross-Item Uniqueness**: Checking duplicate values across items in the batch using `after()` hook.
- **Partial Success**: 200/201 response with meta.failed count — not all-or-nothing rejection.
- **Resource Limits**: `min` and `max` on array size bound batch processing.
- **Per-Item Error Reporting**: Individual error pointers for each failed item.

## When To Use

- For endpoints that accept arrays of resources (batch create, batch update)
- For data import functionality
- For mobile app sync operations (offline-to-online data sync)
- For admin bulk operations
- When partial success is acceptable

## When NOT To Use

- For single-resource endpoints
- For atomic financial operations where all-or-nothing is required
- When the bulk operation size is always 1 (just use single endpoint)
- For operations that require strict ordering and dependency between items

## Best Practices (WHY)

- **Always set a hard `max` on bulk arrays**: DoS prevention — 50-500 depending on resource.
- **Use wildcard rules for per-item validation**: Declarative, concise, framework-native.
- **Use `after()` hook for cross-item uniqueness**: Single pass over data, not per-query.
- **Return per-item errors with pointers**: Client can identify and fix specific items.
- **Return partial success when some items fail**: 200/201 with `meta.failed` count.
- **Log bulk validation summaries**: Total, failed, succeeded for monitoring.
- **Consider async for large batches**: > 100 items should use queued jobs.
- **Communicate limits in error messages**: Inform client of max batch size.

## Architecture Guidelines

- Define bulk requests as separate FormRequests (`BulkStorePostsRequest`).
- Use wildcard rules for per-item validation.
- Use `after()` hook for cross-item uniqueness checks.
- Transform error responses to include per-item pointers.
- For service-layer bulk validation, iterate with `Validator::make()` per item.
- Use `BulkResult` return type with `valid` and `failed` arrays.
- Set `max` based on expected row size and processing capacity.

## Performance Considerations

- Set `max` on bulk array size to bound computation (50-500 depending on resource).
- Cross-item uniqueness checks are O(n) — fine for n < 1000.
- Wildcard `exists` rules execute one query per unique value — batch with `whereIn`.
- Per-item loop validation is O(n) with O(n) total validation cost.
- Memory: cross-item checks store all values for comparison — consider streaming for very large batches.

## Security Considerations

- Enforce hard `max` limit on bulk array size to prevent resource exhaustion.
- Cross-item uniqueness checks prevent duplicate injection across batch.
- Per-item error reporting must not leak data about other items.
- Bulk endpoints often bypass normal rate limits — apply appropriate throttling.
- Log bulk operation anomalies for abuse detection.
- Ensure authorization is checked for the batch operation, not just per-item.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No max on bulk array | Open-ended batch size | Oversight | DoS via massive payload | Always enforce max per endpoint |
| Returning 422 for partial failure | Whole batch rejected | All-or-nothing thinking | Client retries all items unnecessarily | Return 200 with meta.failed |
| Using required_if with wrong wildcard path | Condition never matches | Not using exact path | Required fields not validated | Match wildcard path exactly |
| DB uniqueness as only cross-item check | Wasteful rollback on duplicate | No after() hook | Inefficient failure | Check in after() before DB insert |
| Forgetting that distinct doesn't work on objects | distinct only works on scalars | Not reading docs | Silent failure | Use after() hook for object uniqueness |

## Anti-Patterns

- **All-or-nothing rejection**: Rejecting the entire batch for one item failure.
- **No per-item error reporting**: Client can't identify which items failed.
- **Async processing with no validation**: Validating after job starts wastes resources.
- **Same rate limit as single endpoints**: Bulk endpoints need adjusted rate limits.
- **Same per_page as items limit**: Pagination and bulk have different constraints.

## Examples

```php
class BulkStorePostsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'posts' => ['required', 'array', 'min:1', 'max:50'],
            'posts.*.title' => ['required', 'string', 'max:255'],
            'posts.*.body' => ['required', 'string'],
            'posts.*.status' => ['sometimes', Rule::in(['draft', 'published'])],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $titles = collect($this->input('posts'))->pluck('title');
            $duplicates = $titles->duplicates();
            if ($duplicates->isNotEmpty()) {
                foreach ($duplicates as $index => $title) {
                    $validator->errors()->add(
                        "posts.{$index}.title",
                        "Duplicate title '{$title}' found in batch."
                    );
                }
            }
        });
    }
}
```

## Related Topics

- Form Request Design for APIs (base request structure)
- Validation Rule Array Design (wildcard and array validation basics)
- Custom Validation Rules (custom rules for cross-item checks)
- Manual Validator Creation (per-item validation in service layer)
- Bulk Operation Design (broader bulk operation architecture)

## AI Agent Notes

- Always enforce `max` on bulk arrays to prevent resource exhaustion.
- Use wildcard rules for per-item validation; use `after()` for cross-item uniqueness.
- Return per-item errors with proper pointer format so clients identify failed items.
- For partial success, return 200/201 with `meta.failed` count.
- Consider async processing for batches > 100 items.

## Verification

- [ ] All bulk arrays have `min` and `max` constraints
- [ ] Wildcard rules cover all per-item validation
- [ ] Cross-item validation exists in `after()` hook
- [ ] Error responses include per-item pointers
- [ ] Partial success returns 200/201 with meta.failed
- [ ] Batch size limits are documented in API contract
- [ ] Integration tests verify both all-valid and partial-failure scenarios
