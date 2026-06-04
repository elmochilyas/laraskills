# Skill: Test Bulk Operations

## Purpose
Write feature tests for bulk API endpoints — testing all-succeed, all-fail, and partial success scenarios, per-item validation and error indexing, batch size limits, transactional rollback, and concurrent request handling.

## When To Use
- Import/export endpoints (CSV, JSON batch upload)
- Bulk update endpoints (mass status change, bulk publish/unpublish)
- Bulk delete endpoints (mass cleanup)
- Admin panel batch action endpoints

## When NOT To Use
- Single-resource CRUD endpoints
- Async job-based bulk processing (queue-based, webhook callback)
- Streaming bulk operations (chunked HTTP responses)

## Prerequisites
- Laravel Array Validation (`items.*.field`)
- Database Transactions
- Feature test structure

## Inputs
- Bulk endpoint route definitions
- Batch item validation rules
- Batch processing strategy (transactional vs partial success)

## Workflow
1. Test all-succeed batch: all items valid → assert all items have data, no errors
2. Test all-fail batch: all items invalid → assert all items have errors, no data
3. Test partial success: mix valid and invalid items → assert success count + error count matches, errors keyed by input item index
4. Test batch size limits: empty array → assert 422; exceed max → assert 422 with size error; single item → assert success
5. Test transactional rollback: when using all-or-nothing, assert zero records persist when one item fails
6. Test per-item error structure: `assertJsonStructure(['data' => ['*' => ['id']], 'errors' => ['0' => ['title']]])` — errors indexed by item position
7. Test concurrent batch processing: if parallel/queue-based, send concurrent requests and verify no race conditions or duplicates

## Validation Checklist
- [ ] All-succeed batch returns data for all items, no errors
- [ ] All-fail batch returns errors for all items, no data
- [ ] Partial success returns correct success/error counts with per-item indexing
- [ ] Batch size limits enforced (min and max)
- [ ] Empty batch rejected
- [ ] Transactional rollback verified (no partial persistence)
- [ ] Per-item error structure matches input array indices
- [ ] Concurrent request handling tested if applicable

## Common Failures
- Not testing partial success — the most common real-world bulk operation scenario
- Forgetting to validate batch size limit — 10,000-item batch crashes the server
- Returning errors in wrong format — mixing per-item errors with global validation errors
- Not testing empty batch — `items: []` may pass validation if no `min:1` rule
- Transactional processing with no rollback test — batch fails but partial data persists
- Incorrect per-item error indexing — error at index 2 maps to wrong item after sorting

## Decision Points
- Transactional vs batch processing: all-or-nothing simpler but less user-friendly; partial success preferred for mutating operations
- Batch size limit: 100-500 items max depending on operation complexity
- Error structure: per-item errors with array index keys vs grouped errors

## Performance Considerations
- Bulk endpoints are sensitive to payload size — 100 items = 100x memory of single item
- Test with maximum batch size to identify memory issues
- Create large payloads using factories: `factory()->count(100)->raw()`
- Measure response time per item count — may need paginated batch processing

## Security Considerations
- Bulk operations can generate 100x the load of normal requests — rate limit separately
- Validate that users can only operate on resources they own (authorization per item)
- Avoid SQL injection via batch payloads — use parameter binding, not string concatenation
- Log per-item failures for audit trails
- Implement idempotency for bulk endpoints (one idempotency key for the entire batch)

## Related Rules
- Test Partial Success Scenario
- Test Batch Size Limits
- Assert Per-Item Error Structure
- Test Transactional Rollback
- Test Concurrent Request Handling

## Related Skills
- Test Validation Failures
- Test Idempotency Key Behavior
- Test Response Shape

## Success Criteria
- All-succeed, all-fail, and partial success scenarios covered
- Batch size limits enforced and tested at boundaries
- Per-item errors correctly indexed to input positions
- Transactional rollback verified (no partial persistence)
- Concurrent request handling prevents race conditions
- Empty batch correctly rejected
