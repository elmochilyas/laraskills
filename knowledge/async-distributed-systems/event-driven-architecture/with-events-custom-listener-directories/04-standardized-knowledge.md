# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Event-Driven Architecture
- **Knowledge Unit:** K084 — withEvents for Custom Listener Directories
- **Knowledge ID:** K084
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Events: Event Discovery
  - Laravel Source — `Illuminate\Events\EventServiceProvider`
  - Laravel 11+ release notes

---

# Overview

Laravel's auto-discovery scans `app/Listeners` by default. The `withEvents()` method on `EventServiceProvider` allows customization of the listener discovery path and the event directory path. This is essential for package development (where listeners live in the package's `src/Listeners` directory) and for applications that organize listeners outside the default `app/Listeners` convention. `withEvents()` accepts an array of paths for listeners, enabling discovery from multiple directories.

---

# Core Concepts

- **`withEvents()`:** A method on `EventServiceProvider` that accepts custom events and/or listeners paths.
- **Default paths:** `app/Events` for events, `app/Listeners` for listeners.
- **Customization:** Pass an array with `listeners` and optional `events` keys to `withEvents()`.
- **Multiple directories:** Call `withEvents()` with an array of paths to discover from multiple locations.
- **Package usage:** Packages call `withEvents()` in their service providers to discover their own listeners.

---

# When To Use

- Domain-driven directory structures — `app/Domain/Order/Listeners` colocated with domain logic
- Package development — auto-discover package listeners from `src/Listeners`
- Modular monolith — separate listener directories per module
- Multi-tenant applications — different listener sets for different contexts

---

# When NOT To Use

- Standard Laravel projects where `app/Listeners` is sufficient
- Small-to-medium projects where all listeners naturally fit in one directory
- When maintaining conventional Laravel structure for team familiarity

---

# Best Practices

- **Pass an array to `withEvents()`, not a string.** `withEvents(listeners: ['app/Domain/Order/Listeners'])` is correct — a single string may be misinterpreted. *Why: `withEvents()` expects an array parameter for the `listeners` key — passing a string bypasses the intended API.*
- **Run `event:cache` after changing `withEvents()` paths.** Without cache regeneration, new paths are not reflected in the cached event mapping. *Why: The cache file is pre-computed — it only includes paths that were registered at cache time.*
- **Ensure custom paths exist.** If a path does not exist, the scanner silently skips it — no error, no listeners, no handler execution. *Why: The discovery service does not validate that paths exist — a typo or missing directory causes silent listener deactivation.*
- **Document custom paths in the project README.** Standard Laravel conventions are broken — new developers need to know where listeners live. *Why: Custom paths are invisible to developers expecting the `app/Listeners` convention.*

---

# Architecture Guidelines

- Each path is scanned using the same `EventDiscoveryService` mechanism as the default path.
- Discovered listeners from all paths are merged into the same event-listener mapping.
- Discovery respects `ShouldBeDiscovered` (Laravel 13.12+) in all custom paths.
- `event:cache` includes listeners from all custom paths.
- The scanner looks for listener files one level deep in the specified path, not recursively.

---

# Performance Considerations

- Each custom path adds filesystem scanning time during discovery (unless cached).
- For packages, each package's `withEvents()` call adds boot-time scanning.
- Cached mode (`event:cache`) includes all custom paths — no runtime cost for uncached discovery.
- Very large custom directories with hundreds of listener files increase boot time if uncached.

---

# Security Considerations

- Custom paths from packages are scanned at boot — a malicious package with a `withEvents()` call can register listeners that observe application events.
- The scanner does not validate that files in custom paths are legitimate listener classes — any file with a `handle()` method is registered.
- Restrict write access to custom listener directories to prevent unauthorized listener injection.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Passing string instead of array | `withEvents('app/Domain/Listeners')` | May be misinterpreted or cause error | Use `withEvents(listeners: ['app/Domain/Listeners'])` |
| Path doesn't exist | Typo or missing directory | Scanner silently skips — listeners not registered | Verify directory exists before configuring |
| No `event:cache` after path change | Adding custom path without re-caching | Listeners in new path not registered | Always re-cache after path changes |
| Expecting recursive subdirectory scanning | Assuming scanner recurses into subdirs | Listeners in subdirectories not discovered | Place listener files directly in the specified path |

---

# Anti-Patterns

- **Registering `withEvents()` in every package without consideration:** Each package path adds boot scanning time. Package developers should consider whether auto-discovery is necessary or if manual registration is more appropriate.
- **Overlapping listener paths:** Two `withEvents()` calls pointing to the same directory — duplicate scanning with no benefit.
- **Using `withEvents()` to override default path:** Custom paths add to, not replace, the default `app/Listeners` path. To disable default discovery, use `$discoverEvents = []`.

---

# Examples

```php
// In App\Providers\EventServiceProvider

// Domain-driven listener organization
public function boot(): void
{
    parent::boot();

    $this->withEvents(
        listeners: [
            'app/Domain/Order/Listeners',
            'app/Domain/Payment/Listeners',
            'app/Domain/User/Listeners',
        ],
    );
}

// Package service provider — discover package listeners
class EventSourcingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->withEvents(
            listeners: [
                __DIR__ . '/Listeners',
            ],
        );
    }
}

// Disable default discovery entirely
class EventServiceProvider extends ServiceProvider
{
    protected $discoverEvents = []; // empty array = no auto-discovery
    // Use only withEvents paths
}
```

---

# Related Topics

- **K025 Event Auto-Discovery (K025)** — Core discovery mechanism that `withEvents()` extends
- **K026 ShouldBeDiscovered Interface (K026)** — Opt-in discovery control works with custom paths

---

# AI Agent Notes

- When generating code that uses `withEvents()`, always pass an array for the `listeners` key.
- For package development, `withEvents()` should be called in the package's service provider `boot()` method.
- Custom paths are additive — they do not replace the default `app/Listeners` directory. If the default should be disabled, set `protected $discoverEvents = []`.
- The scanner is not recursive — listeners must be directly in the specified path, not in subdirectories.

---

# Verification

- [ ] Custom path listeners are discovered — verify handler fires for events
- [ ] Non-existent path is silently skipped — confirm no error thrown, but also no listeners discovered
- [ ] `event:cache` includes custom paths — verify cached mapping includes listeners from custom paths
- [ ] ShouldBeDiscovered respected in custom paths — verify opt-in discovery works in non-default paths
- [ ] Default `app/Listeners` still works alongside custom paths — both directories are scanned
