# Decision Trees: Domain-Specific Query Methods

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Domain-Specific Query Methods |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | DSQM vs local scope selection | Primary |
| 2 | DSQM method granularity | Architecture |
| 3 | DSQM naming convention | Architecture |

---

## Decision 1: DSQM vs Local Scope Selection

### Context
Both DSQMs and local scopes encapsulate query logic. DSQMs live on custom builders and use domain language. Local scopes live on the model and use the `scope` prefix convention. DSQMs provide richer IDE support and organization for larger sets of methods.

### Criteria
- Does the model have 5+ query methods?
- Do the methods express business domain concepts?
- Is a custom builder already registered for this model?
- Is the method used across multiple code paths?

### Decision Tree
```
Does the model already have a custom builder?
├── YES
│   └── Do the methods express domain concepts?
│       ├── YES → Implement as DSQMs on the custom builder
│       └── NO (technical WHERE constraints) → Implement as local scopes
└── NO
    └── How many query methods are needed?
        ├── 1-4 → Local scopes on the model (simpler)
        │   └── Do they express domain concepts?
        │       ├── YES → Add @method annotation for readability
        │       └── NO → Technical scopes with where prefix
        └── 5+ → Create a custom builder and implement as DSQMs
```

### Rationale
DSQMs shine when there's a rich domain vocabulary to express — `published()`, `inStock()`, `eligibleForPromotion()`. For technical filters (`whereStatus('active')`), local scopes or even inline `where()` are sufficient. The threshold is both count (5+ methods justifies the overhead of a custom builder) and domain richness (the methods express business concepts, not just column filters).

### Recommended Default
Local scopes for 1-4 technical filters. Create a custom builder with DSQMs for 5+ domain-expressive methods. Always name with domain vocabulary.

### Risks
- DSQMs for technical filters: over-engineering for simple WHERE clauses
- DSQMs named after columns: `whereStatusPublished()` defeats the purpose
- No negation methods: `published()` exists but `unpublished()` doesn't
- Inconsistent domain language across models: `active()` means different things on User vs Post

### Related Rules/Skills
- Domain Vocabulary Naming (05-rules.md)
- Negation Method Convention (05-rules.md)
- Consistent Domain Language (05-rules.md)

---

## Decision 2: DSQM Method Granularity

### Context
DSQMs can be fine-grained (one constraint per method) or coarse-grained (a method that composes multiple constraints). The granularity affects composability, testability, and reusability.

### Criteria
- Does the DSQM represent a single business concept?
- Are there callers that need only part of the logic?
- Can the DSQM be tested independently?
- Does the DSQM have clear input/output behavior?

### Decision Tree
```
Does the concept represent a single business rule?
├── YES → Single constraint DSQM
│   └── Is the same rule expressed in different contexts?
│       ├── YES → Extract to single-purpose method
│       └── NO → Inline in composing DSQM
└── NO (composite concept made of sub-concepts)
    └── Are the sub-concepts ever used independently?
        ├── YES → Create separate methods for each sub-concept
        │   └── Combine at the call site
        └── NO → Single method with multiple constraints
            └── Is the method documented?
                ├── YES → Proceed
                └── NO → Add doc explaining the composite logic
```

### Rationale
Fine-grained DSQMs compose better. `published()` and `featured()` used separately at the call site are more reusable than `publishedAndFeatured()`. However, if the composite concept is a genuine domain rule (e.g., `eligibleForPromotion()` combines 4 checks that are never used separately), a single method is appropriate.

### Recommended Default
Prefer fine-grained (one domain concept per method). Compose at the call site. Exception: truly atomic domain concepts that should only be used together.

### Risks
- Too fine-grained: callers must chain 8 methods for a common query
- Too coarse: callers must call the same composite but with slight variations
- Hidden complexity: `popular()` silently adds WHERE, JOIN, ORDER BY, and LIMIT
- Missing parameterization: hard-coded values in DSQMs that should be configurable

### Related Rules/Skills
- Single Concept per Method (05-rules.md)
- Compose at Call Site (05-rules.md)
- Document Composite Methods (05-rules.md)

---

## Decision 3: DSQM Naming Convention

### Context
DSQM names are the vocabulary of the domain query language. They should be immediately understandable to developers and domain experts. Naming conventions establish consistency across the codebase.

### Criteria
- Is the name understandable without reading the implementation?
- Does the name use business terminology, not column names?
- Is there a corresponding negation method?
- Does the name conflict with a core builder method?

### Decision Tree
```
Does the name describe the WHAT, not the HOW?
├── YES (domain term like "published", "inStock", "verified")
│   └── Is there a natural negation?
│       ├── YES → Provide both published() and unpublished()
│       └── NO (irreversible concept) → Single method is fine
└── NO (technical description like "whereStatusPublished", "byColumnX")
    └── Rename to domain term
        └── What is the business concept?
            ├── Temporal → recent(), outdated(), expired()
            ├── State → active(), archived(), suspended()
            ├── Relationship → byAuthor(), withTeam(), ownedBy()
            └── Quantity → popular(), trending(), lowStock()
```

### Rationale
DSQMs should make code read like business specifications: `Post::published()->featured()->byAuthor($user)`. Names like `whereStatusPublished` expose implementation details (column names, comparison operators) instead of expressing intent. Consistent naming patterns create a predictable API that developers can use without reading implementations.

### Recommended Default
Verb-based for actions (`published()`), temporal for time (`recent()`), prepositional for relationships (`byUser()`), state-based for conditions (`active()`). Always provide negation methods for state-based DSQMs.

### Risks
- Column-based naming: `whereActive()` instead of `active()`
- Ambiguous naming: `available()` could mean different things across models
- Missing prefix/suffix collision: `scopePopular` vs `popular()` as DSQM on same model
- Inconsistent naming across models: `isActive()` on User, `active()` on Post

### Related Rules/Skills
- Domain Vocabulary Naming (05-rules.md)
- Negation Method Convention (05-rules.md)
- Consistent Domain Language (05-rules.md)
