# Decision Trees — Bulk Operation Testing

## Tree 1: Partial Success Test Structure

**Decision Context**: How to construct partial success tests — mixing valid and invalid items in the same batch.

**Decision Criteria**:
- Bulk processing mode (transactional vs batch)
- Error reporting format
- Item count for testing

**Decision Tree**:
```
Does the bulk endpoint use transactional processing (all-or-nothing)?
├── YES → Test partial success differently: one invalid item causes entire batch to fail
│   - Assert 422 or 409 (not 200)
│   - Assert no records created in database
│   - Assert per-item error details
└── NO → Does the bulk endpoint use batch processing (partial success)?
    ├── YES → Test: N valid items + M invalid items
    │   - Assert 200 (or 207 Multi-Status)
    │   - Assert N items in data
    │   - Assert M items in errors, indexed by input array position
    │   - Assert N records in database
    └── NO → Test all-succeed and all-fail scenarios; partial success may not be supported
```

**Rationale**: Transactional and batch processing have fundamentally different success/error response structures. Testing the wrong mode produces misleading results.

**Recommended Default**: Test all-succeed, all-fail, and partial success (3:1 valid:invalid ratio).

**Risks**: Testing only all-succeed misses the most common real-world scenario (partial success). Forgetting transactional rollback verification lets partial data persist on failure.

---

## Tree 2: Batch Size Limit Testing

**Decision Context**: Whether to test batch size limits and how to construct large payloads efficiently.

**Decision Criteria**:
- Maximum batch size configuration (100, 500, 1000 items)
- Factory performance for large batches
- Memory constraints

**Decision Tree**:
```
Is there a configured max batch size (items max rule)?
├── YES → Test boundary: send max+1 items → assert 422 on items array size
│   Use factory()->count(max+1)->raw() for efficient payload generation
└── NO → Test minimum: send empty items array → assert 422 (item must have min:1)
    └── Test maximum if configured: send max+1 → assert capped or 422
```

**Rationale**: Batch size limits protect server resources. A missing `max` validation allows 10,000-item batches that crash the server.

**Recommended Default**: Test both `min:1` (empty array rejected) and `max:N` (exceeded limit rejected) rules.

**Risks**: No batch size limit enforcement allows DoS via oversized payloads. Testing with too many items (max+1 = 1000) can be slow if factories are not optimized.
