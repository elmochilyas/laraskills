# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-08-event-listener-registration-order
**Generated:** 2026-06-03

---

# Decision Inventory

1. Listener Registration Method: `$listen` array vs `Event::listen()` in boot()
2. Listener Dependency: Order-dependent vs order-independent listeners
3. Listener Discovery: Explicit `$listen` vs auto-discovery

---

# Architecture-Level Decision Trees

---

## Decision Name: Listener Registration Method

---

## Decision Context

Choosing between the declarative `$listen` array on `EventServiceProvider` and programmatic `Event::listen()` calls in `boot()`.

---

## Decision Criteria

* performance — `$listen` is cacheable by `event:cache`; `Event::listen()` is not
* architectural — `$listen` is static and declarative; `Event::listen()` supports conditional registration
* security — cacheable mappings are deterministic; runtime registrations are not
* maintainability — `$listen` is visible at a glance; `Event::listen()` calls are scattered

---

## Decision Tree

Is the listener mapping static (always registered, no runtime conditions)?
↓
YES → Use `$listen` array on the EventServiceProvider — cacheable, declarative, visible at a glance
NO → Does the listener registration depend on runtime configuration or feature flags?
↓
YES → Use `Event::listen()` in provider `boot()` — accept caching limitation
NO → Is the listener for a package that must remain decoupled?
↓
YES → Use `Event::listen()` or subscriber class for loose coupling
NO → Use `$listen` array — always prefer the declarative, cacheable approach

---

## Rationale

The `$listen` array is declarative, visible at a glance, and cacheable by `event:cache`. Programmatic `Event::listen()` in `boot()` cannot be cached — listeners registered this way are re-registered on every uncached request, adding 10-30ms runtime discovery overhead on every uncached request. For static mappings, `$listen` is strictly superior.

---

## Recommended Default

**Default:** `$listen` array for all static event-to-listener mappings; `Event::listen()` only for conditional registrations.
**Reason:** Cacheable, declarative, and performant.

---

## Risks Of Wrong Choice

- Using `Event::listen()` for all listeners: `event:cache` provides no benefit — every request redisovers listeners.
- Using `$listen` for conditional listeners: listener is always registered regardless of condition — waste.
- Duplicate listeners from mixing `$listen` and auto-discovery: listener executes twice for one dispatch.

---

## Related Rules

- Use `$listen` array for static, cacheable mappings (05-rules.md, Rule 1)
- Cache events in production with `event:cache` (05-rules.md, Rule 4)

---

## Related Skills

- Register and Order Event Listeners

---

## Decision Name: Listener Order Dependency

---

## Decision Context

Designing event listeners to be order-independent or managing order when sequencing is required.

---

## Decision Criteria

* performance — no meaningful impact
* architectural — order-dependent listeners share implicit state, creating fragile chains
* security — listener order affects when security checks vs business logic execute
* maintainability — order-dependent listeners break when adding or removing listeners

---

## Decision Tree

Do two listeners for the same event depend on each other's side effects?
↓
YES → Refactor into a SINGLE listener that sequences operations internally
NO → Does listener A produce state that listener B consumes?
↓
YES → Merge into one listener; or use a shared service the listeners both call
NO → Is execution order semantically important (e.g., validation before notification)?
↓
YES → Order by `$listen` array position within the same provider; or use priority (`Event::listen(..., $priority)`)
NO → If no dependency exists, order does not matter — listeners are independent

---

## Rationale

Order-dependent listeners share implicit state, creating a fragile chain where changing one listener's order breaks another. This violates the observer pattern principle that events should broadcast to independent observers. If order matters, a single listener that sequences operations internally is more maintainable and testable.

---

## Recommended Default

**Default:** Design all listeners to be order-independent. If order is required, merge into a single sequenced listener.
**Reason:** Independent listeners are maintainable, testable, and can be freely reordered.

---

## Risks Of Wrong Choice

- Order-dependent listeners: adding a new listener between existing ones changes behavior unexpectedly.
- Priority misuse: priority 10 vs 0 vs -10 creates a fragile ordering that is hard to audit.
- Listener A depends on Listener B's side effect: refactoring B (e.g., to be deferred) breaks A silently.

---

## Related Rules

- Avoid listener order dependency (05-rules.md, Rule 2)
- Use explicit priority sparingly (05-rules.md, Rule 3)

---

## Related Skills

- Register and Order Event Listeners
