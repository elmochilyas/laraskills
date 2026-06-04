# Decomposition: Higher Order Messages

## Knowledge Unit Breakdown

### 1. HigherOrderBuilderProxy
- 1.1 Proxy instantiation in `Builder::__call`
- 1.2 Method interception and delegation
- 1.3 Return type handling
- 1.4 Builder reference storage

### 2. `each()` — Lazy Iteration
- 2.1 `cursor()`-backed iteration
- 2.2 Callback signature: `fn($model, $key): void`
- 2.3 Return value: `void` (side effects only)
- 2.4 Connection behavior during iteration

### 3. `map()` — Result Transformation
- 3.1 Full hydration via `get()`
- 3.2 Callback signature: `fn($model, $key): mixed`
- 3.3 Return value: `Collection`
- 3.4 Memory implications

### 4. `filter()` — Predicate Filtering
- 4.1 Post-query filtering
- 4.2 Difference from `WHERE` clause filtering
- 4.3 Callback signature and return value
- 4.4 Use cases: permission-based filtering, computed-field filtering

### 5. `reject()` — Inverse Filtering
- 5.1 Sugar over `filter(!fn())`
- 5.2 Use cases: removing specific items
- 5.3 Chaining with other HOMs

### 6. `tap()` — Side-Effect Pass-Through
- 6.1 Callback receives collection, returns unchanged
- 6.2 Logging, monitoring, debugging use cases
- 6.3 Chain position preservation

### 7. `pipe()` — Collection Transformation
- 7.1 Callback signature: `fn(Collection $c): mixed`
- 7.2 Return type varies (breaking the collection chain)
- 7.3 Grouping, reducing, summarizing use cases

### 8. `first()` on Proxy
- 8.1 HOM `first(fn $predicate)` vs builder `first()`
- 8.2 Predicate-based first record extraction
- 8.3 Default value support

### 9. Execution Flow
- 9.1 Builder execution timing (deferred vs immediate)
- 9.2 `__call` magic method dispatch
- 9.3 Builder state snapshot at call time
- 9.4 Post-execution collection pipeline

### 10. Comparison with Alternatives
- 10.1 `chunk()` vs `each()` for large datasets
- 10.2 Raw `cursor()` + manual loop vs HOM `each()`
- 10.3 `get()` + collection chaining vs HOM pipeline
- 10.4 Performance and readability tradeoffs
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization