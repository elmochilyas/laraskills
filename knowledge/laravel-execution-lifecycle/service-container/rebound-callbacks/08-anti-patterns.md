# ECC Anti-Patterns — Rebound Callbacks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Rebound Callbacks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Relying on Rebound for Application Bootstrap Logic
2. Using rebinding() on Non-Singleton Bindings
3. Removing Rebound Listeners via forgetInstance() Without Re-registering
4. Rebinding Callback Executed on Every Boot (Not Just First Resolution)
5. Using rebinding() When Simple Event Would Be Cleaner

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — rebound callbacks fire on instance refresh, not queries
- Premature Caching — rebound refreshes cached instances, not data caches

---

## Anti-Pattern 1: Relying on Rebound for Application Bootstrap Logic

### Category
Reliability

### Description
Using `rebinding()` to configure application dependencies at boot time — timeout-sensitive, order-dependent, tricky to debug.

### Why It Happens
Developers see `rebinding()` as a way to react to service availability without understanding its lifecycle (fires only on instance replacement, not initial resolution).

### Warning Signs
- Bootstrap logic inside a rebound callback
- Callback fires at unexpected times
- Initialization missed because instance was resolved (not replaced)

### Why It Is Harmful
A rebound callback fires ONLY when an existing singleton instance is replaced via `$app->instance()` or `$app->forgetInstance() + make()`. It does NOT fire on the first resolution. If your `rebinding()` callback is supposed to configure the service, and the service happens to be resolved before the rebinding listener is registered, the callback never runs. Configuration is silently skipped. This leads to intermittent failures that depend on resolution order and provider boot order.

### Preferred Alternative
Use `resolving()` callbacks for instance configuration at resolution time. Use boot methods in service providers for startup logic.

### Detection Checklist
- [ ] Bootstrap logic in rebinding()
- [ ] Callback not firing at expected time
- [ ] Resolution order affects behavior

### Related Rules
Use resolving() for Instance Configuration (05-rules.md)

---

## Anti-Pattern 2: Using rebinding() on Non-Singleton Bindings

### Category
Framework Usage

### Description
Registering a `rebinding()` callback on a `bind()` (transient) binding — the transient instance is never refreshed, so the callback never fires.

### Preferred Alternative
Use `resolving()` for transient configuration. Use `rebinding()` only on `singleton()` or `instance()` bindings.

### Detection Checklist
- [ ] rebinding() on transient binding
- [ ] Callback never fires
- [ ] Use resolving() instead

---

## Anti-Pattern 3: Removing Rebound Listeners via forgetInstance() Without Re-registering

### Category
Reliability

### Description
Calling `forgetInstance()` on a singleton with rebound listeners — listeners are detached and never re-attached.

### Preferred Alternative
Use `forgetInstance()` only when you intend to clear listeners. Re-register after if needed.

### Detection Checklist
- [ ] forgetInstance() on singleton with rebound listeners
- [ ] Listeners unexpectedly removed
- [ ] Manual re-registration needed

---

## Anti-Pattern 4: Rebinding Callback Executed on Every Boot (Not Just First Resolution)

### Category
Performance

### Description
Rebinding callbacks registered in provider `boot()` are re-registered on every Octane request — duplicate callbacks accumulate.

### Preferred Alternative
Register rebinding() in a deferred provider or guard against duplicate registration.

### Detection Checklist
- [ ] Duplicate callbacks under Octane
- [ ] Memory growth per request
- [ ] Callback registration not idempotent

---

## Anti-Pattern 5: Using rebinding() When Simple Event Would Be Cleaner

### Category
Architecture

### Description
Using container rebinding for application-level notifications instead of Laravel's event system.

### Preferred Alternative
Use Events for application notifications. Reserve rebinding() for container lifecycle concerns.

### Detection Checklist
- [ ] Application logic in rebinding()
- [ ] Event system more appropriate
- [ ] Container lifecycle mixed with business logic
