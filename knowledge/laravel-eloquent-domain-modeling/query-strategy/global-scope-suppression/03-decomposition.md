# Decomposition: Global Scope Suppression

## Knowledge Unit Breakdown

### 1. `withoutGlobalScope()` Method
- 1.1 Signature: `withoutGlobalScope($scope)`
- 1.2 Accepts: class string, Scope instance, or string key
- 1.3 Internal: unset from `$globalScopes` array
- 1.4 Reset `$scopesApplied` flag
- 1.5 Return value: builder instance

### 2. `withoutGlobalScopes()` Method
- 2.1 Signature: `withoutGlobalScopes($scopes = null)`
- 2.2 `null` behavior: removes ALL global scopes
- 2.3 Array behavior: removes specified scopes by key/class
- 2.4 Variadic support (Laravel 9+)
- 2.5 Interaction with `SoftDeletingScope`

### 3. Scope Key Resolution
- 3.1 Class-name-based keys (default)
- 3.2 String-key-based scopes (from closure registration)
- 3.3 Scope instance lookup
- 3.4 Case sensitivity requirements

### 4. Suppression in Relationship Builders
- 4.1 `$user->posts()->withoutGlobalScope(...)`
- 4.2 Independent scope state per relationship builder
- 4.3 Parent builder suppression vs related builder suppression
- 4.4 Nested relationship suppression

### 5. Conditional Suppression Patterns
- 5.1 Permission-based suppression
- 5.2 Environment-based suppression
- 5.3 Feature-flag-based suppression
- 5.4 Admin vs regular user queries

### 6. Comparison with Alternative Approaches
- 6.1 `withTrashed()` syntactic sugar for SoftDeletes
- 6.2 Creating a new builder without scopes
- 6.3 Using Query Builder to bypass all scopes
- 6.4 Per-query scope disabling vs global configuration

### 7. Security Implications
- 7.1 Multi-tenant data isolation
- 7.2 Soft-delete data recovery
- 7.3 Audit trail requirements
- 7.4 Code review checklist for suppression calls

### 8. Testing Suppression
- 8.1 Testing each suppressed scope individually
- 8.2 Testing combined suppression
- 8.3 Testing that suppression does not affect other queries
- 8.4 Testing permission-controlled suppression

### 9. Suppression with `#[ScopedBy]` Attribute
- 9.1 Suppressing attribute-registered scopes
- 9.2 Class name resolution for attribute scopes
- 9.3 Laravel 11+ behavior

### 10. Anti-Patterns
- 10.1 Unconditional `withoutGlobalScopes()` — security risk
- 10.2 Suppression without permission check
- 10.3 Suppression without documentation
- 10.4 Suppressing scopes on stored/reused builder instances
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization