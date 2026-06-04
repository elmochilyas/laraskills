# Dynamic Scopes — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Dynamic Scopes
- **ECC Version:** 1.0

## Overview
Dynamic scopes encompass two concepts: (1) parameterized local scopes that accept runtime arguments, and (2) runtime scope resolution where the specific scope to apply is determined at call time via variables. They enable flexible query composition where filter logic is determined by runtime data — essential for generic filtering systems, role-based query adaptation, and feature-flag-aware queries.

## Core Concepts
- Parameterized Local Scopes: `scopeFoo($query, $param)` callable as `Model::foo($value)`
- Dynamic Method Dispatch: calling scopes via variable method names `$query->{$scopeName}($param)`
- Runtime Scope Resolution: determining which scope to apply based on runtime conditions
- Scope Registry: whitelist of available scopes applied dynamically
- First-Class Callables: PHP 8.1+ `$model->scopeName(...)` for passing scopes as values

## When To Use
- Generic filter systems that apply scopes from request parameters
- Role-based queries where admin vs regular users get different scopes
- Feature-flag-aware query building
- Admin config panels where scopes are selected dynamically
- API packages that map query string parameters to model scopes

## When NOT To Use
- Do NOT use dynamic dispatch for business-logic-specific queries — explicit chaining is clearer
- Do NOT use dynamic scope names from user input without a whitelist
- Do NOT use dynamic scopes when the set of filters is fixed and known at build time
- Do NOT create parameterized scopes with 5+ parameters — extract to query objects
- Do NOT use dynamic dispatch in code that needs static analysis or IDE navigation

## Best Practices (WHY)
- Maintain an explicit whitelist (`$filterableScopes` property) for dynamic scope application
- Validate scope parameters before passing them to parameterized scopes
- Use dynamic scopes in infrastructure/generic code; use explicit scopes in business logic
- Log which dynamic scopes are applied for auditing and debugging
- Combine dynamic scopes with `when()` for conditional dynamic application
- Use first-class callable syntax for scope references: `$scope = $model->active(...)`

## Architecture Guidelines
- Implement a `$filterable` property on models listing allowed dynamic scope names
- Create a `applyFilters()` method on models or query objects encapsulating dynamic scope logic
- Keep parameterized scopes focused (< 3 parameters); split complex logic into multiple scopes
- Document available dynamic scopes with parameter types for API consumers
- Separate the scope registry (what scopes are available) from scope application (how they're applied)

## Performance
- Dynamic dispatch has negligible overhead (method lookup + call)
- Parameterized scopes cost no more than any other query constraint
- Loop-based dynamic application is proportional to the number of filters (microseconds per filter)
- Caching the scope registry (model -> available scopes) can skip reflection on every request

## Security
- **CRITICAL**: whitelist scope names from user input — never allow arbitrary method calls
- Validate and sanitize all user-provided values passed to parameterized scopes
- Dynamic scope dispatch should not call non-scope methods (use the whitelist approach)
- Audit dynamic scope application in security-sensitive contexts
- Reject unknown scope names with a clear error message

## Common Mistakes
- Calling non-existent scopes dynamically — `User::{$userInput}()` can call ANY public method
- Forgetting scope prefix: `$scope = 'scopeActive'` should be `$scope = 'active'`
- Over-parameterization: `scopeFilter($q, $type, $status, $from, $to, $sort)` is a code smell
- Duplicate constraints: applying a dynamic scope that duplicates an explicit constraint
- Missing default parameter values — calling parameterized scopes without required arguments

## Anti-Patterns
- **Unvalidated Dynamic Dispatch**: using user input directly as a scope method name without whitelisting
- **Scope as Catch-All**: a single `scopeFilter()` with 8 parameters for all filtering needs
- **Hidden Dynamic Scopes**: applying dynamic scopes in a base class without documentation
- **N+1 Dynamic Calls**: calling `method_exists()` for each potential scope in a loop with 20+ scopes
- **Magic Everywhere**: using dynamic dispatch for every query instead of explicit chaining

## Examples
```php
// Parameterized scope
class User extends Model {
    public function scopeOfType(Builder $q, string $type): Builder {
        return $q->where('type', $type);
    }
    public function scopeWithStatus(Builder $q, string $status): Builder {
        return $q->where('status', $status);
    }
}

// Dynamic dispatch with whitelist
$filters = ['type' => 'premium', 'status' => 'active'];
$allowedScopes = ['type' => 'ofType', 'status' => 'withStatus'];
$query = User::query();
foreach ($filters as $param => $value) {
    if (isset($allowedScopes[$param])) {
        $query->{$allowedScopes[$param]}($value);
    }
}

// Role-based scope selection
$scope = $user->isAdmin() ? 'all' : 'own';
$posts = Post::{$scope}()->get();

// First-class callable scope
$scope = User::active(...);
$count = User::query()->where(fn($q) => $scope($q))->count();

// Scope registry on model
class User extends Model {
    protected array $filterableScopes = [
        'type' => 'ofType',
        'status' => 'withStatus',
        'active' => 'active',
    ];
    
    public function applyFilters(array $filters): Builder {
        $query = static::query();
        foreach ($filters as $name => $value) {
            if (isset($this->filterableScopes[$name])) {
                $query->{$this->filterableScopes[$name]}($value);
            }
        }
        return $query;
    }
}
```

## Related Topics
- Local Scopes — the foundation of parameterized scopes
- Conditional Clauses — `when()` for conditional application of dynamic scopes
- Custom Builder Pattern — extracting dynamic scope logic to a dedicated builder
- Domain-Specific Query Methods — evolving dynamic scopes into named domain methods

## AI Agent Notes
- Always use a whitelist for dynamic scope names from external input
- Prefer explicit scope chaining for business logic; use dynamic dispatch for infrastructure
- Parameterize scopes with focused parameters (1-3 max)
- Combine dynamic scopes with `when()` for conditional application
- Validate scope parameters before passing them to the scope method

## Verification
- [ ] Dynamic scope names from user input are validated against a whitelist
- [ ] Parameterized scopes have focused parameters (< 3)
- [ ] No `method_exists()` calls without a whitelist for dynamic dispatch
- [ ] Dynamic scopes documented with parameter types
- [ ] Scope parameters sanitized and validated before use
- [ ] Auditing/logging in place for dynamic scope application in security contexts
- [ ] First-class callable syntax used where appropriate (PHP 8.1+)
