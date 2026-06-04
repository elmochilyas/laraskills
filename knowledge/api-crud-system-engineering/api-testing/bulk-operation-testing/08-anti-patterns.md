# Bulk Operation Testing: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Bulk Operation Testing |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **No Partial Success Testing** — Only testing all-succeed or all-fail scenarios
2. **Server-Side Sorting With Index Mismatch** — Processing items in different order than received
3. **Unlimited Batch Size** — No `max` validation for batch requests
4. **Silent Partial Failures** — Items fail without error reporting to the client
5. **Transactional Without Rollback Test** — Batch fails but partial data persists

## Repository-Wide Anti-Patterns

- Not testing empty batch validation (`items: []`)
- Incorrect per-item error indexing (error at index 2 maps to wrong item)
- Mixing per-item errors with global validation errors in test assertions
- Not testing concurrent batch processing

---

## 1. No Partial Success Testing

### Category
Test Coverage Gap

### Description
Only testing all-succeed or all-fail batch scenarios. The most common real-world case — some items succeed, some fail — is never tested.

### Why It Happens
Partial success requires more complex test setup (mix of valid and invalid items) and more complex assertions (checking both data and errors arrays). The simpler cases are easier to write.

### Warning Signs
- Only tests for 200 (all succeed) and 422 (all fail)
- No tests with a mix of valid and invalid items
- Production bugs where partial success has wrong response structure
- Error index mapping not verified in tests
- Response format for mixed success not documented

### Why Harmful
Partial success is the most common bulk operation scenario in production. Bugs in partial success handling directly affect consumers — they receive incorrect success/failure data.

### Real-World Consequences
A batch endpoint processes 100 items. 95 succeed, 5 fail. The server returns errors indexed incorrectly (error for item 7 shows under index 3). The client shows wrong error messages for the wrong items. This bug exists for 3 months because partial success was never tested.

### Preferred Alternative
Always test partial success scenarios with mixed valid/invalid items. Verify counts and index mapping.

### Refactoring Strategy
1. Add test with 3 items: 1 valid, 1 invalid, 1 valid
2. Assert data has 2 items, errors has 1 item
3. Verify error index matches the input array position
4. Test different valid/invalid ratios
5. Add API documentation for partial success response format

### Detection Checklist
- [ ] No partial success tests exist
- [ ] Only all-succeed and all-fail tested
- [ ] Error index mapping not verified
- [ ] Partial success response format undocumented

### Related Rules/Skills/Trees
- Rule: API-TEST-001 (Partial Success Coverage)
- Skill: bulk-operation-testing
- Tree: api-testing

---

## 2. Server-Side Sorting With Index Mismatch

### Category
Data Integrity

### Description
The server processes batch items in a different order than received. Error indexes no longer match the input array positions, causing client-side confusion.

### Why It Happens
The server sorts, groups, or reorders items during processing without preserving the original index mapping.

### Warning Signs
- Items reordered during batch processing
- Error responses show different order than input
- Client reports "the error says item 3 failed, but item 3 looks fine"
- Server-side processing reorders by type or priority
- Tests don't verify index-to-item mapping

### Why Harmful
Clients cannot determine which specific input items failed. Error-to-item mapping is broken. The batch operation becomes unusable.

### Real-World Consequences
A user uploads a CSV with 100 items. Items 7 and 42 fail validation. The server processes items in alphabetical order. Errors are returned for "index 1" and "index 55" (the alphabetical positions). The user cannot find which rows failed.

### Preferred Alternative
Preserve input order during processing. Return errors with the original input index. Use a keyed collection to maintain index mapping.

### Refactoring Strategy
1. Process items in input order
2. Use input array index for error reporting
3. Remove any server-side reordering
4. Add tests verifying error index matches input position
5. Document that errors are indexed by input position

### Detection Checklist
- [ ] Items reordered during processing
- [ ] Error indexes don't match input positions
- [ ] No index mapping test
- [ ] Reordering logic in batch processing

### Related Rules/Skills/Trees
- Rule: API-DATA-001 (Input Order Preservation)
- Skill: bulk-operation-testing
- Tree: data-integrity

---

## 3. Unlimited Batch Size

### Category
Server Vulnerability

### Description
No `max` validation on the batch size. A client can send 10,000 items in a single request, overwhelming server resources.

### Why It Happens
The developer focuses on batch functionality and forgets to enforce size limits. "The client will be reasonable."

