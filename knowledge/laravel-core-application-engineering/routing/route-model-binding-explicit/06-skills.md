# Skill: Implement Explicit Route Model Binding with Custom Resolution

## Purpose

Register custom model resolution logic via `Route::bind()` in a dedicated service provider when implicit binding is insufficient — supporting complex queries, non-database sources, and custom missing-model behavior while keeping business logic out of binding closures.

## When To Use

- When resolution requires complex queries beyond `findOrFail` (joins, eager loading)
- When binding needs caching (Redis-backed resolution)
- When resolving from non-database sources (APIs, files, in-memory stores)
- When the bound parameter doesn't map to a primary key
- When custom missing-model behavior is needed (custom exception, default value)

## When NOT To Use

- Simple ID-based resolution (use implicit binding)
- When the standard `findOrFail` behavior is sufficient
- When custom resolution logic belongs in the controller (keep binding simple)

## Prerequisites

- Service provider (dedicated `BindingsServiceProvider` or equivalent)
- Route parameter name to bind
- Resolution logic (closure or resolvable class)

## Inputs

- Route parameter name (e.g., `user`, `team`)
- Resolution closure or class
- Cache configuration (optional, for expensive resolution)

## Workflow

1. Create a dedicated service provider: `php artisan make:provider BindingsServiceProvider`
2. Register it in `bootstrap/providers.php` or `config/app.php`
3. In the provider's `boot()` method, call `Route::bind('parameter', fn($value) => ...)`
4. Write the resolution closure — perform exactly one operation (resolve a value and return it)
5. If resolution is expensive, wrap in `Cache::remember()` with an appropriate TTL
6. Use `Route::bind()` with explicit closure over `Route::model()` (except for soft-delete)
7. Do NOT add authorization, logging, or side effects inside the binding closure
8. Run `php artisan route:list` to verify binding is active
9. Test that the bound route resolves correctly with valid and invalid values

## Validation Checklist

- [ ] Binding registered in a dedicated service provider (not `AppServiceProvider`)
- [ ] `Route::bind()` used with explicit closure (not `Route::model()`)
- [ ] Closure performs only resolution logic — no authorization, logging, or side effects
- [ ] Expensive resolution wrapped in `Cache::remember()`
- [ ] Authorization is handled in controller or middleware, not in binding
- [ ] Binding works correctly for valid values
- [ ] Missing models return 404 or custom behavior

## Common Failures

### Business logic in bindings
Adding authorization, logging, or side effects to binding closures runs before middleware and violates separation of concerns. Keep bindings focused on resolution only.

### Duplicate binding logic
Both `Route::model()` and implicit binding configured for the same parameter creates confusion. Use one strategy consistently.

### Over-engineering simple bindings
Writing complex binding closures for simple `findOrFail` operations. Use implicit binding for standard cases.

## Decision Points

### Route::bind() vs Route::model()?
Use `Route::bind()` with explicit closure — it documents the resolution logic. Use `Route::model()` only for soft-delete binding via `->withTrashed()`.

### Dedicated provider vs AppServiceProvider?
Create a dedicated `BindingsServiceProvider` when bindings exceed 1-2 or involve significant logic. Keep trivial bindings in `AppServiceProvider` only for very small applications.

## Performance Considerations

- Binding closures run before middleware — slow resolution delays every response
- Cache expensive resolution: `Cache::remember("key.{$value}", 3600, fn() => ...)`
- Consider that cached bindings may serve stale data — set appropriate TTL
- Binding closures run on every matching request

## Security Considerations

- Binding closures run before auth middleware — do not access `Auth::user()` or rely on session state
- Cache keys must be unique per user context to prevent cross-user cache poisoning
- Authorization checks belong in controllers or middleware, not binding closures
- Ensure binding closure doesn't bypass middleware-based protections

## Related Rules

- Register Explicit Bindings in a Dedicated Service Provider
- Use Route::bind() Over Route::model()
- Ban Business Logic and Authorization From Binding Closures
- Cache Expensive Binding Resolution

