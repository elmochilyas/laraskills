# ECC Anti-Patterns — Service Provider Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Service Provider Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God Provider (Single Monolithic Provider for All Bindings)
2. Business Logic in Service Providers (Not Composition Roots)
3. Service Resolution in `register()` (Breaking Two-Phase Contract)
4. Over-Deferring or Under-Deferring Providers

---

## Repository-Wide Anti-Patterns

- Hardcoded Dependencies (registering concrete classes instead of interfaces)
- Provider as Service Locator (calling `$this->app->make()` to start using services)
- Forgetting `provides()` on Deferred Providers
- Debug/Profiler Providers Registered in Production

---

## Anti-Pattern 1: God Provider

### Category
Architecture | Maintainability

### Description
A single service provider (typically `AppServiceProvider`) that registers every binding, observer, event listener, and route for the entire application.

### Why It Happens
Laravel creates `AppServiceProvider` by default. Developers add bindings to it without considering separation by domain.

### Warning Signs
- `AppServiceProvider` has 50+ bindings from different business domains
- No domain-specific providers exist (Billing, Sales, Users)
- All developers modify the same provider file
- Selective deferral is impossible because bindings from different usage patterns are mixed

### Preferred Alternative
Create one service provider per bounded context. Keep `AppServiceProvider` for infrastructure-only bindings.

### Related Rules
- Rule: Organize Providers by Domain or Bounded Context

---

## Anti-Pattern 2: Business Logic in Service Providers

### Category
Architecture

### Description
Placing database queries, API calls, or complex calculations directly in a service provider's `register()` or `boot()` method.

### Why It Happens
Providers run early in the lifecycle and seem like a convenient place for "initialization" logic.

### Warning Signs
- `User::where()->get()` or `DB::query()` in a provider method
- External API calls in `boot()`
- Complex conditional logic that would normally belong in a service class
- Provider tests require database setup

### Preferred Alternative
Delegate initialization to dedicated service classes. Providers wire dependencies and set up infrastructure; they don't execute business logic.

### Related Rules
- Rule: Never Put Business Logic in Service Providers

---

## Anti-Pattern 3: Service Resolution in `register()`

### Category
Architecture

### Description
Calling `$this->app->make()` or a facade inside a `register()` method, violating the two-phase provider contract.

### Why It Happens
Developers don't understand that `register()` is for bindings only and `boot()` is for using resolved services.

### Warning Signs
- `$this->app->make()`, `resolve()`, or facade calls in `register()`
- Service initialization logic in `register()`
- Bootstrap errors that only occur in certain provider order configurations
- "Facade does not implement getFacadeRoot" errors during bootstrap

### Preferred Alternative
Restrict `register()` to container binding calls. Move all service interaction to `boot()` using method injection.

### Related Rules
- Rule: Keep register() Thin — Only Container Bindings
- Rule: Use Method Injection in boot()

---

## Anti-Pattern 4: Over-Deferring or Under-Deferring Providers

### Category
Performance

### Description
Marking providers as deferred when their services use model observers (which won't register) OR keeping rarely-used services as eager (wasting bootstrap time).

### Over-Deferring Signs
- Deferred provider registers model observers in `boot()` — observers never run
- Deferred provider's services are used on 80%+ of requests — deferral complexity not justified
- Missing `provides()` method — `BindingResolutionException` when resolved

### Under-Deferring Signs
- PDF export, email, or reporting service provider loaded on every request (eager) but rarely used
- No deferred providers in a large application — 2-5ms unnecessary bootstrap overhead

### Preferred Alternative
Profile service resolution frequency. Defer providers used on <80% of requests. Keep eager for frequently used services and providers that register observers.

### Related Rules
- Rule: Defer Providers for Services Not Used on Every Request
- Rule: Implement provides() for Every Deferred Provider