### Warning Signs
- No `'items' => 'max:500'` validation rule
- Batch endpoint accepts any number of items
- Memory usage grows linearly with batch size
- Request timeout on large batches
- `max` validation absent from form request

### Why Harmful
A large batch request can crash the server (memory exhaustion, request timeout). Malicious clients can cause denial of service. Legitimate clients may not know the limit.

### Real-World Consequences
A client sends a batch of 50,000 items due to a bug in their integration. The server tries to validate all 50,000 items in memory. PHP memory limit is exhausted. The server returns 500 for 2 minutes until it recovers.

### Preferred Alternative
Enforce batch size limits with validation: `'items' => 'required|array|min:1|max:100'`. Choose a limit based on server capacity testing.

### Refactoring Strategy
1. Add `size` validation to batch form request
2. Test with maximum batch size
3. Add memory monitoring for batch endpoints
4. Document the batch size limit in API docs
5. Consider chunked processing for large batches

### Detection Checklist
- [ ] No `max` validation on batch size
- [ ] Batch accepts unlimited items
- [ ] No batch size limit documented
- [ ] Memory usage not tested for max batch

### Related Rules/Skills/Trees
- Rule: API-VALIDATION-005 (Batch Size Limits)
- Skill: bulk-request-validation
- Tree: security

---

## 4. Silent Partial Failures

### Category
Error Reporting Gap

### Description
Some items in a batch fail but the response doesn't include per-item error information. The client receives a generic 200 or 422 without knowing which items failed and why.

### Why It Happens
The batch processing catches exceptions but doesn't format per-item errors. Error handling was added as an afterthought.

### Warning Signs
- Batch response has no `errors` array
- Generic "some items failed" message without details
- Items fail silently — client can't identify which ones
- Error handling in batch service doesn't differentiate per-item issues
- Response format doesn't include per-item status indicators

### Why Harmful
Clients cannot correct failed items. The entire batch must be resubmitted, including items that succeeded. Data processing becomes inefficient.

### Real-World Consequences
An import batch has 3 items that fail due to validation errors. The server returns 200 with only the successful data. The client has no idea 3 items failed. Data is silently lost.

### Preferred Alternative
Return per-item error information in the response. Include the item index, field errors, and failure reason.

### Refactoring Strategy
1. Add per-item error tracking during batch processing
2. Include `errors` array with index-keyed error details
3. Test that partial failures return appropriate response structure
4. Document the error response format in API docs
5. Add per-item status to response data

### Detection Checklist
- [ ] No per-item errors in batch response
- [ ] Generic error message for partial failures
- [ ] Silent data loss possible
- [ ] Error handling not differentiated per item
- [ ] Response format lacks per-item status

### Related Rules/Skills/Trees
- Rule: API-ERROR-004 (Per-Item Error Reporting)
- Skill: error-response-testing
- Tree: error-handling

---

## 5. Transactional Without Rollback Test

### Category
Data Integrity

### Description
The batch processes items within a database transaction (all-or-nothing mode) but no test verifies that a single failed item rolls back the entire batch.

### Why It Happens
The transaction is implicit (developer assumes it works). The test creates only all-success scenarios.

### Warning Signs
- Transaction wrapping in batch service
- No test with one failing item in a transaction
- Database assertions don't verify rollback
- Partial data preserved after batch failure in production
- "We're using transactions, it's fine" — untested

### Why Harmful
Without rollback verification, a bug in transaction handling can cause partial data persistence. Some items saved, some rolled back. Data inconsistency.

### Real-World Consequences
A financial batch transfer processes 50 transfers in a transaction. Item 25 fails. Due to a bug in transaction handling, items 1-24 persist. $1.2M is transferred despite the batch failure. The error is discovered during reconciliation 3 days later.

### Preferred Alternative
Test transactional rollback explicitly: submit a batch with at least one invalid item, verify no data persisted.

### Refactoring Strategy
1. Add test: batch with one invalid item, assert zero records created
2. Verify database state before and after failed batch
3. Test both transactional and partial-success modes separately
4. Document which mode the endpoint uses
5. Add monitoring for partial persistence

### Detection Checklist
- [ ] Transactional batch without rollback test
- [ ] No database assertions after failed batch
- [ ] Transaction logic not explicitly tested
- [ ] Partial data persisted in production failures
- [ ] Batch mode (transactional vs partial) undocumented

### Related Rules/Skills/Trees
- Rule: API-DATA-002 (Transactional Integrity)
- Skill: bulk-operation-testing
- Tree: data-integrity