## Related Skills

- Register Cached Model Resolution via Explicit Binding
- Implement Implicit Route Model Binding
- Configure Custom Route Keys with Inline Syntax

## Success Criteria

- Custom resolution logic runs correctly for valid parameters
- Missing models return 404 (or custom behavior)
- Binding closure is free of authorization, logging, and side effects
- Expensive resolution is cached with appropriate TTL
- Binding is registered in a dedicated provider for auditability

---

# Skill: Register Cached Model Resolution via Explicit Binding

## Purpose

Wrap explicit route model binding in a cache layer to avoid repeated expensive database queries for the same model, reducing database load and response times for frequently accessed resources.

## When To Use

- Binding resolution involves complex queries with joins or eager loading
- The same model is resolved multiple times across different routes in the same request
- Frequently accessed resources where the resolution cost is measurable
- External API-based resolution where caching reduces latency

## When NOT To Use

- Simple ID-based resolution with no joins (caching overhead > query cost)
- Resources that change frequently and require real-time accuracy
- When the cache driver is not suitable for the data volatility (file cache)

## Prerequisites

- Explicit binding via `Route::bind()` already configured
- Cache driver configured (Redis recommended for production)
- Cache key strategy that avoids collisions

## Inputs

- Binding parameter name
- Resolution closure
- Cache key template
- TTL (time-to-live) in seconds

## Workflow

1. Define the cache key using the parameter value: `"user.{$value}"` or `"user.slug.{$value}"`
2. Wrap the resolution logic in `Cache::remember($key, $ttl, fn() => ...)`
3. Set an appropriate TTL: 60-300 seconds for most CRUD, longer for immutable data
4. Ensure the cache key is unique per resource (include the parameter value and binding column)
5. Test that cached responses return correctly
6. Verify that cache is invalidated when the model changes (optional — depends on TTL strategy)
7. Do NOT cache when stale data is unacceptable (real-time status endpoints)

## Validation Checklist

- [ ] Cache key is unique per resource instance
- [ ] Cache TTL is appropriate for the data volatility
- [ ] Resolution inside cache closure is the same as the original binding logic
- [ ] Cache driver supports the required TTL (Redis, database, file)
- [ ] Cached responses return correct model instances
- [ ] Cache miss correctly falls through to the database lookup

## Common Failures

### Cache key collisions
Using generic cache keys like `"user"` without the parameter value causes different users to receive the same cached model. Always include the unique parameter value in the key.

### Over-caching with stale data
Caching for too long when the model changes frequently. Use short TTLs (60-300s) or implement cache invalidation on model updates.

## Decision Points

### Cache TTL duration?
Short TTL (60-300s) for frequently changing data. Longer TTL (3600s+) for immutable or slowly changing data. No caching for real-time data.

### Cache invalidation strategy?
Time-based expiration (TTL) is simplest. Event-based invalidation (clearing cache on model update) provides fresher data but adds complexity.

## Performance Considerations

- Cache hit: 1 Redis GET operation (~0.5ms) vs a database query with joins (~5-20ms)
- Cache miss: database query + cache SET (~5-20ms + ~0.5ms)
- Cache `remember()` avoids the database query on cache hits
- Cache key length affects memory usage — use concise but unique keys

## Security Considerations

- Cache keys must include user context if the resolved model differs per user
- Cache poisoning: ensure cache keys are not directly controllable from user input
- Cached authorization state must not bypass per-request permission checks
- Shared cache across applications requires unique key prefixes

## Related Rules

- Cache Expensive Binding Resolution
- Use Route::bind() Over Route::model()
- Ban Business Logic and Authorization From Binding Closures

## Related Skills

- Implement Explicit Route Model Binding with Custom Resolution
- Implement Implicit Route Model Binding
- Configure Custom Route Keys

## Success Criteria

- Binding resolution is cached with correct unique keys
- Cache hits return responses without database queries
- Cache TTL balances freshness with performance
- No cache key collisions between different resources
- Stale data risk is acceptable for the use case
