# ECC Anti-Patterns — HTTP Kernel Dispatch

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Request Lifecycle |
| **Knowledge Unit** | HTTP Kernel Dispatch |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Calling bootstrap() Manually
2. Mutating $middleware at Runtime
3. Adding Route-Scoped Middleware as Global
4. Kernel Subclassing for Behavioral Changes
5. Restructuring Kernel Execution Phase Order

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — kernel orchestrates phases, not data access
- Premature Caching — kernel bootstrap is the caching target, not a source of caching issues

---

## Anti-Pattern 1: Calling bootstrap() Manually

### Category
Reliability

### Description
Calling `$kernel->bootstrap()` or `$app->bootstrapWith()` from service providers or middleware — re-runs all bootstrappers, resetting configuration.

### Why It Happens
Developers need bootstrap-time logic and assume calling `bootstrap()` is the correct approach.

### Warning Signs
- `$this->app->bootstrapWith(...)` in provider code
- Configuration reset mid-request
- Facades becoming unbound during request processing

### Why It Is Harmful
`bootstrap()` is guarded by `hasBeenBootstrapped()` to run once. Calling it manually bypasses the guard, re-executing all 6 core bootstrappers mid-request: `LoadEnvironmentVariables` reloads .env (variables reset), `LoadConfiguration` reloads all config (runtime config changes lost), `RegisterFacades` re-registers facade aliases, `RegisterProviders` and `BootProviders` re-register all service bindings. This destroys all runtime state.

### Preferred Alternative
Add a custom bootstrapper to the bootstrapper array for new initialization. Use provider `boot()` for provider-level logic.

### Detection Checklist
- [ ] `bootstrap()` or `bootstrapWith()` manually called
- [ ] Configuration reset mid-request
- [ ] Façade bindings lost

### Related Rules
Never Call bootstrap() Manually (05-rules.md)

---

## Anti-Pattern 2: Mutating $middleware at Runtime

### Category
Reliability

### Description
Modifying `$this->middleware` or `$middlewareGroups` after kernel construction — changes silently ignored.

### Preferred Alternative
Configure middleware in `bootstrap/app.php` (Laravel 11+) or kernel properties (Laravel 10).

### Detection Checklist
- [ ] `app(Kernel::class)->middleware[] = ...` in provider
- [ ] Middleware not running despite being "added"
- [ ] Pipeline snapshot ignores runtime changes

---

## Anti-Pattern 3: Adding Route-Scoped Middleware as Global

### Category
Architecture

### Description
Adding auth, rate limiting, or throttle middleware to global stack — affects health checks, assets, and webhooks.

### Preferred Alternative
Use middleware groups for route-scoped middleware. Reserve global for infrastructure concerns.

### Detection Checklist
- [ ] Auth middleware in global stack
- [ ] Health checks blocked by auth
- [ ] Rate limiting on asset URLs

---

## Anti-Pattern 4: Kernel Subclassing for Behavioral Changes

### Category
Architecture

### Description
Modifying the kernel class or subclassing it for logging, metrics, or other behavioral changes instead of using middleware.

### Preferred Alternative
Use middleware, lifecycle hooks, or event listeners for behavioral changes.

### Detection Checklist
- [ ] Custom kernel subclass for logging
- [ ] Behavioral changes in kernel override
- [ ] Middleware could replace the change

---

## Anti-Pattern 5: Restructuring Kernel Execution Phase Order

### Category
Reliability

### Description
Reversing the order (route dispatch before bootstrap) or skipping phases — breaks framework assumptions.

### Preferred Alternative
Maintain: bootstrappers → middleware pipeline → route dispatch → response → terminate.

### Detection Checklist
- [ ] Route dispatch before bootstrap
- [ ] Pipeline phase skipped
- [ ] Configuration missing when middleware runs
