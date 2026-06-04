# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Event-Driven Architecture
- **Knowledge Unit:** K025 — Event Auto-Discovery via Directory Scanning
- **Knowledge ID:** K025
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Events: Generating Events & Listeners
  - Laravel Source — `Illuminate\Events\EventDiscoveryService`
  - Laravel Source — `Illuminate\Events\EventServiceProvider`

---

# Overview

Laravel auto-discovers event listeners by scanning the `app/Listeners` directory and checking each class for a `handle()` or `__invoke()` method. The parameter type-hint of these methods determines which event the listener handles. This eliminates manual `EventServiceProvider` registration for the common case. The scanner uses filesystem iteration to find listener classes, then reflects on their method signatures to build the event-listener mapping. Auto-discovery runs on each request unless cached via `event:cache`.

---

# Core Concepts

- **Directory-based discovery:** Listener classes inside `app/Listeners` are automatically discovered.
- **Method-based binding:** A listener's `handle(OrderShipped $event)` method signature determines it listens to `OrderShipped`.
- **`__invoke()` support:** Listeners with `__invoke(OrderShipped $event)` work the same as `handle()`.
- **Caching:** `php artisan event:cache` compiles the event-listener mapping into a cached file, bypassing filesystem scanning.
- **Performance tradeoff:** Without caching, the scanner runs on every request — negligible for small apps but measurable for large ones.

---

# When To Use

- Convention-based Laravel projects following the standard `app/Listeners` structure
- Projects with fewer than ~100 listener classes where discovery overhead is negligible
- Development environments where adding new listeners should work without registration
- Applications where explicit event registration is not required for security or auditability

---

# When NOT To Use

- Listeners located outside `app/Listeners` — they are not discovered unless `withEvents()` is configured
- Package development — package listeners should be registered via service providers, not auto-discovery
- Listeners with ambiguous type-hints or no type-hinted parameters — they are silently skipped
- When explicit control over which listeners are active is required — use `ShouldBeDiscovered` (Laravel 13.12+) or manual registration

---

# Best Practices

- **Run `event:cache` in production.** Without caching, the filesystem is scanned on every request, adding 5-15ms to boot time. *Why: Filesystem I/O is the bottleneck in discovery — caching eliminates it entirely for a consistent <1ms boot.*
- **Add `event:cache` to the deployment script.** Without regenerating the cache, new listeners won't fire. *Why: The cache file is deployed with the old mapping — new listeners are invisible until the cache is rebuilt.*
- **Use OPcache in production.** OPcache accelerates reflection results from discovery. Without it, each request re-discovers. *Why: Reflection results are not cached by PHP by default — OPcache provides byte-level caching that speeds up repeated reflection calls.*
- **Keep listeners focused — one event per listener.** A listener can have only one auto-discovered event. Multiple `handle()` methods cause unpredictable binding. *Why: The scanner maps the first discovered `handle()` or `__invoke()` method — additional methods are ignored.*

---

# Architecture Guidelines

- Discovery runs in `EventServiceProvider::boot()` via `parent::boot()`.
- The scanned directory defaults to `app/Listeners`. Customize via `withEvents()` in `EventServiceProvider`.
- Discovered mappings are merged with manually registered listeners from `$listen` array.
- Cached mode (`event:cache`) reads `bootstrap/cache/events.php` — a pre-computed array.
- The cache file should be ignored by version control but included in deployment artifacts.
- Opcode cache accelerates reflection, but filesystem scanning still occurs without `event:cache`.

---

# Performance Considerations

- Filesystem scanning reads all files in `app/Listeners`. For 100 listener files, ~10-20ms per request without cache.
- Reflection analysis is accelerated by OPcache on subsequent requests.
- Cached mode reads one PHP file — <1ms.
- In production with OPcache, non-cached discovery adds ~5-15ms to boot time.
- The performance impact is per-request, not per-worker. Queue workers also pay this cost on boot.

