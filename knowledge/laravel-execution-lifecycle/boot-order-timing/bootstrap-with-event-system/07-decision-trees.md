# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Bootstrap With Event System
**Generated:** 2026-06-03

---

# Decision Inventory

1. Observer Strategy: Bootstrap events vs provider `boot()` vs lifecycle hooks
2. Listener Registration Timing: `register()` vs `boot()` for bootstrap event listeners
3. Event Name Specificity: Wildcard vs specific event name patterns

---

# Architecture-Level Decision Trees

---

## Decision Name: Bootstrap Observer Strategy

---

## Decision Context

Choosing between bootstrap events (`bootstrapping:*`, `bootstrapped:*`), provider `boot()` methods, and lifecycle hooks (`booting()`/`booted()`) for observing or interacting with the bootstrap process.

---

## Decision Criteria

* performance — bootstrap events add 1-50µs per listener per bootstrapper; lightweight
* architectural — bootstrap events fire per bootstrapper; provider `boot()` fires once per provider; lifecycle hooks wrap the entire boot phase
* security — bootstrap events have full container access before middleware
* maintainability — bootstrap events are for monitoring; providers are for initialization

---

## Decision Tree

Do you need to observe or measure the bootstrap process (profiling, monitoring)?
↓
YES → Use bootstrap events — they fire before/after each bootstrapper for precise timing
NO → Do you need to execute initialization logic for a specific provider?
↓
YES → Use the provider's `boot()` method — the standard initialization point
NO → Do you need logic that runs before/after ALL providers boot (not per-provider)?
↓
YES → Use `booting()`/`booted()` lifecycle hooks — they wrap the entire boot phase
NO → Do you need to modify state BEFORE a specific bootstrapper runs?
↓
YES → Use the specific `bootstrapping:loadConfiguration` or similar event — precise timing, before the bootstrapper
NO → Use provider `boot()` — the default for most initialization logic

---

## Rationale

Bootstrap events fire per-bootstrapper for precise observation. Provider `boot()` is the standard initialization point. Lifecycle hooks wrap the entire boot phase. Choosing the right mechanism depends on whether you need per-bootstrapper precision (bootstrap events), per-provider initialization (provider `boot()`), or cross-provider coordination (lifecycle hooks).

---

## Recommended Default

**Default:** Use provider `boot()` for initialization; use bootstrap events only for monitoring/profiling.
**Reason:** Provider `boot()` is the documented, stable extension point. Bootstrap events are for cross-cutting observation.

---

## Risks Of Wrong Choice

- Using bootstrap events for initialization: runs outside the provider lifecycle — may execute before services are ready.
- Using provider `boot()` for monitoring: cannot measure individual bootstrapper phases.
- Registering listener too late: listener in `boot()` never fires — bootstrap events already dispatched.

---

## Related Rules

- Register bootstrap listeners before bootstrappers run (05-rules.md, Rule 1)
- Keep bootstrap event listeners lightweight (05-rules.md, Rule 2)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

---

## Decision Name: Bootstrap Event Listener Registration Timing

---

## Decision Context

Deciding where to register bootstrap event listeners to ensure they fire at the correct time.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — bootstrap events fire during the bootstrap pipeline, before provider `boot()` methods
* security — listeners registered too late silently never execute
* maintainability — `register()` is the correct phase for registration

---

## Decision Tree

Is the listener registered before the `bootstrapping:*` event fires for the target bootstrapper?
↓
YES → Register in a provider's `register()` method or in `bootstrap/app.php`
NO → Are you considering registering in a provider's `boot()` method?
↓
YES → Too late — bootstrap events fire before `boot()` methods run
NO → Are you registering in a middleware or controller?
↓
YES → Much too late — bootstrap events fire before any middleware runs
NO → Register in `register()` — the only safe phase for bootstrap event listeners

---

## Rationale

Bootstrap events (`bootstrapping:*`, `bootstrapped:*`) are dispatched during the kernel's bootstrap pipeline, which runs before any provider's `boot()` is called. Listeners registered in `boot()` are too late — the events have already fired. The only safe place for bootstrap event listeners is in a provider's `register()` method (or in `bootstrap/app.php`), which runs during `RegisterProviders` bootstrapper — before the events fire.

---

## Recommended Default

**Default:** Register bootstrap event listeners in a service provider's `register()` method.
**Reason:** Guarantees listener is registered before any bootstrap event fires.

---

## Risks Of Wrong Choice

- Listener in `boot()`: silently never executes — wasting debugging time.
- Listener in middleware: executed on every request, not during bootstrap — incorrect timing.
- Listener in `bootstrap/app.php` builder closure: works but harder to maintain than a provider.

---

## Related Rules

- Register bootstrap listeners before bootstrappers run (05-rules.md, Rule 1)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
