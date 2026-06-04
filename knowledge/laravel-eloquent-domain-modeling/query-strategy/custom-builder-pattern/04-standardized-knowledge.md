# Custom Builder Pattern — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Custom Builder Pattern
- **ECC Version:** 1.0

## Overview
The Custom Builder Pattern extends Laravel's Eloquent Builder with a dedicated class for a specific model. Using the `HasBuilder` trait (Laravel 10+) or overriding `newEloquentBuilder()`, a model specifies its own builder class with custom query methods. This moves domain-specific query logic out of the model and into a dedicated class, providing better organization, testability, and IDE support. Ideal for models with complex query APIs.

## Core Concepts
- `HasBuilder` Trait: Laravel 10+ trait connecting a model to a custom builder via `$builder` property
- `newEloquentBuilder()` Override: traditional way (pre-Laravel 10) to specify a custom builder
- Custom Builder Class: extends `Illuminate\Database\Eloquent\Builder` with domain-specific methods
- Return `static`: custom methods should return `static` for fluent chaining
- Scope Extraction: moving scope methods from the model to the custom builder
- IDE Autocompletion: visible via `@mixin` annotations on the model

## When To Use
- Models with 5+ custom query methods that would clutter the model class
- Domain-specific query APIs that compose multiple constraints
- Query methods that need constructor injection of services (tenant resolver, auth manager)
- Cross-model shared query logic via a base custom builder
- Teams where code organization and IDE support are priorities

## When NOT To Use
- Do NOT use for models with only 1-2 simple scopes — scopes on the model are sufficient
- Do NOT use when the query methods are purely one-off constraints in controllers
- Do NOT use a custom builder to override core builder methods (`where`, `get`, etc.)
- Do NOT create a custom builder for every model — only for those with rich query APIs
- Do NOT use before Laravel 10 without the `newEloquentBuilder()` override pattern

## Best Practices (WHY)
- Register with `HasBuilder` trait (Laravel 10+) instead of manual `newEloquentBuilder()` override
- Return `: static` from custom methods for proper IDE type chaining
- Keep methods focused: one method, one constraint; compose methods at the call site
- Use `@mixin CustomBuilder` on the model class for IDE autocompletion
- Test custom builder methods independently from the model
- Extract shared builder logic to traits for reuse across multiple custom builders

## Architecture Guidelines
- Place custom builders in `Builders/` directory: `app/Models/Builders/UserBuilder.php`
- Use descriptive, domain-oriented method names
- Keep custom builder methods fluent (always return `static`)
- Don't put business logic (calculations, external calls) in builder methods — only query construction
- Combine custom builders with the Query Object pattern for complex multi-model scenarios

## Performance
- No runtime overhead — custom builder is instantiated once per query instead of the base builder
- Method calls cost the same as equivalent scope calls
- Custom builder methods can optimize SQL (choosing subquery vs join) without affecting calling code
- Builder instantiation is negligible — creating a custom vs base builder is the same cost

## Security
- Custom builder methods should not bypass model-level security (global scopes, access control)
- Avoid methods that accept raw SQL or column names without validation
- Document any builder method that suppresses global scopes or modifies security constraints
- Constructor injection should not expose internal state through builder methods

## Common Mistakes
- Not extending `Builder` — the custom class must extend `Illuminate\Database\Eloquent\Builder`
- Wrong return type — forgetting `: static` breaks IDE autocompletion on chained calls
- Overriding core methods — overriding `where()` or `get()` is error-prone; use distinct names
- Missing `HasBuilder` or `newEloquentBuilder` — the custom builder class is never used
- Calling model methods from builder — `$this->model()` works but couples the builder; prefer builder methods
- Builder state leakage — storing mutable state on the builder that persists across queries

## Anti-Patterns
- **Builder for Every Model**: creating a custom builder for models with 1-2 simple scopes
- **God Builder**: one builder class for all models instead of per-model builders
- **Core Override**: overriding `where()`, `get()`, or other core builder methods
- **Business Logic in Builder**: performing calculations, API calls, or side effects in builder methods
- **Silent Registration**: defining a custom builder class but forgetting to register it with the model

## Examples
```php
// Custom builder class
class UserBuilder extends Builder
{
    public function active(): static
    {
        return $this->where('active', true);
    }

    public function verified(): static
    {
        return $this->whereNotNull('email_verified_at');
    }

    public function subscribed(): static
    {
        return $this->whereHas('subscription', fn($q) =>
            $q->where('active', true)->where('ends_at', '>', now())
        );
    }

    public function ofType(string $type): static
    {
        return $this->where('type', $type);
    }

    public function withRecentOrders(int $days = 30): static
    {
        return $this->with(['orders' => fn($q) =>
            $q->where('created_at', '>=', now()->subDays($days))
        ]);
    }
}

// Model registration
use Illuminate\Database\Eloquent\Concerns\HasBuilder;

class User extends Model
{
    use HasBuilder;
    protected static string $builder = UserBuilder::class;
}

// Usage
$users = User::query()
    ->active()
    ->verified()
    ->subscribed()
    ->ofType('premium')
    ->withRecentOrders()
    ->get();

// Pre-Laravel 10 registration
class User extends Model
{
    public function newEloquentBuilder($query): UserBuilder
    {
        return new UserBuilder($query);
    }
}
```

## Related Topics
- Local Scopes — extracting scopes from model to custom builder
- Domain-Specific Query Methods — domain-named methods on custom builders
- Builder Fundamentals — the base builder class being extended
- Decision Framework — choosing between scopes, custom builders, and query objects

## AI Agent Notes
- Use `HasBuilder` trait with `$builder` static property (Laravel 10+) for registration
- Extend `Illuminate\Database\Eloquent\Builder` — not Query Builder
- Return `: static` from custom methods for fluent chaining
- Mark methods that return non-builder types explicitly
- Add `@mixin CustomBuilder` to model docblocks for IDE support
- Test builder methods independently of model tests

## Verification
- [ ] Custom builder registered via `HasBuilder` trait (Laravel 10+) or `newEloquentBuilder()` override
- [ ] Custom class extends `Illuminate\Database\Eloquent\Builder`
- [ ] All fluent methods return `: static`
- [ ] `@mixin` annotation on model for IDE support
- [ ] Builder methods tested independently
- [ ] No overriding of core builder methods (`where`, `get`, `first`)
- [ ] No business logic (external calls, calculations) in builder methods
- [ ] Builder state is not shared across separate queries
