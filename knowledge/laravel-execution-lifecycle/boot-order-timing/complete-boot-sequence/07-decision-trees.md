# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Complete Boot Sequence
**Generated:** 2026-06-03

---

# Decision Inventory

1. Bootstrap Optimization: Caching strategy for bootstrap phases
2. Provider Design: Provider architecture aligned with boot sequence
3. Error Categorization: Diagnosing which boot phase produced an error

---

# Architecture-Level Decision Trees

---

## Decision Name: Bootstrap Optimization Strategy

---

## Decision Context

Choosing which caching commands to run and which providers to defer to optimize the 16-step boot sequence.

---

## Decision Criteria

* performance — caching reduces bootstrap from 30-80ms to 5-15ms
* architectural — caching freezes config/route/event state at build time
* security — env() calls in cached config are resolved at build time, not runtime
* maintainability — caching requires CI pipeline integration and cache invalidation on deploy

---

## Decision Tree

Is the application in production?
↓
YES → Run ALL caches: `php artisan optimize` (config, events, routes)
NO → Is the application experiencing slow bootstrap time?
↓
YES → Profile to identify the bottleneck:
  - `LoadConfiguration` slow? → Run `config:cache`
  - `RegisterProviders`/`BootProviders` slow? → Defer binding-only providers
  - Route registration slow? → Run `route:cache`
  - Event discovery slow? → Run `event:cache`
NO → Are you developing new features?
↓
YES → No caching needed; clear caches frequently: `php artisan optimize:clear`
NO → Run `php artisan optimize` in production; use `optimize:clear` during development

---

## Rationale

Bootstrap time breakdown: Composer autoloader (1-3ms), config loading (10-40ms uncached), provider registration (5-20ms), provider boot (10-30ms), middleware pipeline (1-5ms). Config caching reduces config loading to <1ms. Route caching eliminates route registration entirely (replaces with compiled matcher). Event caching eliminates listener discovery overhead. Combined, caching reduces total bootstrap time by 60-80%.

---

## Recommended Default

**Default:** `php artisan optimize` in production deployment pipeline; `php artisan optimize:clear` during development.
**Reason:** Maximum performance in production; maximum flexibility in development.

---

## Risks Of Wrong Choice

- No caching in production: 30-80ms unnecessary bootstrap overhead per request — directly impacts response time and server capacity.
- Caching during development: config/route/event changes not reflected until cache is cleared.
- Using `env()` after `config:cache`: returns null for any key not in `$_ENV` at build time.

---

## Related Rules

- Cache aggressively — config, routes, events (05-rules.md, Rule 1)
- Never call env() after config:cache (bootstrapper-sequence, Rule 3)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

---

## Decision Name: Error Categorization by Boot Phase

---

## Decision Context

Mapping an error message or symptom to the specific boot phase where the error originates.

---

## Decision Criteria

* performance — not applicable
* architectural — each boot phase has specific available/unavailable services
* security — errors in early phases (before HandleExceptions) have no custom error handlers
* maintainability — phase-aware debugging is faster than undirected debugging

---

## Decision Tree

Does the error occur before the Laravel application responds (white screen, HTTP 500, no output)?
↓
YES → Is the error "Class not found" or autoloader-related?
YES → Composer autoloader phase or `RegisterFacades` — check autoload and aliases
NO → Is the error "BindingResolutionException"?
↓
YES → `RegisterProviders` or `BootProviders` phase — service resolved before its provider registered
NO → Is the error about missing config values?
↓
YES → `LoadConfiguration` phase — config file not found, syntax error, or env() returning null
NO → Is the error about environment not loaded?
↓
YES → `LoadEnvironmentVariables` phase — .env file missing or permissions issue
NO → Is the error an unhandled exception that should be caught?
↓
YES → `HandleExceptions` phase — error handler not yet registered; check if HandleExceptions bootstrapper ran
NO → Check middleware pipeline — error may be from a middleware, not bootstrap

---

## Rationale

Each of the six bootstrappers makes specific services available. Before `LoadEnvironmentVariables`, no `.env` values exist. Before `LoadConfiguration`, `config()` returns null. Before `HandleExceptions`, errors use PHP's default handler (no Laravel error page). Before `RegisterFacades`, facades throw. Before `RegisterProviders`, no user bindings exist. Identifying which phase produced the error halves debugging time.

---

## Recommended Default

**Default:** Check the error type against the bootstrapper availability chart:
- Class/facade not found → RegisterFacades
- Config null → LoadConfiguration
- Binding resolution failed → RegisterProviders/BootProviders
- ENV null → LoadEnvironmentVariables
- Raw PHP error (no Laravel page) → HandleExceptions

---

## Risks Of Wrong Choice

- Debugging in wrong phase: looking for config issues when the problem is facade registration.
- Adding the wrong bootstrapper: trying to "fix" by modifying Kernel bootstrappers — not a supported extension.
- Ignoring boot phase for runtime errors: runtime errors (middleware, controller) may look like bootstrap errors.

---

## Related Rules

- Cache aggressively (05-rules.md, Rule 1)
- Keep register() pure (register-phase-order, Rule 1)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
