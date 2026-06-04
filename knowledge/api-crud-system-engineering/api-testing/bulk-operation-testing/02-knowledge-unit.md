# Bulk Operation Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Bulk Operation Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Bulk operation tests verify that endpoints accepting multiple resources in a single request (POST /api/posts/bulk, PUT /api/posts/bulk, DELETE /api/posts/bulk) correctly process the batch. Tests cover partial success (some items succeed, some fail), validation errors per item, transaction behavior (all-or-nothing vs partial commits), response structure (per-item status codes, per-item errors), and performance under batch size limits. Bulk operations are common in enterprise APIs for import, export, and batch update scenarios. Laravel implementations use array validation (`array.*.field`), batch services, and per-item response formatting.

---

## Core Concepts
Bulk endpoints accept an array of items: `POST /api/posts/bulk` with body `{"items": [{...}, {...}]}`. Validation validates each item individually, returning per-item errors: `{"items": {0: {"title": ["Required"]}, 1: {}}}`. Processing can be transactional (all succeed or all fail) or batch (each item processed independently, partial success returned). The response structure is typically `{"data": [{...}, {...}], "errors": {0: {...}}}` indicating which items succeeded and which failed. Tests assert: successful items have data, failed items have errors, the count matches, the batch size limit is enforced, and empty batches are rejected.

---

## Mental Models
Bulk operation testing is **quality control on an assembly line** — a batch of widgets (items) goes through inspection. Some pass (green checkmark), some fail (red stamp with reason). The inspector records each widget's status individually and returns the full report. The report must clearly indicate which widgets passed and which failed, with the failure reason for each.

---

## Internal Mechanics
Bulk endpoints receive `items` array in the request body. Form request validation uses `items.*.title` syntax to validate each item. After validation, a batch service iterates items, processing each through the action/service layer. `DB::transaction()` wraps the loop for all-or-nothing; `DB::beginTransaction()` + per-item commit + rollback on failure enables partial success. Response collection maps each item to its result (success DTO or error). Per-item errors are collected and returned alongside successes. Batch size limiting is typically done in the form request or a dedicated middleware: `'items' => 'required|array|min:1|max:100'`.

---

## Patterns
- **Test all-succeed batch**: All items valid → assert all items have data, no errors.
- **Test all-fail batch**: All items invalid → assert all items have errors, no data.
- **Test partial success**: Mix valid and invalid items → assert success count + error count matches.
- **Test batch size limits**: Exceed `max` → assert 422 with size validation error; empty array → assert 422.
- **Test transactional rollback**: Use `DB::transaction` in the service, assert no records persist when one item fails in an all-or-nothing batch.
- **Test per-item error structure**: `$response->assertJsonStructure(['data' => ['*' => ['id']], 'errors' => ['0' => ['title', 'body']]])`.
- **Test concurrent batch processing**: If the implementation supports parallel processing, test race conditions.

---

## Architectural Decisions
The key architectural decision is transactional (all-or-nothing) vs batch (partial success). Transactional processing is simpler to implement and test but fails the entire batch if one item is bad — wasteful for large imports. Batch processing requires per-item error handling and response assembly but is more user-friendly (fix the one bad item, resubmit). Most production APIs use batch processing with partial success for mutating operations and transactional processing for operations that cannot be partially applied (e.g., financial transfers).

---

## Tradeoffs
| Tradeoff | Transactional (All-or-Nothing) | Batch (Partial Success) |
|---|---|---|
| Data integrity | High (no partial writes) | Lower (some succeed, some fail) |
| User experience | Poor (whole batch fails for one bad item) | Good (only bad items reported) |
| Implementation complexity | Lower (wrap in DB::transaction) | Higher (per-item error handling) |
| Response structure | Simple (error only) | Complex (data + errors per item) |

---

## Performance Considerations
Bulk endpoints are sensitive to payload size — a batch of 100 items loads 100x the memory of a single item. Test with maximum batch size to identify memory issues. In tests, create large payloads using factories and `factory()->count(100)->raw()`. Measure response time per item count — the service may need paginated batch processing (process 100 items per chunk, even within a single request). Use `DB::beginTransaction()` + chunked processing within the transaction to keep memory bounded.

---

## Production Considerations
Bulk operations are potential performance bottlenecks — a single request can generate 100x the load of a normal request. Enforce strict batch size limits (100-500 items max, depending on operation complexity). Rate limit bulk endpoints separately from single-item endpoints. Log per-item failures for audit trails. Implement idempotency for bulk endpoints (one idempotency key for the entire batch). Provide async processing via queued jobs for very large batches (>1000 items).

---

## Common Mistakes
- Not testing partial success — the most common bulk operation scenario.
- Forgetting to validate the batch size limit — a 10,000-item batch crashes the server.
- Returning errors in the wrong format — mixing per-item errors with global validation errors.
- Not testing empty batch — `items: []` may pass validation if no `min:1` rule.
- Transactional processing with no rollback test — batch fails but partial data persists.
- Incorrect per-item error indexing — error at index 2 maps to item at index 2, but order differs after sorting.

---

## Failure Modes
- **Memory exhaustion**: A 1000-item batch loads all items into memory simultaneously — hits PHP memory limit.
- **Partial database contamination**: Transactional rollback fails due to a non-transactional query (DDL, `DB::unprepared`) — partial data persists.
- **Per-item error index mismatch**: Items are processed in a different order than received — error indexes don't match input indexes.
- **Batch timeout**: A bulk operation takes >30 seconds — the HTTP request times out but processing continues in the background.

---

## Ecosystem Usage
Laravel Vapor supports bulk operations via its API. Shopify's REST API uses bulk operations with `limit` and `since_id` for large-scale data sync. Spatie's `laravel-bulk-actions` provides a bulk action pattern for admin panels. Laravel Nova's action system processes batch operations on selected resources.

---

## Related Knowledge Units
### Prerequisites
- Laravel Validation (array.* syntax)
- Database Transactions (DB::transaction, rollback on failure)

### Related Topics
- validation-failure-testing (per-item validation errors)
- idempotency-key-testing (bulk idempotency)
- response-shape-testing (complex nested response structures)

### Advanced Follow-up Topics
- Async bulk operations (queue-based, webhook callback)
- Chunked batch processing within a single request
- Bulk import/export patterns with progress tracking

---

## Research Notes
### Source Analysis
Laravel array validation: `'items.*.title' => 'required|string'`. `DB::transaction()` closure. `collect($items)->map(fn($item) => ...)->filter()->values()` for per-item processing.
### Key Insight
Bulk operation testing is the most complex assertion structure in API testing — the response contains both success and error objects, with per-item indexing that must match the request array.
### Version-Specific Notes
Laravel 11 `DB::transaction()` supports `$attempts` parameter for retry logic. PestPHP 2.x datasets work well for bulk test inputs. The `array.*.*` validation syntax has been stable since Laravel 5.5.
