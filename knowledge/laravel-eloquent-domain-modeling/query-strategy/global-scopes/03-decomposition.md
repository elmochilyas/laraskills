# Decomposition: Global Scopes

## Knowledge Unit Breakdown

### 1. Scope Interface
- 1.1 `Illuminate\Database\Eloquent\Scope` contract
- 1.2 `apply(Builder $builder, Model $model)` method signature
- 1.3 Single responsibility: one scope, one concern
- 1.4 No return value requirement (modifies builder in place)

### 2. Scope Registration Methods
- 2.1 `booted()` method: `$this->addGlobalScope(new MyScope)`
- 2.2 `addGlobalScope()` signature and behavior
- 2.3 `#[ScopedBy(MyScope::class)]` attribute (Laravel 11+)
- 2.4 Trait-based auto-registration (SoftDeletes pattern)
- 2.5 Anonymous closure scopes: `$this->addGlobalScope('name', fn($q) => ...)`
- 2.6 Registration order implications

### 3. Scope Application Flow
- 3.1 `applyScopes()` method and `$scopesApplied` flag
- 3.2 When scopes are applied (get, first, count, paginate, cursor)
- 3.3 `toSql()` and scope application
- 3.4 `toBase()` and scope application
- 3.5 Scope application in relationship queries
- 3.6 Double-application prevention

### 4. Built-in Scopes
- 4.1 `SoftDeletingScope` — full implementation analysis
- 4.2 SoftDeletes: add where clause + delete behavior modification
- 4.3 `RestoreOrCreate` and forced delete handling
- 4.4 Custom built-in scopes (none others in core)

### 5. Common Global Scope Use Cases
- 5.1 Multi-tenant partitioning
- 5.2 Published/published_at filtering
- 5.3 Language/locale filtering
- 5.4 Soft deletes
- 5.5 User-accessible record filtering
- 5.6 Active/archived status

### 6. Custom Scope Implementation
- 6.1 Creating a scope class
- 6.2 Accessing request/context in scopes (via facade, service container)
- 6.3 Scopes with configurable parameters
- 6.4 Scopes using subqueries
- 6.5 Scopes that modify SELECT or JOIN

### 7. Scope Interaction
- 7.1 Multiple scopes on one model (order, combination)
- 7.2 Scope suppression during scope application
- 7.3 Scopes on related models (applied in whereHas)
- 7.4 Scope interference

### 8. Invisible Filter Problem
- 8.1 Developer awareness and documentation
- 8.2 IDE docblock annotations
- 8.3 Debugging tools for active scopes
- 8.4 Testing scope application

### 9. Security Implications
- 9.1 Scope as security boundary (multi-tenant isolation)
- 9.2 Scope suppression as security risk
- 9.3 Query Builder bypass vulnerability
- 9.4 Audit and review requirements

### 10. Performance of Global Scopes
- 10.1 `apply()` method execution cost
- 10.2 Avoiding database queries inside `apply()`
- 10.3 Index consideration for scope WHERE clauses
- 10.4 Scope with joins impact on all queries
- 10.5 Caching scope application for repeated queries
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization