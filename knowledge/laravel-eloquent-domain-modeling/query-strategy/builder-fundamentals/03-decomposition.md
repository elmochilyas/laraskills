# Decomposition: Builder Fundamentals

## Knowledge Unit Breakdown

### 1. Builder Architecture
- 1.1 Eloquent Builder (`Illuminate\Database\Eloquent\Builder`)
- 1.2 Query Builder (`Illuminate\Database\Query\Builder`)
- 1.3 Proxy relationship between Eloquent Builder and Query Builder
- 1.4 DatabaseConnection / DatabaseManager / Grammar / Processor roles
- 1.5 Builder instantiation flow: `Model::query()` → `newModelQuery()` → `newEloquentBuilder()`

### 2. Method Chaining Mechanics
- 2.1 The `$this` return pattern
- 2.2 Fluent interface definition
- 2.3 State accumulation on the builder object
- 2.4 Distinction between constraint and terminal methods
- 2.5 Reusing builder instances (mutable state pitfalls)

### 3. Constraint Methods
- 3.1 `where` family (`where`, `orWhere`, `whereIn`, `whereNotIn`, `whereBetween`, `whereNotBetween`, `whereNull`, `whereNotNull`, `whereDate`, `whereMonth`, `whereDay`, `whereYear`, `whereTime`, `whereColumn`, `whereExists`, `whereNotExists`, `whereRaw`)
- 3.2 `join` family (`join`, `leftJoin`, `rightJoin`, `crossJoin`, `joinWhere`, `joinSub`)
- 3.3 `orderBy` / `orderByDesc` / `orderByRaw` / `latest` / `oldest` / `reorder`
- 3.4 `groupBy` / `having` / `havingRaw`
- 3.5 `limit` / `take` / `offset` / `skip` / `distinct`

### 4. Terminal Methods
- 4.1 `get()` — collection hydration
- 4.2 `first()` / `firstOr()` / `firstOrFail()`
- 4.3 `find()` / `findOrFail()` / `findMany()`
- 4.4 `value()` / `pluck()` — scalar extraction
- 4.5 `count()` / `min()` / `max()` / `sum()` / `avg()` — aggregate methods
- 4.6 `exists()` / `doesntExist()`
- 4.7 `paginate()` / `simplePaginate()` / `cursorPaginate()`
- 4.8 `cursor()` — lazy collection iteration
- 4.9 `chunk()` / `chunkById()` — memory-safe chunked processing
- 4.10 `lazy()` / `lazyById()` — lazy collection with chunked loading

### 5. Dynamic Where Clauses
- 5.1 `whereFoo($value)` magic method resolution
- 5.2 `orWhereFoo($value)` variants
- 5.3 `whereFooBar($value1, $value2)` compound column syntax
- 5.4 Performance of dynamic wheres vs explicit wheres

### 6. Parameter Grouping and Nested Logic
- 6.1 Closure-based `where(fn $query => ...)` grouping
- 6.2 Boolean connectors (`and`, `or`)
- 6.3 Nested OR within AND and vice versa
- 6.4 Precedence control with nested groups

### 7. Raw Expressions and Bindings
- 7.1 `DB::raw('expression')`
- 7.2 `whereRaw`, `havingRaw`, `orderByRaw`, `groupByRaw`
- 7.3 Binding placeholders (`?`) and named bindings
- 7.4 `addBinding()` — manual binding management
- 7.5 `setBindings()` / `getBindings()` — binding introspection
- 7.6 `toSql()` and `toRawSql()` compilation

### 8. Subquery Patterns (foundational)
- 8.1 Closure-based subquery `where(fn $q => $q->select(...))`
- 8.2 `whereExists` / `whereNotExists` subqueries
- 8.3 Subquery as column source in select
- 8.4 `addSelect` with subquery

### 9. Debugging and Introspection
- 9.1 `toSql()` — SQL string without bindings
- 9.2 `toRawSql()` — SQL with bindings interpolated
- 9.3 `dd()` / `dump()` — dump and die with bindings
- 9.4 `getBindings()` / `getRawBindings()`
- 9.5 `explain()` — database query plan
- 9.6 `DB::listen()` — global query listener

### 10. Macros and Builder Extensions
- 10.1 `Builder::macro()` — extending Query Builder
- 10.2 `EloquentBuilder::macro()` — extending Eloquent Builder
- 10.3 Mixins for groupable macro registration
- 10.4 When to use macros vs custom builders
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization