# Decision Trees — Bulk Request Validation

## Tree 1: Batch Size Limit

**Decision Context**: Determining the maximum batch size for a bulk endpoint.

**Decision Criteria**:
- Row size (payload size per item)
- Processing complexity per item
- Server capacity
- Expected client batch sizes

**Decision Tree**:
```
Is each item in the batch large (10+ fields, nested data, file uploads)?
├── YES → Set max batch size low: 10-20 items — prevent memory and processing overhead
└── NO → Is each item lightweight (2-5 fields, no nesting)?
    ├── YES → Set max batch size moderate: 50-100 items
    └── NO → Is processing per item expensive (DB writes, external API calls)?
        ├── YES → Set max batch size low: 10-25 items — bound processing time
        └── NO → Set max batch size: 50 (default — balances throughput and safety)
```

**Rationale**: Batch size must be limited to prevent resource exhaustion. Lighter items allow larger batches.

**Recommended Default**: 50 items for typical payloads. 20 for complex payloads. 100 for simple payloads.

**Risks**: Too-high limits enable DoS via resource exhaustion. Too-low limits frustrate legitimate bulk operations.

---

## Tree 2: Partial Success vs All-or-Nothing

**Decision Context**: Whether to accept partial success (process valid items, reject invalid) or reject the entire batch on any failure.

**Decision Criteria**:
- Atomicity requirements
- Client expectations
- Business logic constraints

**Decision Tree**:
```
Is the operation financial or otherwise atomic (all items must succeed or none)?
├── YES → All-or-nothing — reject entire batch on any failure; wrap in DB transaction
└── NO → Is the operation a data import or sync where partial success is acceptable?
    ├── YES → Partial success — return 200/201 with meta.failed count and per-item errors
    └── NO → Are items independent of each other (no cross-item dependencies)?
        ├── YES → Partial success — process valid items independently
        └── NO → All-or-nothing — items have dependencies; must all succeed or reject
```

**Rationale**: Partial success is more forgiving for imports and syncs. All-or-nothing is required for financial atomicity.

**Recommended Default**: Partial success for most bulk operations. All-or-nothing only for operations requiring atomicity.

**Risks**: Partial success without clear error reporting leaves clients unable to identify failed items. All-or-nothing for independent items causes unnecessary rework.
