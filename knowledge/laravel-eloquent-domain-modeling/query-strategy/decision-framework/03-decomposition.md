# Decomposition: Decision Framework

## Knowledge Unit Breakdown

### 1. Eloquent ORM Characteristics
- 1.1 Model hydration pipeline
- 1.2 Relationship loading (eager, lazy, lazy eager)
- 1.3 Model events lifecycle
- 1.4 Attribute casting and accessors/mutators
- 1.5 Serialization (toArray, toJson, API Resources)
- 1.6 Global and local scopes
- 1.7 Soft deletes and timestamps

### 2. Query Builder Characteristics
- 2.1 stdClass result hydration
- 2.2 No model layer (no events, casts, scopes)
- 2.3 Direct SQL generation
- 2.4 Explicit join and subquery management
- 2.5 Raw expression support

### 3. The `toBase()` Escape Hatch
- 3.1 Method signature and implementation
- 3.2 What `toBase()` preserves (builder features)
- 3.3 What `toBase()` skips (hydration, events)
- 3.4 Position in the decision framework

### 4. Decision Criteria
- 4.1 Result set size (single record vs bulk)
- 4.2 Need for model events
- 4.3 Need for relationships
- 4.4 Need for scopes
- 4.5 Need for serialization
- 4.6 Need for raw SQL features
- 4.7 Reporting vs transactional context

### 5. Performance Characteristics
- 5.1 Hydration overhead per row
- 5.2 Memory per hydrated model (attribute bag, relationships)
- 5.3 Bulk operation performance (inserts, updates, deletes)
- 5.4 Eager loading overhead vs join overhead
- 5.5 Query compilation cost

### 6. Common Usage Scenarios Matrix
- 6.1 CRUD operations → Eloquent
- 6.2 Complex reports → Query Builder
- 6.3 Bulk imports → Query Builder
- 6.4 API responses → Eloquent (with API Resources)
- 6.5 Dashboard analytics → Query Builder or toBase()
- 6.6 Export jobs → Query Builder or toBase()

### 7. Migration Strategy
- 7.1 Starting with Eloquent (default)
- 7.2 Profiling and identifying hot paths
- 7.3 Migrating to `toBase()` first
- 7.4 Migrating to Query Builder when needed
- 7.5 Repository/query object abstraction

### 8. Risk Assessment
- 8.1 Missing soft deletes with QB
- 8.2 Missing global scopes with QB
- 8.3 Breaking event-driven side effects
- 8.4 Inconsistent serialization
- 8.5 Testing differences (model factories vs raw data)

### 9. Organizational Conventions
- 9.1 Team decision rules and guidelines
- 9.2 Code review checklist for strategy choice
- 9.3 Abstraction boundaries (infrastructure vs domain)
- 9.4 Documentation of strategy decisions in code

### 10. Case Studies
- 10.1 Refactoring a report from Eloquent to QB (performance improvement)
- 10.2 Migrating from QB to Eloquent for event support
- 10.3 Hybrid: QB join + manual model hydration
- 10.4 CQRS-inspired read models vs Eloquent reads
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization