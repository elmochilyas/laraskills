# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Boot Phase Order
**Generated:** 2026-06-03

---

# Decision Inventory

1. Boot Logic Placement: Provider `boot()` vs lifecycle hooks vs middleware
2. Binding Safety: Adding bindings in `boot()` vs `register()`
3. Boot Phase Overhead: Eager vs deferred provider strategy

---

# Architecture-Level Decision Trees

---

## Decision Name: Boot Logic Placement

---

## Decision Context

Choosing between placing initialization logic in a provider's `boot()` method, a lifecycle callback (`booting()`/`booted()`), or middleware.

---

## Decision Criteria

* performance — `boot()` runs on every request (eager providers); hooks add negligible overhead
* architectural — `boot()` runs after all providers registered; hooks wrap the entire boot phase
* security — `boot()` has full container access; middleware has request context
* maintainability — provider `boot()` is the correct place for provider-specific initialization

---

## Decision Tree

Is the initialization specific to a single provider's services?
↓
YES → Use the provider's `boot()` method — the correct place for provider-specific initialization
NO → Does the initialization need to run BEFORE any provider boots?
↓
YES → Use `$app->booting()` callback — wraps the entire boot phase
NO → Does the initialization need to run AFTER all providers have booted?
↓
YES → Use `$app->booted()` callback — fires after all providers complete boot()
NO → Does the initialization need access to the current request (request context)?
↓
YES → Use middleware — runs during the request pipeline, has access to request, session, auth
NO → Use the provider's `boot()` method — default location for initialization logic

---

## Rationale

Each provider's `boot()` method is the correct place for that provider's initialization — route registration, event listeners, view composers, gate definitions. `booting()`/`booted()` callbacks are for cross-provider coordination (logic that must run before/after ALL providers boot). Middleware is for per-request logic that needs request context. Choosing the wrong level creates ordering bugs or unnecessary overhead.

---

## Recommended Default

**Default:** Provider `boot()` for initialization; only use `booting()`/`booted()` for cross-provider coordination.
**Reason:** Keeps initialization with the provider that owns it; hooks are for cross-cutting concerns.

---

## Risks Of Wrong Choice

- Provider-specific logic in `booted()` hook: runs after all providers have booted — delays provider-specific setup.
- Cross-provider logic in provider `boot()`: may run before another provider's `boot()` — order-dependent if not coordinated.
- Initialization in middleware: runs on every request instead of once per lifecycle — unnecessary overhead in FPM; state leaks in Octane.

---

## Related Rules

- Separate binding registration from initialization (05-rules.md, Rule 1)
- Avoid heavy I/O in boot (05-rules.md, Rule 2)
- Use boot() for initialization, not register() (register-phase-order, Rule 1)

---

## Related Skills

- Structure Service Provider boot() Methods

---

## Decision Name: Binding Registration in Boot Phase

---

## Decision Context

Deciding whether it is safe to register container bindings in the `boot()` method rather than `register()`.

---

## Decision Criteria

* performance — no difference; bindings registered in `boot()` are available for the rest of the request
* architectural — bindings in `boot()` are invisible to deferred providers that resolved before boot
* security — late-registered bindings may override expected defaults
* maintainability — mixing bindings in both phases is confusing and error-prone

---

## Decision Tree

Is the binding needed by other providers during their `boot()` methods?
↓
YES → Must be in `register()` — bindings in `boot()` are invisible until boot() runs
NO → Does the provider implement `DeferrableProvider`?
↓
YES → Must be in `register()` — deferred providers only guarantee `register()` timing; `boot()` may not run
NO → Would a deferred provider that resolves early miss this binding?
↓
YES → Must be in `register()` — early-resolving deferred providers check bindings before boot()
NO → Register in `register()` — it is always the correct phase for bindings

---

## Rationale

All container bindings should be registered in `register()`. Bindings registered in `boot()` are invisible to deferred providers that resolved before boot and to other providers' `register()` methods. The framework guarantees all `register()` calls complete before any `boot()` starts, making `register()` the only safe place for bindings.

---

## Recommended Default

**Default:** ALL container bindings in `register()`; NONE in `boot()`.
**Reason:** Ensures visibility to all providers and deferred providers.

---

## Risks Of Wrong Choice

- Binding in `boot()`: deferred providers that resolved before this provider's `boot()` cannot see the binding.
- Binding in `boot()`: `$bindings` and `$singletons` properties (processed after `register()`) are not compatible.
- Binding in `boot()`: creates confusion about where bindings should be found during debugging.

---

## Related Rules

- Separate binding registration from initialization (05-rules.md, Rule 1)
- Never resolve services in `register()` (register-phase-order, Rule 1)

---

## Related Skills

- Structure Service Provider boot() Methods
- Separate Service Registration from Initialization (ku-01-register-vs-boot)
