# Decision Trees: Resource Collection

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Resource Collection |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Anonymous vs named ResourceCollection | Primary |
| 2 | Paginated vs non-paginated collection | Architecture |
| 3 | Collection-level metadata strategy | Architecture |
| 4 | Custom collection toArray() structure | Architecture |

---

## Decision 1: Anonymous vs Named ResourceCollection

### Context
`Resource::collection()` returns an anonymous collection resource for simple listings. Named `ResourceCollection` subclasses allow overriding collection-wide behavior. The choice depends on metadata and customization needs.

### Criteria
- Does the collection need custom metadata (totals, aggregates, status)?
- Is the pagination structure customized?
- Does the collection need a specific `$collects` resource class?
- Is the collection reused across multiple endpoints?

### Decision Tree
```
Does the collection need custom metadata or behavior?
├── NO → Resource::collection() is sufficient
└── YES
    └── Are multiple endpoints sharing the same collection logic?
        ├── YES → Named ResourceCollection subclass
        └── NO → Named ResourceCollection subclass (single use is fine)
```
```
Are the collection items from a different resource than the calling resource?
├── YES → Named ResourceCollection with $collects explicitly set
└── NO → Resource::collection() or named class
```
```
Is pagination metadata customized beyond defaults?
├── YES → Named ResourceCollection with paginationInformation() override
└── NO → Resource::collection() may suffice
```

### Rationale
Anonymous collections work for simple pass-through listings. Once metadata, custom pagination, or a different item resource is needed, a named class avoids putting structural logic in controllers. `$collects` prevents silent resolution failures when the convention-based name matching doesn't align.

### Recommended Default
Start with `Resource::collection()` for simple listings. Graduate to a named `ResourceCollection` subclass at the first sign of custom metadata, pagination changes, or cross-endpoint reuse.

### Risks
- Anonymous collection needing custom metadata: forces workarounds outside the resource
- Missing `$collects`: resolves to wrong resource class silently
- Named class for every collection: unnecessary boilerplate for simple endpoints

### Related Rules/Skills
- Custom Collection Class for Metadata (05-rules.md)
- Explicit $collects (05-rules.md)

---

## Decision 2: Paginated vs Non-Paginated Collection

### Context
Resource collections auto-detect paginators and include `links`/`meta` in the response. Non-paginated collections return `{"data": [...]}` without metadata. Unpaginated collections risk unbounded memory and response size.

### Criteria
- Could the collection exceed 100 items?
- Is the endpoint consumed by a UI with infinite scroll or pagination controls?
- Does the API specification require pagination?
- Is the collection size bounded by business rules (e.g., "latest 5 posts")?

### Decision Tree
```
Could the collection grow unbounded as data grows?
├── YES → MUST paginate (length-aware or cursor)
│   └── Do consumers need arbitrary page navigation?
│       ├── YES → LengthAwarePaginator (page/offset)
│       └── NO → CursorPaginator (cursor-based, infinite scroll)
└── NO (bounded by business rules)
    └── Are there more than ~100 items?
        ├── YES → Consider pagination for performance
        └── NO → Non-paginated collection is acceptable
```

### Rationale
Unpaginated collections scale linearly with database rows — a 100k-row table returned as a collection consumes 100k resource objects and creates a multi-MB response. Pagination is the standard defense. Cursor pagination provides stable ordering for real-time feeds; length-aware pagination provides UI page controls.

### Recommended Default
Paginate all listing endpoints with `Model::paginate()` (length-aware) unless the collection is inherently bounded (e.g., "latest 5 posts", "user's 3 active roles").

### Risks
- Unpaginated collection with unbounded growth: OOM on large datasets
- Pagination overhead on small bounded lists: unnecessary structure
- Wrong pagination type (length-aware vs cursor): consumer incompatibility
- No pagination on admin endpoints: admin exports become unmanageable

