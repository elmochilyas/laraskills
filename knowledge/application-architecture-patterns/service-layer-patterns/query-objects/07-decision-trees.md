# Decision Trees: Query Objects as Alternative to Repositories

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Query objects as alternative to repositories
- **Knowledge Unit ID:** SLP-16
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Query object vs model scope vs repository | Architecture | Data access strategy |
| 2 | Query object read-only vs hybrid with writes | Architecture | Query object design |
| 3 | Return DTOs/arrays vs Eloquent models | Architecture | Query object return type |

---

## Decision 1: Query object vs model scope vs repository

### Context
Three patterns encapsulate query logic: model scopes (simplest, on the model), query objects (dedicated class for complex reads), and repositories (read+write with feature methods). The choice depends on query complexity, write requirements, and architectural preference. The simplest adequate solution is usually best.

### Decision Tree

```
Is the query a simple filter on a single model?
├── YES → Use model scope
│   `scopeActive($query)` on the model itself — simplest encapsulation
└── NO (complex query, cross-entity joins, aggregations)
    → Does the entity need both reads and writes centralized?
    ├── YES → Use feature-oriented repository
    │   Repository has both query methods and write operations
    └── NO (reads only, or already using direct Eloquent for writes)
        → Use query object
        Is the query used by multiple services/controllers?
        ├── YES → Query object avoids duplication
        └── NO → Consider keeping inline if it's one-off logic
```

### Rationale
Model scopes are the simplest query encapsulation and should be the default. Query objects fill the gap when a scope is too limiting (cross-entity, complex aggregations) but a repository's write overhead isn't needed. Repositories bundle read+write access for entities. Query objects are read-only and focused, making them lighter than repositories for read-heavy scenarios.

### Recommended Default
Model scopes for simple single-model queries; query objects for complex cross-entity reads

### Risks
- Duplication: same query in scope + query object creates two sources of truth
- Query object explosion: creating a class for every query instead of grouping related queries
- Over-abstraction: query object for `User::find($id)` adds ceremony without value

### Related Rules
- Keep Query Objects Read-Only (SLP-16/05-rules.md)
- Don't Create A Query Object For Every Query (SLP-16/05-rules.md)
- Avoid Duplication With Model Scopes (SLP-16/05-rules.md)

### Related Skills
- Design Query Objects as Read-Only Query Encapsulation (SLP-16/06-skills.md)
- Decide When to Use Repository Pattern (SLP-14/06-skills.md)
- Create Feature-Oriented Repository Methods (SLP-15/06-skills.md)

---

## Decision 2: Query object read-only vs hybrid with writes

### Context
Query objects, by definition, encapsulate read operations. The temptation is to add write methods for convenience. This blurs the line between query objects and repositories, violating single-responsibility principle and CQRS separation. Query objects should remain pure read abstractions.

### Decision Tree

```
Does the class under design need both read and write operations?
├── YES → This is a repository, not a query object
│   Rename to `*Repository` and add feature-oriented methods
│   Do NOT use a query object hybrid
└── NO (reads only)
    → Keep as query object, read-only
    Does the query need authorization/tenant scoping?
    ├── YES → Accept user/tenant context as method parameter
    │   `execute(int $days, ?Tenant $tenant): array`
    └── NO → Pure query, no context needed
        Is the query complex enough to test in isolation?
        ├── YES → Query object is justified — add integration test
        └── NO → Too simple for a query object — use model scope or inline
```

### Rationale
Adding write methods to a query object creates a hybrid that violates single-responsibility principle. Query objects should encapsulate SELECT queries only. Write operations belong in repositories or services. The name "query object" signals read-only intent. A class with both `execute()` and `create()` methods confuses consumers and breaks the mental model.

### Recommended Default
Query objects are strictly read-only; write methods belong in repositories or services

### Risks
- Hybrid query object: blurs read/write separation, violates SRP
- Write method in query object: consumers may not expect side effects from a "query"
- Scope creep: one write method leads to more, eventually the class becomes a repository

### Related Rules
- Keep Query Objects Read-Only (SLP-16/05-rules.md)
- Prefer Query Objects Over Repositories For Read-Heavy Applications (SLP-16/05-rules.md)
- Query Objects Must Respect Authorization Boundaries (SLP-16/05-rules.md)

### Related Skills
- Design Query Objects as Read-Only Query Encapsulation (SLP-16/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
- Implement Data Transfer Objects (SLP-05/06-skills.md)

---

## Decision 3: Return DTOs/arrays vs Eloquent models

### Context
Query objects serve read-only views — reports, dashboards, search results, API responses. Returning Eloquent models couples consumers to the ORM, enables lazy loading, and prevents read-model optimization. Returning DTOs or arrays decouples consumers and allows selecting only needed columns.

### Decision Tree

```
Does the consumer need Eloquent features (lazy loading, relationship updates, model events)?
├── YES → Return Eloquent models (but verify N+1 won't occur)
│   Consider if a query object is the right pattern — models are usually for write paths
└── NO (consumer just needs the data)
    → Return DTOs or arrays
    Does the query need select-column optimization?
    ├── YES → DTO with specific columns selected in the query
    │   `select('id', 'name', 'total')` and map to DTO
    └── NO → Simple array or collection of arrays
        Does the consumer need strongly typed data?
        ├── YES → Create a readonly DTO class
        └── NO → Arrays are fine for simple display data
```

### Rationale
Query objects are for reading data. Eloquent models are for objects that need ORM features. Read-only views rarely need `save()`, `update()`, or relationship lazy loading — they just need data. DTOs or arrays prevent accidental N+1 queries, enable query optimization (select only needed columns), and decouple read consumers from ORM changes. The overhead of mapping to DTOs is minimal and pays for itself in prevented bugs.

### Recommended Default
DTOs for structured query results with named fields; arrays for simple data dumps

### Risks
- Returning Eloquent models: N+1 lazy loading, no query optimization
- DTO over-engineering: creating a DTO class for every query result is too heavy
- Array without typing: no IDE support, runtime errors from typos

### Related Rules
- Return Arrays Or DTOs, Not Eloquent Models (SLP-16/05-rules.md)
- Keep Query Objects Read-Only (SLP-16/05-rules.md)
- Query Objects Must Respect Authorization Boundaries (SLP-16/05-rules.md)

### Related Skills
- Design Query Objects as Read-Only Query Encapsulation (SLP-16/06-skills.md)
- Implement Data Transfer Objects (SLP-05/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
