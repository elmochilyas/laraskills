# Decision Trees: Pagination

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Pagination |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Pagination strategy (length-aware vs cursor) | Primary |
| 2 | per_page capping and defaults | Architecture |
| 3 | Pagination metadata structure | Architecture |

---

## Decision 1: Pagination Strategy (Length-Aware vs Cursor)

### Context
Length-aware pagination (`paginate()`) executes a `COUNT(*)` and provides total counts. Cursor pagination (`cursorPaginate()`) uses a seek method with no count. The choice depends on dataset size and client needs.

### Criteria
- Does the dataset exceed 100k rows?
- Does the client need total count, page numbers, or specific page access?
- Is the table updated frequently (append-heavy)?
- Is stable ordering across pages required?

### Decision Tree
```
Does the underlying table exceed 100k rows?
├── YES → Prefer cursor pagination
│   └── Does the client need total count or page numbers?
│       ├── YES → Consider caching the count or using estimated counts
│       └── NO → Cursor pagination is ideal
└── NO
    └── Does the client need total count, last page, or random page access?
        ├── YES → Length-aware pagination (paginate())
        └── NO → Simple pagination (simplePaginate()) or cursor
```

### Rationale
`COUNT(*)` on tables > 100k rows can take seconds, especially with complex WHERE clauses. Cursor pagination avoids this by using `WHERE cursor > ? LIMIT ?`. However, cursor pagination does not support "jump to page 5" or display total count — required for many admin UIs and table displays.

### Recommended Default
Length-aware for datasets < 100k rows or admin panels needing total counts. Cursor for datasets > 100k rows or infinite-scroll feeds. Simple pagination for medium datasets where total count is unnecessary.

### Risks
- Length-aware pagination on 50M rows: count query timeout
- Cursor pagination for numbered navigation: cannot provide total pages
- Pagination without stable `ORDER BY`: duplicate/skewed results across pages
- Cursor pagination on non-unique column: skipped or duplicated rows

### Related Rules/Skills
- Dataset Size Threshold (05-rules.md)
- Cursor Pagination Requirements (05-rules.md)
- Stable Ordering (05-rules.md)

---

## Decision 2: per_page Capping and Defaults

### Context
Uncapped `per_page` allows clients to request arbitrarily large pages, causing memory exhaustion and slow responses. A sensible default with a hard cap prevents abuse.

### Criteria
- Is `per_page` accepted from request input?
- Is there a maximum page size that prevents memory issues?
- Is there a default that matches typical UI behavior?
- Is the cap enforced at the controller or paginator level?

### Decision Tree
```
Is per_page accepted from request input?
├── YES
│   └── Is there a maximum cap applied?
│       ├── YES → min($request->per_page, 100)
│       │   └── Is there a minimum (prevent per_page=0)?
│       │       ├── YES → max(1, min($perPage, 100))
│       │       └── NO → Add minimum check
│       └── NO → MUST add cap (security issue)
└── NO (fixed per_page)
    └── Use application default (typically 15-50)
```

### Rationale
`User::paginate(perPage: 100000)` loads 100k models into memory — easily exceeding PHP memory limits. Capping at 100-200 prevents this while still allowing generous page sizes. The cap should be enforced consistently, ideally in a base controller or pagination macro.

### Recommended Default
`min($request->per_page, 100)` as the cap. Default of 15-25 for most listing endpoints. Apply the cap in the controller or a base pagination method.

### Risks
- No cap: client requests 1M per_page, memory exhaustion, OOM kill
- Cap too low: legitimate use cases (bulk export) forced into multiple requests
- Cap too high: single page still causes memory pressure
- Inconsistent caps across endpoints: some endpoints vulnerable, others not

### Related Rules/Skills
- per_page Cap (05-rules.md)
- Pagination Defaults (05-rules.md)
- Consistent Enforcements (05-rules.md)

---

## Decision 3: Pagination Metadata Structure

### Context
Pagination metadata (`links`, `meta` keys) varies by paginator type. The structure must be consistent across the API and match documentation.

### Criteria
- Is there an API specification dictating metadata format?
- Are both paginator types used across the API?
- Is custom metadata needed (server_time, version)?
- Do consumers rely on specific key names?

### Decision Tree
```
Does the API specification dictate metadata format?
├── YES → Match the spec exactly
│   └── Override paginationInformation() in ResourceCollection
└── NO
    └── Is custom metadata needed (server_time, version)?
        ├── YES → Override paginationInformation() in base collection
        └── NO → Use default Laravel pagination metadata
```

### Rationale
Default Laravel pagination metadata (`current_page`, `last_page`, `per_page`, `total`, `links`) is well-documented and familiar to developers. Custom metadata should be added via `paginationInformation()` override without removing the standard keys unless the API spec requires it.

### Recommended Default
Default Laravel pagination metadata. Add custom metadata via `paginationInformation()` if needed, keeping standard keys intact. Override completely only when conforming to a specific spec (JSON:API, etc.).

### Risks
- Inconsistent metadata across endpoints: consumer confusion
- Breaking changes to metadata keys: consumer parsing errors
- Missing `paginationInformation()` override in custom collection class
- Custom metadata that leaks internal information (server timezone, internal IDs)

### Related Rules/Skills
- Pagination Metadata Defaults (05-rules.md)
- paginationInformation() Override (05-rules.md)
- Breaking Change Awareness (05-rules.md)