---

# Security Considerations

- Auto-discovery registers all found listeners without explicit approval. In multi-tenant or package contexts, a listener added by one tenant/package may be unintentionally registered.
- The cache file (`bootstrap/cache/events.php`) should not be writable by the web server in production — restrict permissions after cache generation.
- Listener classes must be valid PHP — a syntax error in any listener file breaks the entire discovery process, disabling ALL event handling.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not running `event:cache` in production | Assuming auto-discovery is fast enough | 5-15ms boot time overhead per request | Add `event:cache` to deployment script |
| Adding listeners outside `app/Listeners` | Placing listeners in custom directories | Listeners are never discovered | Use `withEvents()` or manual registration |
| Multiple `handle()` methods | Having `handle()` and `__invoke()` together or multiple `handle()` overloads | Only the first discovered method binds — other events not handled | One `handle()` or `__invoke()` per listener |
| Not regenerating cache after changes | Forgetting to re-cache after adding listeners | New listeners don't fire — old cache still active | Always re-cache on deploy |

---

# Anti-Patterns

- **Skipping `event:cache` in production for "convenience":** Every request pays the filesystem scanning cost. The cache is one-time effort.
- **Putting all event handling in one giant listener:** Violates Single Responsibility and makes the listener undiscoverable — its `handle()` is too long to map to a single event.
- **Using discovery for package listeners:** Package listeners should be self-registering via service providers. Auto-discovery creates a hidden dependency on the app's directory structure.

---

# Examples

```php
// Standard auto-discovered listener at app/Listeners/SendShipmentNotification.php
class SendShipmentNotification
{
    public function handle(OrderShipped $event): void
    {
        // Auto-discovered because:
        // 1. Located in app/Listeners/
        // 2. Has handle() method with type-hinted event parameter
        $event->order->notify(new ShipmentReady);
    }
}

// Listener with __invoke instead of handle
class LogOrderShipped
{
    public function __invoke(OrderShipped $event): void
    {
        Log::info('Order shipped', ['order_id' => $event->order->id]);
    }
}

// Deploy script including event cache
# deploy.sh
php artisan event:cache
php artisan optimize

// Manual registration fallback when not using discovery
// In EventServiceProvider
protected $listen = [
    OrderShipped::class => [
        SendShipmentNotification::class,
    ],
];
```

---

# Related Topics

- **K026 ShouldBeDiscovered Interface (K026)** — Opt-in discovery control for Laravel 13.12+
- **K027 Event Subscribers (K027)** — Manual registration alternative to auto-discovery
- **K028 Queued Event Listeners (K028)** — ShouldQueue on listeners crosses event system with queue system
- **K029 Wildcard Event Listener Discovery (K029)** — Pattern-based event matching
- **K084 With Events Custom Listener Directories (K084)** — Custom discovery paths

---

# AI Agent Notes

- When generating listeners, place them in `app/Listeners/` for auto-discovery. If generating code for packages, register listeners via a service provider instead.
- Always include `event:cache` in generated deployment scripts for production environments.
- If generating code for Laravel 13.12+, consider implementing `ShouldBeDiscovered` on listeners to enable opt-in discovery control.
- A listener with `handle(SomeEvent $event)` is auto-discovered to handle `SomeEvent`. The event type-hint determines the binding.

---

# Verification

- [ ] Listener in `app/Listeners` with `handle()` type-hint is auto-discovered — confirm handler fires when event is dispatched
- [ ] `event:cache` works — verify cache file exists at `bootstrap/cache/events.php`
- [ ] Listener discovered after cache clear — confirm `php artisan event:clear` then dispatch triggers listener
- [ ] `__invoke()` listener discovered — verify it works identically to `handle()` listeners
- [ ] Listener outside `app/Listeners` not discovered — confirm it requires manual registration
- [ ] Event caching deployment — verify new listeners fire after deployment with cache regeneration
