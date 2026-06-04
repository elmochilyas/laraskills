# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Lifecycle Callback Hooks
**Generated:** 2026-06-03

---

# Decision Inventory

1. Hook Selection: `booting()` vs `booted()` vs provider `boot()` vs bootstrap events
2. Registration Timing: `register()` vs `boot()` for hook registration
3. Fire-Once Awareness: Normal vs fire-once callback semantics

---

# Architecture-Level Decision Trees

---

## Decision Name: Hook Selection Strategy

---

## Decision Context

Choosing between `booting()`, `booted()`, provider `boot()`, and bootstrap events for executing logic at a specific point in the lifecycle.

---

## Decision Criteria

* performance — all add negligible overhead (0.5-2µs per callback)
* architectural — `booting()` = before any provider boot; `booted()` = after all providers boot; provider `boot()` = per-provider; bootstrap events = per-bootstrapper
* security — hooks have full container access; bootstrap events have even earlier access
* maintainability — provider `boot()` is preferred for provider-specific logic

---

## Decision Tree

Does the logic need to run before any provider's `boot()` method?
↓
YES → Use `$app->booting()` — fires before the first provider boots
NO → Does the logic need to run after ALL providers have booted (cross-provider coordination)?
↓
YES → Use `$app->booted()` — fires after all providers complete boot()
NO → Does the logic belong to a specific provider's initialization?
↓
YES → Use the provider's `boot()` method — the standard place for provider-specific logic
NO → Does the logic need to observe individual bootstrapper phases?
↓
YES → Use bootstrap events (`bootstrapping:*` / `bootstrapped:*`) for per-bootstrapper precision
NO → Use provider `boot()` — the default for most initialization

---

## Rationale

Provider `boot()` is the correct place for initialization that belongs to a specific provider. `booting()`/`booted()` callbacks are for logic that must execute before or after ALL providers boot — cross-cutting concerns. Bootstrap events provide per-bootstrapper precision for monitoring and profiling.

---

## Recommended Default

**Default:** Provider `boot()` for provider-specific logic; `booted()` for post-boot cross-cutting concerns.
**Reason:** Keeps initialization with the owning provider; callbacks are only for cross-provider coordination.

---

## Risks Of Wrong Choice

- Provider logic in `booted()` callback: runs after all providers have booted — unnecessarily delayed.
- Cross-cutting logic in provider `boot()`: only runs if that provider is active — may not cover all cases.
- Per-request logic in `booted()`: runs once per lifecycle (not per request) — state leaks in Octane.

---

## Related Rules

- Use booted() for post-provider setup (05-rules.md, Rule 1)
- Keep hooks focused (05-rules.md, Rule 2)
- Register hooks early (05-rules.md, Rule 3)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

---

## Decision Name: Hook Registration Timing

---

## Decision Context

Choosing the correct lifecycle phase for registering `booting()` and `booted()` callbacks.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — hooks must be registered BEFORE the boot phase executes
* security — late-registered hooks may have fire-once semantics or never fire
* maintainability — `register()` is the standard, safe phase

---

## Decision Tree

Is the hook registered in a service provider's `register()` method?
↓
YES → SAFE — hook is registered before the boot phase executes
NO → Is the hook registered in a provider's `boot()` method?
↓
YES → For `booted()` hook: SAFE but fires immediately (fire-once) if app is already booted. For `booting()` hook: TOO LATE — booting phase already passed
NO → Is the hook registered in middleware or a controller?
↓
YES → TOO LATE for both hooks — boot phase has already completed
NO → Register in `register()` — the only safe phase

---

## Rationale

`booting()` callbacks fire before the first provider's `boot()` is called. `booted()` callbacks fire after all providers have booted. If the app is already booted when a `booted()` callback is registered, it fires immediately (fire-once). Registering hooks in `register()` guarantees they are in place before the boot phase begins.

---

## Recommended Default

**Default:** Register both `booting()` and `booted()` callbacks in a service provider's `register()` method.
**Reason:** Guarantees hooks fire at the correct time in the lifecycle.

---

## Risks Of Wrong Choice

- `booting()` callback in `boot()`: callback never fires — the booting phase passed when the provider started booting.
- `booted()` callback in `boot()`: fires immediately (fire-once) — may execute before other providers' boot() completes.
- Hook in middleware: boot phase already completed — callback never fires for bootstrap hooks.

---

## Related Rules

- Register hooks early (05-rules.md, Rule 3)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
