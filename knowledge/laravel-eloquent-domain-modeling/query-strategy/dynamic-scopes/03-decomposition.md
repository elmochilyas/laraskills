# Decomposition: Dynamic Scopes

## Knowledge Unit Breakdown

### 1. Parameterized Local Scopes
- 1.1 Definition: `scopeFoo($query, $param)` with parameters
- 1.2 Invocation: `Model::foo($param)` or `$query->foo($param)`
- 1.3 Default parameter values
- 1.4 Multiple parameters
- 1.5 Variadic parameters

### 2. Dynamic Method Dispatch
- 2.1 Variable method names: `$query->{$method}()`
- 2.2 `__call` resolution for dynamic scope names
- 2.3 Parameter passing with dynamic dispatch
- 2.4 Return value handling

### 3. Scope Registry Pattern
- 3.1 `$filterableScopes` property on model
- 3.2 Whitelist-based dynamic scope application
- 3.3 Registry iteration and application loop
- 3.4 Error handling for invalid scope names

### 4. Runtime Scope Resolution
- 4.1 Role-based scope selection
- 4.2 Feature-flag-based scope application
- 4.3 Configuration-driven scopes
- 4.4 Request-parameter-driven scopes

### 5. First-Class Callable Scopes
- 5.1 PHP 8.1+ `$model->scopeName(...)` syntax
- 5.2 Passing scopes as callable values
- 5.3 Composing scopes with array_reduce patterns
- 5.4 Scope pipelines

### 6. Security Considerations
- 6.1 Preventing arbitrary method injection
- 6.2 Whitelist validation implementation
- 6.3 Input sanitization for scope parameters
- 6.4 Auditing dynamic scope application

### 7. Performance of Dynamic Dispatch
- 7.1 Method lookup overhead
- 7.2 Comparison with explicit chaining
- 7.3 Loop-based application performance
- 7.4 Caching scope resolution

### 8. Testing Dynamic Scope Systems
- 8.1 Testing whitelist validation
- 8.2 Testing each dynamic scope path
- 8.3 Testing scope combination order
- 8.4 Testing with invalid scope names

### 9. Integration with Filter Packages
- 9.1 Spatie/QueryBuilder integration
- 9.2 Custom filter request parsing
- 9.3 Scope to filter mapping
- 9.4 API documentation generation

### 10. Advanced Patterns
- 10.1 Dynamic scope with dependency injection
- 10.2 Scope factories for complex parameterized logic
- 10.3 Conditional scope chaining with when() and dynamic names
- 10.4 Multi-tenant scope resolution
- 10.5 Scope prioritization and ordering
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization