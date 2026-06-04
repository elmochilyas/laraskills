# Custom Builder Pattern

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
The Custom Builder Pattern extends Laravel's Eloquent Builder by creating a dedicated builder class for a specific model. Using the `HasBuilder` trait (Laravel 10+) or overriding `newEloquentBuilder()`, a model can specify its own builder class with custom query methods. This moves domain-specific query logic out of the model (where it accumulates as scopes) and into a dedicated class, providing better organization, testability, and IDE support. The pattern is ideal for models with complex query APIs — such as `UserBuilder`, `PostBuilder`, or `OrderBuilder` — where a dozen or more query methods would clutter the model class.

## Core Concepts
- **`HasBuilder` Trait** — Laravel 10+ trait that connects a model to a custom builder class via the `$builder` property
- **`newEloquentBuilder()` override** — the traditional way (pre-Laravel 10) to specify a custom builder
- **Custom Builder Class** — extends `Illuminate\Database\Eloquent\Builder` with domain-specific methods
- **Method Return Types** — custom methods should return `static` for fluent chaining
- **Scope Extraction** — moving scope methods from the model to the custom builder
- **IDE Autocompletion** — custom builder methods are visible via `@mixin` or method declarations on the model

## Mental Models
- **Builder as Repository** — the custom builder acts as a repository-like query API for the model
- **Query Object** — each method on the custom builder is a named query building block
- **Scope Migration** — think of scopes as methods that naturally belong on a builder; the custom builder is their proper home

## Internal Mechanics
Laravel 10+ introduced the `HasBuilder` trait:

```php
use Illuminate\Database\Eloquent\Concerns\HasBuilder;

class User extends Model
{
    use HasBuilder;
    
    protected static string $builder = UserBuilder::class;
}
```

`HasBuilder` overrides `newEloquentBuilder()` to instantiate the specified class. The custom builder must extend `Illuminate\Database\Eloquent\Builder`:

```php
class UserBuilder extends Builder
{
    public function active(): static
    {
        return $this->where('active', true);
    }
    
    public function subscribed(): static
    {
        return $this->whereHas('subscription', fn($q) => $q->where('active', true));
    }
}
```

The custom builder inherits all standard Eloquent Builder methods. Custom methods can call `$this->` to access any builder method, scopes on the associated model, or other custom methods.

## Patterns
- **Domain Query Methods** — `UserBuilder::active()`, `UserBuilder::subscribed()`, `UserBuilder::withRecentOrders()`
- **Composable Query API** — `User::query()->active()->subscribed()->with('profile')->get()`
- **Builder with State** — custom constructor logic, configuration properties, or initialization
- **Builder Macros** — static methods that register reusable query logic on the builder
- **Cross-Model Builders** — base builder for shared domain logic across similar models
- **Builder with Injection** — constructor injection of services (e.g., tenant resolver, auth manager)

## Architectural Decisions
- **Custom Builder vs Scopes** — custom builders are better for models with 5+ query methods; scopes are better for 1-2 simple filters on models without complex query APIs
- **Custom Builder vs Query Objects** — query objects are standalone classes that build a query and return results; custom builders extend the builder itself. Use custom builders when methods should feel like they're "on the model"; use query objects for complex multi-model queries
- **Custom Builder vs Repository Pattern** — repositories abstract the entire data-access layer; custom builders only extend query construction. They can coexist — a repository can use a custom builder internally

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Cleaner model class (no scope clutter) | Extra class per model with custom builder | Worth it for models with 5+ custom methods |
| Full IDE support for custom methods | Team onboarding: must know to check builder class | Document the custom builder in model docblock |
| Reusable, testable query methods | Cannot override built-in builder methods | Use distinct method names |
| Composable with standard builder methods | Builder instances scoped to one model | Extract shared logic to traits |
|  |  |  |

## Performance Considerations
- No runtime overhead — the custom builder is instantiated once per query instead of the base builder
- Method calls cost the same as equivalent scope calls
- Custom builder methods can optimize SQL (e.g., choosing subquery vs join) without affecting calling code

## Production Considerations
- **Document the custom builder** — add `@mixin UserBuilder` to the model's docblock for IDE support
- **Test builder methods independently** — each custom method should have its own test
- **Keep methods focused** — one method, one constraint; compose methods in the calling code
- **Return `static` type** — custom methods should return `static` for proper type chaining
- **Extract shared builders** — if multiple models share query patterns, create a base builder

## Common Mistakes
- **Not extending `Builder`** — the custom class must extend `Illuminate\Database\Eloquent\Builder`
- **Wrong return type** — forgetting `: static` return type breaks IDE autocompletion on chained calls
- **Overriding core methods** — overriding `where()` or `get()` on a custom builder is error-prone; use distinct names
- **Missing `HasBuilder` or `newEloquentBuilder`** — the custom builder class is never used if not properly registered
- **Calling model methods** — `$this->model()` works but couples the builder to the model; prefer builder methods
- **Builder state leakage** — storing mutable state on the builder that persists across separate queries

## Failure Modes
- **Missing `$builder` property** — if `HasBuilder` is used but `$builder` property is missing or points to an invalid class, Eloquent falls back to the default Builder silently; no error is thrown
- **Incompatible builder constructor** — if the custom builder's constructor signature differs from the parent, instantiation fails with a ReflectionException
- **Circular dependencies** — a custom builder method that calls a model method that creates a new query with the same builder can cause infinite recursion

## Ecosystem Usage
- **Laravel Spark** — uses custom builders for team/billing related query methods
- **Laravel Cashier** — uses custom builders for subscription and invoice query methods on billable models
- **Laravel Jetstream** — uses custom builders for team membership queries
- **Laravel Nova** — encourages custom builders for resource query customization

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Local Scopes, Global Scopes

### Related Topics
Domain-Specific Query Methods, Decision Framework, Hybrid Strategies

### Advanced Follow-up Topics
Conditional Clauses, Higher Order Messages, To Base Pattern

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Concerns\HasBuilder` was introduced in Laravel 10. It overrides `newEloquentBuilder()` to return `new $static::$builder($query)`. The `$builder` property is a static string pointing to the custom builder class.
- **Key Insight:** The custom builder pattern is most valuable when combined with domain-specific query methods that compose multiple constraints. A `UserBuilder::eligibleForPromotion()` method that combines `active()`, `subscribed()`, and `recentlyJoined()` is more readable than the same logic inline in a controller.
- **Version-Specific Notes:** Laravel 10 introduced `HasBuilder` trait. Laravel 11 supports the `$builder` static property. Before Laravel 10, the pattern required overriding `newEloquentBuilder()` manually. The `HasBuilder` trait is now the recommended approach.
