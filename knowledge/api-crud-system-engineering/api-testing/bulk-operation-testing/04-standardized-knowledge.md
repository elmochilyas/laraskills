# ECC Standardized Knowledge — Bulk Operation Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Bulk Operation Testing |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Bulk operation tests verify that endpoints accepting multiple resources in a single request (POST /api/posts/bulk, PUT /api/posts/bulk, DELETE /api/posts/bulk) correctly process the batch. Tests cover partial success (some items succeed, some fail), validation errors per item, transaction behavior (all-or-nothing vs partial commits), response structure (per-item status codes, per-item errors), and performance under batch size limits. Bulk operations are common in enterprise APIs for import, export, and batch update scenarios. Laravel implementations use array validation (`array.*.field`), batch services, and per-item response formatting.

## Core Concepts

- **Batch endpoint**: Accepts `{"items": [{...}, {...}]}` — multiple resources in one request
- **Per-item validation**: `items.*.title => 'required'` — validates each item individually
- **Per-item errors**: `{"errors": {0: {"title": ["Required"]}, 1: {}}}` — error per item index
- **Transactional processing**: All-or-nothing — one bad item fails the entire batch
- **Batch processing**: Partial success — each item processed independently, some succeed, some fail
- **Batch size limits**: `'items' => 'required|array|min:1|max:100'` — enforce payload size
- **Response structure**: `{"data": [{...}, {...}], "errors": {0: {...}}}` — mixed success/error response

## When To Use

- Import/export endpoints (CSV, JSON batch upload)
- Bulk update endpoints (mass status change, bulk publish/unpublish)
- Bulk delete endpoints (mass cleanup)
- Admin panel batch action endpoints
- Any endpoint documented as accepting multiple resources

## When NOT To Use

- Single-resource CRUD endpoints (covered by happy-path, validation-failure KUs)
- Async job-based bulk processing (queue-based, webhook callback)
- Streaming bulk operations (chunked HTTP responses)

## Best Practices

- **Test all-succeed batch**: All items valid → assert all items have data, no errors.
- **Test all-fail batch**: All items invalid → assert all items have errors, no data.
- **Test partial success**: Mix valid and invalid items → assert success count + error count matches.
- **Test batch size limits**: Exceed `max` → assert 422 with size error; empty array → assert 422.
- **Test transactional rollback**: `DB::transaction` in service, assert no records persist when one item fails in all-or-nothing mode.
- **Test per-item error structure**: `$response->assertJsonStructure(['data' => ['*' => ['id']], 'errors' => ['0' => ['title', 'body']]])`.
- **Test concurrent batch processing**: If parallel processing supported, test race conditions.

## Architecture Guidelines

- Transactional (all-or-nothing) is simpler but fails entire batch for one bad item.
- Batch (partial success) is more user-friendly — fix one bad item, resubmit.
- Most production APIs use batch processing with partial success for mutating operations.
- Use transactional processing for operations that cannot be partially applied (e.g., financial transfers).
- Always enforce strict batch size limits (100-500 items max depending on complexity).

## Performance Considerations

- Bulk endpoints are sensitive to payload size — 100 items = 100x memory of single item.
- Test with maximum batch size to identify memory issues.
- Create large payloads using factories: `factory()->count(100)->raw()`.
- Measure response time per item count — may need paginated batch processing.
- Use `DB::beginTransaction()` + chunked processing within transaction for bounded memory.

## Security Considerations

- Bulk operations can generate 100x the load of normal requests — rate limit separately.
- Validate that users can only operate on resources they own (authorization per item).
- Avoid SQL injection via batch payloads — use parameter binding, not string concatenation.
- Log per-item failures for audit trails.
- Implement idempotency for bulk endpoints (one idempotency key for the entire batch).

## Common Mistakes

- Not testing partial success — the most common bulk operation scenario.
- Forgetting to validate batch size limit — 10,000-item batch crashes the server.
- Returning errors in wrong format — mixing per-item errors with global validation errors.
- Not testing empty batch — `items: []` may pass validation if no `min:1` rule.
- Transactional processing with no rollback test — batch fails but partial data persists.
- Incorrect per-item error indexing — error at index 2 maps to wrong item after sorting.

## Anti-Patterns

- **No partial success testing**: Only testing all-succeed or all-fail — partial success is the most common real-world scenario.
- **Server-side sorting with index mismatch**: Processing items in a different order than received — error indexes don't match input indexes.
- **Unlimited batch size**: No `max` validation — a 10,000-item request brings down the server.
- **Silent partial failures**: Items fail without error reporting — client has no way to know which items failed.

## Examples

```php
it('processes batch with partial success', function () {
    $items = [
        ['title' => 'Valid Post 1', 'body' => 'Content'],
        ['title' => '', 'body' => 'Content'], // invalid — no title
        ['title' => 'Valid Post 3', 'body' => 'Content'],
    ];

    $response = $this->postJson('/api/posts/bulk', ['items' => $items]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'data' => ['*' => ['id', 'title']],
        'errors' => ['1' => ['title']],
    ]);
    expect($response->json('data'))->toHaveCount(2);
    expect($response->json('errors'))->toHaveCount(1);
});

it('enforces batch size limit', function () {
    $items = factory(Post::class)->count(200)->raw();

    $response = $this->postJson('/api/posts/bulk', ['items' => $items]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['items']);
});
```

## Related Topics

- **Prerequisites**: Laravel Array Validation, Database Transactions
- **Siblings**: validation-failure-testing, idempotency-key-testing, response-shape-testing
- **Advanced**: Async bulk operations (queue-based, webhook callback), Chunked batch processing within a single request, Bulk import/export patterns with progress tracking

## AI Agent Notes

- Bulk operation testing is the most complex assertion structure in API testing — the response contains both success and error objects with per-item indexing.
- Laravel array validation syntax `items.*.title` has been stable since Laravel 5.5.
- PestPHP 2.x datasets work well for bulk test inputs.

## Verification

- [ ] All-succeed batch returns data for all items, no errors
- [ ] All-fail batch returns errors for all items, no data
- [ ] Partial success returns correct success/error counts with per-item indexing
- [ ] Batch size limits are enforced (min and max)
- [ ] Empty batch is rejected
- [ ] Transactional rollback is verified (no partial persistence on failure)
- [ ] Per-item error structure matches input array indices
