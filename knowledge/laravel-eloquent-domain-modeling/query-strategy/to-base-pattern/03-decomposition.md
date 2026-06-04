# Decomposition: To Base Pattern

## Knowledge Unit Breakdown

### 1. `toBase()` Method Internals
- 1.1 Source code in Eloquent Builder
- 1.2 Return type: `Illuminate\Database\Query\Builder`
- 1.3 Relationship between `$this->query` and returned builder
- 1.4 Shared reference vs clone behavior
- 1.5 Table name preservation

### 2. What `toBase()` Preserves
- 2.1 WHERE clauses and bindings
- 2.2 JOIN clauses and bindings
- 2.3 ORDER BY, GROUP BY, HAVING
- 2.4 LIMIT/OFFSET
- 2.5 SELECT columns
- 2.6 Raw expressions

### 3. What `toBase()` Does NOT Preserve
- 3.1 Eager loads (`with()`)
- 3.2 Pending global scopes that apply at execution
- 3.3 Model-specific `$casts`, `$appends`, `$with` on model
- 3.4 `SoftDeletingScope` application timing
- 3.5 `retrieved` event firing

### 4. Call Position in Chain
- 4.1 Before vs after scope application
- 4.2 Before vs after `with()` calls
- 4.3 Before vs after `select()` calls
- 4.4 Correct ordering pattern

### 5. Common Execution Methods After `toBase()`
- 5.1 `->get()` — returns array of stdClass
- 5.2 `->first()` — returns single stdClass or null
- 5.3 `->value($column)` — returns single value
- 5.4 `->pluck($column, $key)` — returns array
- 5.5 `->count()` / `->exists()` — returns scalar
- 5.6 `->chunk($count, $callback)` — paginated iteration
- 5.7 `->cursor()` — lazy generator of stdClass

### 6. Interaction with Scopes
- 6.1 Local scopes — applied via `scopeX()` before `toBase()`, always preserved
- 6.2 Global scopes — applied in `boot()`, typically applied before `toBase()` resolves
- 6.3 Dynamic scopes — call-time parameter scopes applied before `toBase()`
- 6.4 Scope evaluation order edge cases

### 7. Shared Reference Management
- 7.1 Modifying QB after `toBase()` affects original Eloquent Builder
- 7.2 Clone pattern: `clone $builder->getQuery()`
- 7.3 Use cases for shared vs isolated references
- 7.4 Thread safety considerations (queues, concurrent access)

### 8. Comparison with Alternatives
- 8.1 `DB::table('users')->where(...)` — full QB approach
- 8.2 `User::where(...)->get()` — pure Eloquent
- 8.3 `User::where(...)->cursor()` — lazy Eloquent hydration
- 8.4 `User::where(...)->toBase()->get()` — hybrid
- 8.5 Use case matrix: which to choose

### 9. Testing Strategies
- 9.1 Testing with `toBase()` and asserting stdClass results
- 9.2 Testing both Eloquent and QB paths
- 9.3 Asserting SQL output with `toSql()`
- 9.4 Performance regression tests

### 10. Migration Patterns
- 10.1 Identifying candidates for `toBase()` optimization
- 10.2 Converting `with()` to subqueries when using `toBase()`
- 10.3 Partial migration (toBase for reads, Eloquent for writes)
- 10.4 Full migration to `DB::table()` when `toBase()` is insufficient
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization