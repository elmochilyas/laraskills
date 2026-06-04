# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Event-Driven Architecture
- **Knowledge Unit:** K026 — ShouldBeDiscovered Interface (Laravel 13.12+)
- **Knowledge ID:** K026
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Events (Laravel 13.x)
  - Laravel Source — `Illuminate\Contracts\Events\ShouldBeDiscovered`
  - Laravel Source — `Illuminate\Events\EventDiscoveryService`

---

# Overview

Introduced in Laravel 13.12, `ShouldBeDiscovered` is a marker interface that provides opt-in control over auto-discovery of event listeners. By default, all listeners in `app/Listeners` with `handle()` or `__invoke()` methods are auto-discovered. Implementing `ShouldBeDiscovered` on a listener makes it eligible for discovery; removing it (or not implementing it) prevents the listener from being auto-registered. This allows packaging listeners with an application while controlling which ones are active through the interface rather than manual registration.

---

# Core Concepts

- **Marker interface:** `ShouldBeDiscovered` has no methods. Its presence indicates the listener should be considered for auto-discovery.
- **Opt-in behavior:** Only listeners implementing `ShouldBeDiscovered` are discovered by default. Non-implementing listeners are skipped.
- **Backward compatibility:** Existing applications without `ShouldBeDiscovered` continue to discover all listeners (default behavior unchanged from before 13.12).
- **Selective discovery:** Mix discovered and non-discovered listeners in `app/Listeners`. Control each individually.

---

# When To Use

- New Laravel 13.12+ projects where explicit control over active listeners is desired
- Staged listener activation — deploy listeners to filesystem but activate them later via the interface
- Package development — ship listeners in packages but let the consuming application opt-in
- Feature-branch safe listeners — merge listener code without accidentally activating it
- Environments where accidental listener activation must be prevented

---

# When NOT To Use

- Existing applications without upgrading to 13.12 — the interface is not recognized on earlier versions
- Applications where ALL listeners in `app/Listeners` should always be active — the interface adds unnecessary ceremony
- Listeners registered manually via `$listen` or `EventServiceProvider::boot()` — the interface only affects auto-discovery
- Simple applications with few listeners where discovery control is not needed

---

# Best Practices

- **Audit all auto-discovered listeners before upgrading to 13.12.** Any listener that must remain active needs `ShouldBeDiscovered` implemented. *Why: Without the interface, listeners stop being auto-discovered after upgrade — they silently deactivate.*
- **Use `ShouldBeDiscovered` for new listeners in existing apps.** This creates a consistent pattern regardless of whether the app uses discovery or manual registration. *Why: Mixing opt-in and default behavior creates inconsistency — standardize on one approach.*
- **Document the interface requirement for package listeners.** If a package ships listeners for auto-discovery, the consuming app must know to implement `ShouldBeDiscovered`. *Why: The interface is the gatekeeper for discovery — without it, package listeners are invisible.*
- **Test listener activation after implementing the interface.** Verify the listener fires after the interface is added. *Why: The interface check is silent — a missing `use` statement or wrong namespace prevents discovery without error.*

---

# Architecture Guidelines

- The check is `in_array(ShouldBeDiscovered::class, class_implements($listener))` — a fast array lookup.
- The interface does NOT affect manually registered listeners in `$listen` or `EventServiceProvider::boot()`.
- Cached mode (`event:cache`) respects `ShouldBeDiscovered` — cached mapping only includes listeners that implement it.
- The interface applies to both `handle()` and `__invoke()` listeners equally.
- `Event::fake()` is not affected — it replaces the event dispatcher entirely.

---

# Performance Considerations

- The `class_implements()` check is O(1) — negligible overhead compared to filesystem scanning (~0.001ms per listener).
- No impact on runtime event dispatch performance. Discovery is a boot-time concern.
- The interface check replaces the previous unconditional discovery — no net performance change.

---

# Security Considerations

- A listener accidentally implementing `ShouldBeDiscovered` may activate a listener that was intentionally dormant. Code review should verify interface implementations.
- Removal of `ShouldBeDiscovered` from a listener is equivalent to disabling it — no other security mechanism prevents the listener from running while the interface is present.
- The interface provides no access control — a listener that implements it is available to ALL event dispatches, not filtered by context.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not implementing after upgrade | Forgetting to add `ShouldBeDiscovered` to existing listeners | All previously auto-discovered listeners stop working silently | Audit and implement before 13.12 upgrade |
| Implementing on manually registered listeners | Misunderstanding the interface scope | No effect — listener already registered via `$listen` | Only use the interface for auto-discovered listeners |
| Forgetting `use` statement | Interface not imported | Listener not discovered — no error or warning | Always verify with `php artisan event:list` after adding |
| Not updating tests | Tests assume listener is active | Tests fail — listener no longer fires | Update tests to match discovery state |

---

# Anti-Patterns

- **Using `ShouldBeDiscovered` as a feature flag:** The interface controls discovery at boot time, not runtime. It cannot enable/disable listeners dynamically. Use a feature flag inside the listener for runtime control.
- **Implementing the interface on ALL listeners indiscriminately:** This negates the opt-in purpose. Only implement on listeners that should be actively discovered.
- **Removing the interface in an emergency:** Removing the interface disables the listener but does not compensate for any side effects the listener may have already triggered.

---

# Examples

```php
// Listener that implements ShouldBeDiscovered — eligible for auto-discovery
use Illuminate\Contracts\Events\ShouldBeDiscovered;

class SendShipmentNotification implements ShouldBeDiscovered
{
    public function handle(OrderShipped $event): void
    {
        // This listener is auto-discovered because it implements ShouldBeDiscovered
    }
}

// Listener without ShouldBeDiscovered — NOT auto-discovered (Laravel 13.12+)
class LogOrderShipped
{
    public function handle(OrderShipped $event): void
    {
        // This listener is NOT auto-discovered
        // Must be registered manually in EventServiceProvider
    }
}

// Manual registration of non-discovered listener
// In EventServiceProvider
protected $listen = [
    OrderShipped::class => [
        LogOrderShipped::class, // manually registered despite being in app/Listeners
    ],
];
```

---

# Related Topics

- **K025 Event Auto-Discovery (K025)** — Mechanism that `ShouldBeDiscovered` controls
- **K029 Wildcard Event Listener Discovery (K029)** — Pattern-based event matching interaction with discovery control

---

# AI Agent Notes

- When generating listeners for Laravel 13.12+, include `implements ShouldBeDiscovered` if the listener should be auto-discovered. Omit it if the listener should be manually registered.
- The interface is in namespace `Illuminate\Contracts\Events\ShouldBeDiscovered`. Always include the `use` statement.
- For package development, do NOT implement `ShouldBeDiscovered` by default — let the consuming application opt-in.
- When generating upgrade guides from pre-13.12 to 13.12+, always include the step to audit and implement `ShouldBeDiscovered` on all active auto-discovered listeners.

---

# Verification

- [ ] Listener with `ShouldBeDiscovered` is auto-discovered — confirm handler fires when event dispatched
- [ ] Listener without `ShouldBeDiscovered` is NOT discovered — confirm handler does NOT fire automatically
- [ ] Interface does not affect manually registered listeners — confirm listener in `$listen` works regardless of interface
- [ ] `event:cache` respects the interface — verify cached mapping excludes non-implementing listeners
- [ ] Check `php artisan event:list` — verify only implementing listeners appear in the discovered list
