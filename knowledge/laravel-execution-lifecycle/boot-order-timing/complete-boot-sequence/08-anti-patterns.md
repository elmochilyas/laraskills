# ECC Anti-Patterns — Complete Boot Sequence

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Complete Boot Sequence |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fat Providers Violating SRP
2. Manual `$app->boot()` Invocation
3. Production Without Bootstrap Caching
4. Ignoring Boot Phase for Error Diagnosis
5. Resolving Services in register()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — resolving services in `register()` triggers eager loading
- Premature Caching — caching during `register()` caches before all bindings exist

---

## Anti-Pattern 1: Fat Providers Violating SRP

### Category
Code Organization

### Description
Dumping all initialization logic — bindings, routes, events, listeners, business logic, and setup — into a single service provider rather than splitting by concern.

### Why It Happens
Developers create one provider (e.g., `AppServiceProvider`) and place everything there for simplicity, not realizing the boot sequence becomes a black box.

### Warning Signs
- A single provider with hundreds of lines of initialization code
- `AppServiceProvider` containing route, event, gate, and binding registrations
- Hard to trace which part of the boot sequence registers which feature

### Why It Is Harmful
Boot sequence debugging requires knowing which provider does what. A fat provider violates SRP, making it impossible to isolate which initialization step is slow or failing. The provider list in `config/app.php` no longer documents the application's architecture.

### Real-World Consequences
A production incident causes 404 errors on certain routes. Debugging requires tracing through a 300-line `AppServiceProvider::boot()` method. The developer cannot find which section registers the missing routes. After 2 hours, they discover the route registration is conditionally gated by a feature flag checked earlier in the same method and silently skipped.

### Preferred Alternative
Create focused providers per concern: `RouteServiceProvider`, `EventServiceProvider`, `AuthServiceProvider`, feature-specific providers. Each provider documents one aspect of the boot sequence.

### Refactoring Strategy
1. List every concern handled in the fat provider (bindings, routes, events, gates, views, commands)
2. Create a dedicated provider for each concern
3. Move each section of code to its dedicated provider
4. Register each new provider in `config/app.php` in dependency order

### Detection Checklist
- [ ] Single provider exceeds 150 lines
- [ ] `AppServiceProvider` handles routes, events, gates, and views
- [ ] Hard to find where a specific feature is initialized

### Related Rules
Complete Boot Sequence Rule 1 (05-rules.md): Never Resolve Services in register().
Complete Boot Sequence Rule 3 (05-rules.md): Understand the 16-Step Boot Sequence Order.

### Related Skills
Navigate the Complete Boot Sequence (06-skills.md).

### Related Decision Trees
Provider Design (07-decision-trees.md).

---

## Anti-Pattern 2: Manual `$app->boot()` Invocation

### Category
Reliability

### Description
Calling `$app->boot()` or `app()->boot()` from middleware, controllers, or any application code.

### Why It Happens
Developers need services to be "fully initialized" at a certain point and call boot manually, not trusting or understanding the framework's automatic boot management.

### Warning Signs
- `$app->boot()` called in middleware or controllers
- `app()->boot()` in application service code
- Comments like "force boot providers" in middleware

### Why It Is Harmful
The framework manages the boot phase automatically. Manual booting can trigger double-boot (guarded by `$booted` flag but can cause issues) or boot providers before all registrations complete, causing `BindingResolutionException`.

### Real-World Consequences
A middleware calls `app()->boot()` to ensure all providers are initialized before handling the request. During a service provider's `register()` method, it calls `$this->app->boot()` thinking it will speed things up. This forces an early boot — all providers' `boot()` methods run, but service registrations from later providers are not yet complete. Services that expect bindings from later providers crash.

### Preferred Alternative
Remove all manual boot calls. If code must run after boot, register a `booted()` callback in a provider's `register()` method.

### Refactoring Strategy
1. Search for all `$app->boot()` and `app()->boot()` calls in application code
2. Remove each one — the framework handles boot timing
3. Replace any code that depended on manual boot with a `booted()` callback

### Detection Checklist
- [ ] `$app->boot()` called outside framework internals
- [ ] `app()->boot()` in middleware or controllers
- [ ] Double boot or early boot errors in production logs

### Related Rules
Complete Boot Sequence Rule 6 (05-rules.md): Never Call $app->boot() Manually.

### Related Skills
Navigate the Complete Boot Sequence (06-skills.md).

### Related Decision Trees
Error Categorization by Boot Phase (07-decision-trees.md).

---

## Anti-Pattern 3: Production Without Bootstrap Caching

### Category
Performance

### Description
Running Laravel in production without `config:cache`, `route:cache`, and `event:cache`.

### Why It Happens
Developers neglect deployment pipeline configuration. Cache commands are not in the deploy script, or developers are unaware of their impact.

### Warning Signs
- Deploy script with only `git pull` and `php artisan migrate`
- No `php artisan optimize` in deployment pipeline
- Bootstrap time exceeding 80ms in production monitoring

### Why It Is Harmful
Without caching, every request pays full file-parsing costs: config loading (10-40ms), route registration (20-40ms for 500 routes), and event listener discovery (10-30ms). Combined, this adds 30-80ms unnecessary bootstrap overhead per request.