### Related Rules/Skills
- Always Paginate (05-rules.md)
- Pagination Type Selection (05-rules.md)

---

## Decision 3: Collection-Level Metadata Strategy

### Context
Collections can include metadata via `with()` (top-level addition) or by customizing `toArray()` (restructuring the data envelope). The choice affects whether metadata appears inside or alongside `data`.

### Criteria
- Is the metadata structural (wrapping key, version) or data-related (totals, aggregates)?
- Should metadata be consistent across all collection endpoints?
- Does the frontend expect metadata at a specific location?

### Decision Tree
```
Is the metadata structural/consistent across all endpoints?
├── YES → with() — metadata at the data level
│   └── Example: status, version, timestamp
└── NO (endpoint-specific computed values)
    └── Is the metadata derived from the collection data?
        ├── YES → toArray() — metadata inside the collection structure
        │   └── Example: total_active, aggregate counts
        └── NO → with() — general API metadata
```
```
Does the pagination metadata structure need to change?
├── YES → Override paginationInformation() in the collection class
└── NO → Default pagination metadata is fine
```

### Rationale
`with()` adds metadata at the response root level, separate from `data`. This is ideal for consistent API-level metadata. Collection-specific computed values (aggregates, filtered counts) belong in `toArray()` alongside the data they describe. Separating these concerns keeps the collection class maintainable.

### Recommended Default
Use `with()` for API-level metadata (status, version). Use `toArray()` for collection-specific computed values. Override `paginationInformation()` only when the default format doesn't match the API spec.

### Risks
- Metadata in wrong location: frontend cannot find it
- `paginationInformation()` not overridden: non-standard API spec violations
- Heavy computation in `with()` or `toArray()`: response time regression
- Leaking internal data through metadata: security concern

### Related Rules/Skills
- with() for API Metadata (05-rules.md)
- toArray() for Collection Data (05-rules.md)
- paginationInformation() Override (05-rules.md)

---

## Decision 4: Custom Collection toArray() Structure

### Context
Override `toArray()` in `ResourceCollection` to customize the collection-level array structure. The default returns `{'data': $this->collection}`. Customization must handle item mapping, additional keys, and key preservation.

### Criteria
- Does the collection need keys beyond `data`?
- Should items be processed or filtered at the collection level?
- Are original collection keys preserved (`$preserveKeys = true`)?
- Is the `toArray()` performing per-item transformations?

### Decision Tree
```
Does the collection need additional top-level keys beyond data?
├── YES
│   └── Are the additional keys meta/status or data derivations?
│       ├── Meta/status → Include alongside data in toArray() return
│       └── Data derivations → Compute in toArray(), keep separate from data
└── NO → Stick with default structure from parent
```
```
Does toArray() perform per-item transformations?
├── YES → WRONG — per-item logic belongs in the item Resource
│   └── Refactor: move transformation to item Resource
└── NO → Collection toArray() only wraps and adds metadata
```
```
Are the original collection keys meaningful (non-sequential)?
├── YES → Set $preserveKeys = true on the collection class
└── NO → Default re-indexing is fine (0, 1, 2...)
```

### Rationale
Collection `toArray()` should wrap — not transform. Per-item logic in the collection violates separation of concerns and duplicates item resource logic. Key preservation is opt-in because sequential JSON arrays are expected by most consumers.

### Recommended Default
Let the default `toArray()` handle item mapping. Only override to add collection-level keys. Never perform per-item transformations in collection `toArray()`.

### Risks
- Per-item logic in collection toArray(): duplicated logic, maintenance burden
- $preserveKeys without consumer awareness: unexpected JSON structure
- Not calling $this->collection in custom toArray(): items are missing
- Modifying $this->collection inside toArray(): side effects on paginator

### Related Rules/Skills
- Collection Wraps Only (05-rules.md)
- Item Logic in Item Resource (05-rules.md)
- Key Preservation Awareness (05-rules.md)
