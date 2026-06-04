# Decision Trees — Repository vs Eloquent Decision

## Tree 1: Hybrid Selection

**Decision Context**: Whether to use a repository pattern or direct Eloquent calls for a specific entity.

**Decision Criteria**:
- Query complexity per entity
- Multi-tenancy requirements
- Caching decoration needs
- Entity criticality

**Decision Tree**:
```
Does the entity have complex queries with 3+ conditional filters, dynamic sorting, or search?
├── YES → Use repository for this entity — centralize query complexity
└── NO → Does the entity require multi-tenant scoping on every access?
    ├── YES → Use repository — enforce consistent tenant isolation
    └── NO → Does the entity need caching at the data access layer?
        ├── YES → Use repository — decorator pattern adds caching transparently
        └── NO → Use direct Eloquent — entity is simple, ceremony not justified
```

**Rationale**: The hybrid approach evaluates each entity independently. Repositories are justified by complexity, scoping, or caching needs.

**Recommended Default**: Direct Eloquent for 90% of entities. Repository for 10% with complex queries, multi-tenancy, or caching needs.

**Risks**: Dogmatic "repositories for all" creates unnecessary ceremony. Dogmatic "repositories never" leaves complex queries scattered across the codebase.

---

## Tree 2: Migration Path from Direct Eloquent to Repository

**Decision Context**: When to migrate an existing entity from direct Eloquent to repository pattern.

**Decision Criteria**:
- Query duplication count
- New cross-cutting concern (multi-tenancy, caching)
- Entity complexity trajectory

**Decision Tree**:
```
Is the same query pattern duplicated across 3+ call sites?
├── YES → Extract to repository — centralization eliminates duplication
└── NO → Has a cross-cutting concern emerged (multi-tenancy, caching, audit logging)?
    ├── YES → Extract to repository — the concern needs a single enforcement point
    └── NO → Is the entity's query complexity expected to grow?
        ├── YES → Extract to repository proactively — easier to add before complexity lands
        └── NO → Keep direct Eloquent — no current or foreseeable justification for repository
```

**Rationale**: Migration is driven by observable duplication, new cross-cutting concerns, or anticipated complexity growth.

**Recommended Default**: Extract when query duplication reaches 3+ call sites or a cross-cutting concern emerges.

**Risks**: Extracting too early adds ceremony without current benefit. Extracting too late means paying the cost of scattered refactoring across many files.
