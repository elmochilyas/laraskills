# Global Scopes — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Global Scopes
- **ECC Version:** 1.0

## Overview
Global scopes are query constraints automatically applied to every query on a given Eloquent model. They are defined via classes implementing the `Scope` interface and registered in `booted()` or via the `#[ScopedBy]` attribute (Laravel 11+). The canonical example is `SoftDeletingScope`, which adds `WHERE deleted_at IS NULL` to all queries. Global scopes are the right tool for cross-cutting query concerns like multi-tenant filtering, published-only content, or any constraint that must always be applied.

## Core Concepts
- `Scope` Interface: defines `apply(Builder $builder, Model $model)` — single method contract
- Registration: via `$model->addGlobalScope(new MyScope)` in `booted()` or `#[ScopedBy]` attribute
- Automatic Application: scopes apply via `applyScopes()` before terminal methods execute
- `SoftDeletingScope`: built-in scope adding `deleted_at IS NULL` and modifying `delete()` behavior
- `#[ScopedBy] Attribute`: PHP 8 attribute for declarative scope registration (Laravel 11+)
- Scope Suppression: `withoutGlobalScope(s)` for temporary removal
- `$scopesApplied` flag: prevents double application

## When To Use
- Multi-tenant data isolation (always filter by `tenant_id`)
- Soft deletes (always exclude soft-deleted records)
- Published content filtering (only show published records)
- Language/locale filtering in multilingual apps
- Access control (only show records owned by or accessible to the current user)
- Archives/status filtering (only show active, non-archived records)

## When NOT To Use
- Do NOT use global scopes for optional filters that should be explicitly applied — use local scopes
- Do NOT use global scopes that require frequent suppression — this indicates it shouldn't be global
- Do NOT use database queries inside `apply()` — the scope runs on every query for the model
- Do NOT use global scopes when Query Builder queries must also apply the constraint — QB bypasses scopes
- Do NOT use global scopes that change behavior based on request state without clear documentation

## Best Practices (WHY)
- Document every global scope on the model with a docblock comment
- Test scope suppression paths — every `withoutGlobalScope()` call should have a verification test
- Keep `apply()` methods fast — no database queries, no external API calls
- Use `#[ScopedBy]` attribute (Laravel 11+) over `booted()` for declarative registration
- Log scope application in development for debugging visibility
- Review global scopes periodically — business rules change and scopes may become unnecessary

## Architecture Guidelines
- One scope class per concern (single responsibility principle)
- Use trait-based auto-registration (like `SoftDeletes`) for scopes that always ship together with a trait
- Prefer anonymous closure scopes for simple constraints: `$this->addGlobalScope('name', fn($q) => ...)`
- Keep scopes in a `Scopes/` directory within the model namespace or app
- Establish a naming convention: `TenantScope`, `PublishedScope`, `ActiveScope`

## Performance
- Global scopes call `apply()` on every query — the method must be fast
- `SoftDeletingScope` is lightweight (single WHERE clause) — negligible cost
- Complex scopes with joins or subqueries add cost to EVERY query on the model
- Index the columns used in global scope WHERE clauses (e.g., `tenant_id`, `deleted_at`)
- Multiple global scopes compound — profile combined scope performance

## Security
- Global scopes can enforce security boundaries (multi-tenant isolation) — treat suppression as a security decision
- Query Builder bypasses all global scopes — never use QB for queries that depend on scope security
- Scope suppression without permission check is a security vulnerability
- Anonymous closure scopes are harder to suppress by class name — prefer named classes
- Document the security implications of each global scope

## Common Mistakes
- Forgetting to register the scope — define the class but never call `addGlobalScope()`
- Unintentional `withoutGlobalScopes()` (calling with no arguments) removes ALL scopes
- Scope on wrong model — putting a tenant scope on a related model instead of the main model
- Running queries inside `apply()` — this adds a query to every model query
- Assuming Query Builder uses scopes — `DB::table('users')` does not apply Eloquent scopes
- Forgetting that relationship queries also apply global scopes

## Anti-Patterns
- **Invisible Filter**: global scopes that surprise developers because they're undocumented
- **Scope Leak**: a scope that modifies state beyond the query (e.g., session, cache)
- **Heavy Scope**: scopes with joins or subqueries that execute on every query
- **False Security**: relying on a global scope for security but using QB in some code path
- **Scope Soup**: 7+ global scopes on a single model — clear indication of poor separation of concerns

## Examples
```php
// Anonymous closure scope (simple)
class User extends Model {
    protected static function booted(): void {
        $this->addGlobalScope('active', fn(Builder $q) =>
            $q->where('active', true)
        );
    }
}

// Class-based scope (complex)
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        $builder->where('tenant_id', auth()->user()->tenant_id);
    }
}

// Registration with #[ScopedBy] (Laravel 11+)
#[ScopedBy(TenantScope::class)]
class User extends Model {
    // ...
}

// Registration in booted()
class Post extends Model {
    protected static function booted(): void {
        static::addGlobalScope(new PublishedScope());
    }
}

// Scope class
class PublishedScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        $builder->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }
}
```

## Related Topics
- Global Scope Suppression — temporarily removing scopes
- Local Scopes — opt-in scopes vs. always-applied global scopes
- Soft Deletes — the canonical global scope example
- Custom Builder Pattern — builder methods as alternative to scopes
- Decision Framework — when to use scopes vs Query Builder

## AI Agent Notes
- Document global scopes on the model — they are invisible to calling code
- Keep `apply()` methods fast — they run on every query
- Test suppression paths for every global scope
- Use `#[ScopedBy]` over `booted()` for declarative registration (Laravel 11+)
- Never rely on QB for queries that need global scope constraints
- One scope class per concern; avoid "god" scopes

## Verification
- [ ] Each global scope has a dedicated scope class with single responsibility
- [ ] `apply()` methods contain no database queries or external calls
- [ ] Global scopes documented on the model class (docblock or README)
- [ ] Suppression paths tested for correctness and security
- [ ] No unintentional `withoutGlobalScopes()` calls (use `withoutGlobalScope()` with specific class)
- [ ] QB queries on models with security-critical scopes are reviewed
- [ ] Index exists for columns used in global scope WHERE clauses
