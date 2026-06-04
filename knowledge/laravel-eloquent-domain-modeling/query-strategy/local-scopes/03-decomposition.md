# Decomposition: Local Scopes

## Knowledge Unit Breakdown

### 1. Scope Definition
- 1.1 Method naming convention (`scope` prefix)
- 1.2 Method signature: `scopeName(Builder $query, ...$parameters)`
- 1.3 Return value contract (must return `$query` or implicit fallback)
- 1.4 `public` visibility requirement

### 2. Scope Invocation
- 2.1 `__callStatic` on Model → `__call` on Builder
- 2.2 Scope name resolution (camelCase to camel_case)
- 2.3 Parameter passing through the chain
- 2.4 Return value handling (`?? $this`)

### 3. Simple (Parameterless) Scopes
- 3.1 `scopeActive()` → `Model::active()`
- 3.2 Defining constant query constraints
- 3.3 Use cases: boolean filters, status checks, date ranges

### 4. Parameterized Scopes
- 4.1 `scopeOfType($query, $type)` → `Model::ofType('premium')`
- 4.2 Multiple parameters: `scopeBetweenDates($q, $start, $end)`
- 4.3 Optional/default parameters
- 4.4 Variadic parameters for IN clauses

### 5. Scope Composition
- 5.1 Chaining scopes: `Model::active()->verified()->recent()`
- 5.2 Scope calling other scopes: `$q->active()->verified()`
- 5.3 Mixing scopes with direct builder methods
- 5.4 Scope order sensitivity

### 6. Scopes with Relationships
- 6.1 `scopeWithRecentPost($q) { $q->has('posts', '>=', 1) }`
- 6.2 `scopeFromTeam($q, $team) { $q->whereHas('teams', fn($q) => $q->whereKey($team)) }`
- 6.3 `scopeWhereRelated($q, $relation, $callback)`
- 6.4 Scopes that eager load

### 7. Scopes vs Query Builder Methods
- 7.1 When to define a scope vs inline constraint
- 7.2 Scope granularity (one constraint vs composite)
- 7.3 Naming conventions for readability
- 7.4 Scope discoverability (IDE assistance)

### 8. Testing Scopes
- 8.1 Unit testing scope logic with mock builders
- 8.2 Feature testing scope results with database
- 8.3 Testing scope combinations
- 8.4 Testing parameterized scope edge cases

### 9. Scope Anti-Patterns
- 9.1 Terminating scope (calling get() inside a scope)
- 9.2 Side-effect scopes (I/O, logging)
- 9.3 Over-parameterization (5+ parameters)
- 9.4 Scope obesity (too many scopes on one model)
- 9.5 Scope collision (naming conflicts)

### 10. Refactoring to Scopes
- 10.1 Identifying repeated inline constraints
- 10.2 Extracting scope from controller logic
- 10.3 Moving complex whereHas/whereDoesntHave to scopes
- 10.4 Grouping related scopes on a model
- 10.5 Extracting to query objects when model has too many scopes
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization