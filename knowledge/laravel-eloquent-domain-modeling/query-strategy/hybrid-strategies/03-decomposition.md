# Decomposition: Hybrid Strategies

## Knowledge Unit Breakdown

### 1. The `toBase()` Pattern
- 1.1 Method implementation in Eloquent Builder
- 1.2 What `toBase()` preserves (constraints, bindings)
- 1.3 What `toBase()` drops (eager loads, scopes pending application)
- 1.4 When to call `toBase()` in the chain

### 2. Direct Query Builder Access
- 2.1 `$eloquentBuilder->getQuery()` — raw QB reference
- 2.2 `$eloquentBuilder->setQuery($qb)` — QB replacement
- 2.3 Adding QB methods to an Eloquent chain
- 2.4 Use cases: raw joins, subqueries, JSON path expressions

### 3. Manual Hydration
- 3.1 `Model::hydrate(array $rows)` — bulk hydration from arrays
- 3.2 `Model::newFromBuilder(array $attributes)` — single row hydration
- 3.3 Partial hydration (hydrate only some rows from result set)
- 3.4 `$model->newInstance()` — blank instance hydration
- 3.5 Performance of `hydrate()` vs `get()`

### 4. Scope Reuse Across Abstraction Layers
- 4.1 Extracting scope logic to traits
- 4.2 Using scope traits in Query Builder contexts
- 4.3 Scope application helper methods
- 4.4 Testing scopes independently of hydration strategy

### 5. Binding Management Across Boundary
- 5.1 `mergeBindings()` method
- 5.2 Binding position preservation
- 5.3 Common binding order errors in hybrid patterns
- 5.4 Debugging hybrid bindings with `toRawSql()`

### 6. Hybrid Eager Loading
- 6.1 Manual join + select for relationship data
- 6.2 Subquery select for related aggregates
- 6.3 Manual relationship hydration vs eager loading
- 6.4 Partial hydration with relationship reconstruction

### 7. Query Object Pattern
- 7.1 Dedicated hybrid query class design
- 7.2 Encapsulating toBase() logic
- 7.3 Testability of query objects
- 7.4 Composition of query objects

### 8. CQRS-Inspired Hybrid
- 8.1 Read model classes for hybrid results
- 8.2 Separate read/write query strategies
- 8.3 Materialized views with hybrid hydration
- 8.4 Denormalized query optimization

### 9. Migration Paths
- 9.1 Starting with pure Eloquent
- 9.2 Identifying hybrid candidates
- 9.3 Step-by-step migration to hybrid
- 9.4 Full Query Builder migration when hybrid isn't enough

### 10. Testing Hybrid Strategies
- 10.1 Asserting SQL output with hybrid chains
- 10.2 Testing both hydration and non-hydration paths
- 10.3 Fixture design for hybrid query tests
- 10.4 Performance assertion tests
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization