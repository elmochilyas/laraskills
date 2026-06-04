# ECC Anti-Patterns — Bootstrapping Lifecycle

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Bootstrapping Lifecycle |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Service Resolution in `register()` (Breaking the Two-Phase Contract)
2. Business Logic in Custom Bootstrappers
3. Assuming Service Provider Boot Order
4. Forgetting Config/Route/Event Cache in Production

---

## Repository-Wide Anti-Patterns

- Register as Service Locator (using `$this->app->make()` during registration phase)
- Provider as God Class (providers doing too much instead of just binding and booting)

---

## Anti-Pattern 1: Service Resolution in `register()`

### Category
Architecture

### Description
Calling `$this->app->make()`, facades, or service resolution logic inside a service provider's `register()` method instead of restricting it to container bindings.

### Why It Happens
Developers don't understand the two-phase provider contract. They assume all bindings are available because they see them in the provider list.

### Warning Signs
- `$this->app->make()` or `resolve()` inside `register()`
- Facade calls (e.g., `Log::info()`) inside `register()`
- Services initialized or configured inside `register()`
- Errors that don't appear in development but manifest in production (provider order changes)

### Why It Is Harmful
Not all providers have registered their bindings during `register()`. Resolving a service may return a partially initialized instance or work only by coincidence until provider order changes.

### Preferred Alternative
Restrict `register()` to `$this->app->bind()`, `$this->app->singleton()`, and `$this->app->instance()`. Move all service interaction to `boot()`.

### Related Rules
- Rule: Never Resolve Services in register()

---

## Anti-Pattern 2: Business Logic in Custom Bootstrappers

### Category
Architecture | Performance

### Description
Adding database queries, API calls, or complex calculations to a custom kernel bootstrapper that runs before middleware on every request.

### Why It Happens
The bootstrapper runs early in the lifecycle, which seems like the ideal place for initialization. Developers forget that it runs on every request unconditionally.

### Warning Signs
- Custom bootstrapper calls `Model::all()`, `DB::query()`, or `Http::get()`
- Custom bootstrapper contains business rules or feature logic
- The boot logic cannot be cached or skipped
- All routes pay the cost even when the bootstrapper's logic is irrelevant

### Preferred Alternative
Implement initialization in service providers (which support deferring and caching), or extract to dedicated services called from middleware or controllers.

### Related Rules
- Rule: Never Add Business Logic to Bootstrappers

---

## Anti-Pattern 3: Assuming Service Provider Boot Order

### Category
Maintainability

### Description
Provider A depends on a boot-time side effect from Provider B, relying on the provider array ordering for correctness.

### Why It Happens
Developers test once and the order happens to work. No one documents the implicit ordering requirement.

### Warning Signs
- Adding a new provider to the middle of the `providers` array breaks existing behavior
- Provider `boot()` methods reference services from other providers directly
- No `resolving` callbacks or lazy initialization are used

### Preferred Alternative
Use `resolving` callbacks or lazy initialization instead of relying on provider array ordering for correctness.

### Related Rules
- Rule: Never Rely on Service Provider Boot Order

---

## Anti-Pattern 4: Forgetting Cache in Production

### Category
Performance

### Description
Running a production Laravel application without `config:cache`, `route:cache`, or `event:cache`, resulting in unnecessary per-request overhead.

### Why It Happens
Deployment scripts don't include cache commands. Developers don't measure bootstrap time and don't notice the degradation.

### Warning Signs
- Deployment script has no `php artisan config:cache`, `route:cache`, or `optimize` steps
- `bootstrap/cache/` directory is empty in production
- Response times are 3-8ms+ slower than local benchmarks

### Preferred Alternative
Include `config:clear && config:cache && route:cache && event:cache && optimize` in every production deployment script.

### Related Rules
- Rule: Run php artisan optimize in Every Production Deployment
- Rule: Always Run config:cache in Production
