# Decomposition: Conditional Clauses

## Knowledge Unit Breakdown

### 1. The `when()` Method
- 1.1 Signature: `when($value, $callback, $default = null)`
- 1.2 Truthiness evaluation of `$value`
- 1.3 Pass-through behavior when condition is false
- 1.4 Default closure execution when provided
- 1.5 Returning `$this` vs explicit return from callback

### 2. The `unless()` Method
- 2.1 Signature: `unless($value, $callback, $default = null)`
- 2.2 Inverted logic: executes when condition is falsy
- 2.3 When to prefer `unless` over `when(!...)`

### 3. Condition Types and Evaluation
- 3.1 Boolean conditions
- 3.2 Callable (closure) conditions — deferred evaluation
- 3.3 Null / empty string / zero / empty array handling
- 3.4 Common condition expressions: `$request->filled()`, `$request->boolean()`, `Auth::check()`

### 4. Callback Protocols
- 4.1 Callback signature: `fn(Builder $query, $value): Builder`
- 4.2 Required return vs implicit return (`?? $this`)
- 4.3 Value passing as second argument — use cases and patterns
- 4.4 Empty callback vs no-op

### 5. Default Callback
- 5.1 When default is invoked (condition is false)
- 5.2 Fallback ordering, sorting, or constraints
- 5.3 Omitting vs providing default

### 6. Composition Patterns
- 6.1 Sequential filter pipeline: multiple `when()` calls in a chain
- 6.2 Nested conditionals: `when()` inside `when()`
- 6.3 Combining `when()` with other constraints
- 6.4 Extracting filter closures to named variables or methods

### 7. Comparison with Imperative Alternatives
- 7.1 If-statement pattern (external builder variable)
- 7.2 Ternary-based constraint application
- 7.3 Switch/case for multi-value filters
- 7.4 Readability and testability comparison

### 8. Real-World Implementations
- 8.1 Search/filter endpoint patterns
- 8.2 Permission-scoped queries
- 8.3 Feature-flag conditional constraints
- 8.4 Multi-tenant filter chains
- 8.5 Dynamic report generation

### 9. Testing Conditional Clauses
- 9.1 Testing each condition path (true/false)
- 9.2 Testing default callback
- 9.3 Testing condition combinations
- 9.4 Mocking `$request->filled()` and similar inputs

### 10. Anti-Patterns
- 10.1 Modifying external state in callbacks
- 10.2 Deeply nested `when()` chains
- 10.3 Overusing `when()` for simple boolean checks
- 10.4 Side effects inside conditional closures
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization