# Decision Trees: Appends

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Appends |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | $appends vs append() vs API Resource | Primary |
| 2 | Performance management for appended accessors | Architecture |
| 3 | Hidden/visible interaction with appends | Architecture |

---

## Decision 1: $appends vs append() vs API Resource

### Context
`$appends` globally includes computed attributes in serialization. `append()` does it per-instance. API Resources provide another layer for computed fields. The choice depends on scope (global vs per-endpoint) and serialization channel.

### Criteria
- Is the computed attribute needed in EVERY serialization?
- Is the serialization for HTTP API responses or multiple channels?
- Is the accessor expensive (queries, heavy computation)?
- Is the attribute specific to one endpoint or context?

### Decision Tree
```
Is the computed attribute needed in EVERY serialization?
├── YES → Use $appends on the model
│   └── Is the accessor expensive (queries, computation)?
│       ├── YES → Add instance caching in accessor
│       └── NO → Proceed with $appends
└── NO (needed in specific endpoints only)
    └── Is the serialization HTTP-only?
        ├── YES → Use API Resource with when() or whenLoaded()
        └── NO (multi-channel: API + queue + events)
            └── Use append() at the call site
```

### Rationale
`$appends` is global — every `toArray()` call triggers the accessor. This is appropriate for lightweight, universally-needed computed values. For endpoint-specific values, API Resources provide conditional inclusion. For non-HTTP channels, `append()` per-instance is more appropriate than model-level `$appends`.

### Recommended Default
`$appends` for lightweight computed values needed everywhere. API Resources for HTTP-specific computed fields. `append()` for per-instance or conditional inclusion.

### Risks
- Expensive accessor in `$appends`: serialization cost on every `toArray()` call
- Missing accessor for `$appends` entry: `BadMethodCallException` at serialization time
- N+1 from relationship access in appended accessor if not eager-loaded
- `$appends` on listing endpoints: serialization cost multiplies by page size

### Related Rules/Skills
- Instance Caching for Expensive Accessors (05-rules.md)
- API Resource Conditional Fields (05-rules.md)
- Hidden/Visible Filtering (05-rules.md)

---

## Decision 2: Performance Management for Appended Accessors

### Context
Appended accessors run on every `toArray()` call. For listing endpoints, this multiplies by the page size. Expensive accessors (DB queries, heavy computation) must be optimized.

### Criteria
- Does the accessor run database queries?
- Is the computation expensive (> 1ms)?
- Is the model serialized in listing endpoints (many instances)?
- Can the result be cached per-instance?

### Decision Tree
```
Does the accessor run database queries or expensive computation?
├── YES
│   └── Can the result be cached per-instance?
│       ├── YES → Use $this->cached ??= compute()
│       └── NO → Move to API Resource or append() at call site
└── NO (simple computation, no queries)
    └── $appends is safe for performance
        └── Verify no relationship load in accessor without eager loading
```

### Rationale
Instance caching (`$this->cached ??= $this->compute()`) ensures the accessor runs only once per model instance, even if `toArray()` is called multiple times. For accessors that query the database, consider whether the value should be a regular attribute instead. If the accessor queries a relationship, ensure it's eager-loaded at the query site.

### Recommended Default
Instance caching for any accessor with non-trivial computation. Eager-load relationships used in accessors. Move expensive accessors to API Resources or DTOs.

### Risks
- Accessor querying relation without eager loading: N+1 on collection serialization
- Computation on every list endpoint item: serialization time = N × accessor time
- Accessor that writes to cache/database: side effect in what should be a read-only operation
- Instance cache grows unbounded: per-instance caching doesn't leak across instances

### Related Rules/Skills
- Instance Caching Pattern (05-rules.md)
- Eager Load for Appended Relations (05-rules.md)
- API Resource Alternative (05-rules.md)

---

## Decision 3: Hidden/Visible Interaction with Appends

### Context
Appended attributes are subject to `$hidden`/`$visible` filtering. A sensitive appended value can be exposed if not added to `$hidden`. Conversely, an appended value added to `$visible` ensures it's always included.

### Criteria
- Does the appended accessor compute sensitive data?
- Is the accessor conditionally needed (admin vs public)?
- Is `$visible` used as an allow-list on the model?
- Could the appended value reveal information about the model state?

### Decision Tree
```
Does the appended accessor return sensitive data?
├── YES
│   └── Is $visible used as an allow-list?
│       ├── YES → Add the append to $visible
│       └── NO → Add the append to $hidden for safety
└── NO
    └── Is the append conditionally needed (admin only)?
        ├── YES → Use makeHidden()/makeVisible() at call site
        └── NO → Proceed without hidden/visible consideration
```

### Rationale
`$hidden` and `$visible` apply to all attributes including appended ones. If a sensitive appended value needs to be hidden from some consumers but visible to others, use runtime `makeHidden()`/`makeVisible()` or, better, API Resources with `when()` conditional inclusion.

### Recommended Default
Add sensitive appended attributes to `$hidden` as a safety net. Use `makeVisible()` at the controller level for authorized users. For complex visibility, use API Resources.

### Risks
- Sensitive append not in `$hidden`: data leaked in all serialization
- Append in `$visible` but accessor fails: serialization error
- Runtime `makeHidden` on shared instance: mutation affects downstream consumers
- Append computed from relationship data: excluding the relation but including the computed value

### Related Rules/Skills
- Hidden for Sensitive Data (05-rules.md)
- Runtime makeHidden/makeVisible (05-rules.md)
- API Resource Conditional Inclusion (05-rules.md)
