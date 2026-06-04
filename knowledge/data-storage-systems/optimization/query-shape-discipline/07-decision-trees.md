# Decision Trees for 4-21 Query Shape Discipline

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-21 |
| Title | Query Shape Discipline |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: List vs detail view query separation
- D2: API Resource per view vs shared resource
- D3: Scope-based query shape management

## Architecture-Level Decision Trees

### D1: List vs detail view query separation

**Decision Context**: Design separate queries for list (multiple items) and detail (single item) endpoints.

**Criteria**:
- Number of rows displayed
- Relationship depth needed
- Column count

**Tree**:
```
Is this a list index or single item view?
├── List (multiple items)
│   └── Minimal: 1-3 columns, 1-2 relationships, paginated
│       scopeForList: ->select('id', 'title')->with('author:id,name')
└── Detail (single item)
    └── Full: all columns, all relationships, computed attributes
        scopeForDetail: ->with('comments', 'tags', 'metadata')
```

**Rationale**: Single query serving both use cases loads too much data for list views. Separate scopes ensure each endpoint loads only what it needs.

**Default**: Always define separate `scopeForList` and `scopeForDetail` on models with multiple endpoint tiers.

**Risks**: DRY violations if scopes are very similar. Accept duplication for performance.

**Related Rules/Skills**: 2-27 (API resource classes)

---

### D2: API Resource per view vs shared resource

**Decision Context**: Choose between shared API Resource and view-specific Resources.

**Criteria**:
- Number of view differences
- Development velocity
- Maintenance burden

**Tree**:
```
Do list and detail views share < 50% of attributes?
├── Yes → Separate resources (PostListResource, PostDetailResource)
└── No → Shared resource with conditional attributes
```

**Rationale**: Separate resources provide clarity and prevent accidental data leakage. Shared resources with conditionals become complex as the number of endpoints grows.

**Default**: Separate resources per view tier.

**Risks**: Separate resources increase file count but reduce cognitive load per file.

**Related Rules/Skills**: 2-27 (API resource classes)

---

### D3: Scope-based query shape management

**Decision Context**: Organize query shapes using Eloquent scopes for consistency.

**Criteria**:
- Model complexity (number of endpoints)
- Team size
- Reuse patterns

**Tree**:
```
Does the model serve 3+ unique endpoint types?
├── Yes → Local scopes per endpoint tier
│   scopeForList, scopeForDetail, scopeForExport
└── No → Inline query definition
```

**Rationale**: Local scopes encapsulate query shape decisions and ensure consistency across call sites.

**Default**: Local scopes for models with 3+ endpoint types.

**Risks**: Scope chaining can produce unexpected WHERE combinations.

**Related Rules/Skills**: 2-10 (query builder methods)

---