### Real-World Consequences
A production server handles 500 requests per second without bootstrap caching. Each request spends 50ms on bootstrap overhead. That's 25 seconds of cumulative bootstrap time per second — meaning 25 concurrent processes just booting. With caching, bootstrap drops to 5ms, freeing 22.5 seconds of CPU time per second.

### Preferred Alternative
Always run `php artisan optimize` (or individual cache commands) as part of the production deployment pipeline.

### Refactoring Strategy
1. Add `php artisan config:cache` to the deploy script
2. Add `php artisan route:cache` to the deploy script
3. Add `php artisan event:cache` to the deploy script
4. If using closures in routes, replace them with controller classes

### Detection Checklist
- [ ] No `config:cache` in deploy pipeline
- [ ] No `route:cache` in deploy pipeline
- [ ] No `event:cache` in deploy pipeline
- [ ] Bootstrap time > 30ms consistently

### Related Rules
Complete Boot Sequence Rule 2 (05-rules.md): Cache Configuration and Routes in Production.
Complete Boot Sequence Rule 5 (05-rules.md): Monitor Bootstrap Time in Production.

### Related Skills
Navigate the Complete Boot Sequence (06-skills.md).

### Related Decision Trees
Bootstrap Optimization Strategy (07-decision-trees.md).

---

## Anti-Pattern 4: Ignoring Boot Phase for Error Diagnosis

### Category
Architecture

### Description
Debugging bootstrap errors without considering which boot phase produced the error — treating all bootstrap errors the same way.

### Why It Happens
Developers see "server error 500" and jump to code changes without tracing back to which boot phase produced the failure.

### Warning Signs
- Debugging config issues when the problem is facade registration order
- Trying to "fix" bootstrappers when the issue is in provider registration order
- Spending hours debugging without mapping the error to the 16-step sequence

### Why It Is Harmful
Each boot phase makes specific services available. Before `LoadEnvironmentVariables`, no `.env` values exist. Before `LoadConfiguration`, `config()` returns null. Before `RegisterFacades`, facades throw. Debugging in the wrong phase wastes time and leads to incorrect fixes.

### Real-World Consequences
An error shows `config('app.key')` returns null. A developer spends 3 hours debugging config files. The actual issue: `config:cache` was run, but the `.env` file was missing a key at cache-build time. The error originates in `LoadConfiguration` phase — the config was cached without the key. The developer should have checked the cached config, not the running code.

### Preferred Alternative
Map every bootstrap error to its boot phase: class/facade not found → `RegisterFacades`; config null → `LoadConfiguration`; binding resolution failed → `RegisterProviders`/`BootProviders`; ENV null → `LoadEnvironmentVariables`.

### Refactoring Strategy
1. Identify the error type
2. Map it to the boot phase: `BindingResolutionException` → provider phase; missing config → `LoadConfiguration`; facade error → `RegisterFacades`
3. Debug the specific phase, not the general bootstrap

### Detection Checklist
- [ ] Undirected bootstrap debugging without phase mapping
- [ ] Trying to "fix" bootstrappers for issues in provider phases
- [ ] Long debugging sessions for bootstrap errors

### Related Rules
Complete Boot Sequence Rule 3 (05-rules.md): Understand the 16-Step Boot Sequence Order.

### Related Skills
Navigate the Complete Boot Sequence (06-skills.md).

### Related Decision Trees
Error Categorization by Boot Phase (07-decision-trees.md).

---

## Anti-Pattern 5: Resolving Services in register()

### Category
Framework Usage

### Description
Calling `$this->app->make()`, `resolve()`, or `app()` inside a service provider's `register()` method.

### Why It Happens
Developers treat `register()` as a general initialization method and assume all services are available because the Application exists.

### Warning Signs
- `$this->app->make()` called in `register()`
- `app('service')` or `resolve('service')` in `register()`
- `BindingResolutionException` during provider registration

### Why It Is Harmful
The `register()` phase runs before all providers have registered. Resolving a service whose provider hasn't registered yet throws `BindingResolutionException`. This creates non-deterministic failures depending on provider ordering in `config/app.php`.

### Real-World Consequences
A provider calls `app(Cache::class)` in `register()`. In development, CacheServiceProvider is registered earlier in the array. In production, a package discovery reorders providers. The Cache provider registers after this one. Production crashes with `BindingResolutionException` on every request.

### Preferred Alternative
Keep `register()` pure — bindings only. Move all service resolution to `boot()` where every provider's bindings are available.

### Refactoring Strategy
1. Search all `register()` methods for `$this->app->make()`, `resolve()`, `app()`
2. Move each resolution call to the provider's `boot()` method
3. If a binding depends on a resolved value, register a closure that captures the dependency lazily

### Detection Checklist
- [ ] `$this->app->make()` in `register()`
- [ ] `resolve()` or `app()` in `register()`
- [ ] `BindingResolutionException` during bootstrap

### Related Rules
Complete Boot Sequence Rule 1 (05-rules.md): Never Resolve Services in register().

### Related Skills
Navigate the Complete Boot Sequence (06-skills.md).

### Related Decision Trees
Error Categorization by Boot Phase (07-decision-trees.md).
