# Singleton State Leaks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Singleton state leakage is the most common and dangerous bug when migrating Laravel to Octane. In traditional PHP-FPM, every request gets a fresh PHP process — all state is destroyed at the end of the request. Under Octane, singletons live in the master container and are **shared across all requests** in the same worker. If a singleton stores per-request data, that data leaks into subsequent requests, producing data corruption, authentication confusion, and silent bugs that are extremely difficult to reproduce in development.

## Core Concepts
- **Singleton Lifetime:** `singleton()` binds a class to the container such that the same instance is returned for every `resolve()` call. In PHP-FPM this effectively means "one per request." Under Octane it means "one per worker lifetime."
- **State Contamination:** A singleton that mutates its internal state during request handling retains that state for the next request. Example: `AuthManager` caches the resolved guard; if the guard stores the authenticated user, User A's identity leaks to User B's request.
- **Transient vs Singleton Awareness:** Only bindings registered as `singleton()` or with the `shared: true` flag in the container are affected. `bind()` (non-shared) produces a new instance on each resolve and is safe.
- **Nested State Holding:** A singleton can indirectly leak state through its dependencies. If a singleton guard references an Eloquent user model (which is mutable), the model reference persists.

## Mental Models
- **"The Public Notebook":** Singletons are a shared notebook on a desk. Every request writes in it. If Request A writes "User: Alice" and Request B reads before A's erase, B sees Alice's data.
- **"The Leaky Bucket":** Each request pours water (state) into a bucket. The bucket is never emptied between requests. Eventually it overflows (memory) or mixes contents (data corruption).
- **"The Global Variable":** Treat every singleton under Octane as if it were a global variable. If you wouldn't use a global for it in PHP-FPM, it shouldn't hold mutable state as a singleton under Octane.

## Internal Mechanics
1. **Registration:** `$this->app->singleton(AuthManager::class)` registers the binding with `shared = true` in the container's `$instances` array.
2. **First Resolution:** On first request, `$app->make(AuthManager::class)` creates the instance and stores it in `$instances`.
3. **Subsequent Resolutions:** `$app->make(AuthManager::class)` returns the exact same PHP object from `$instances`. No new instance is created.
4. **Mutation During Request:** The controller calls `Auth::login($user)`. The guard's `$user` property is set to the authenticated user.
5. **Leak on Next Request:** The second request enters. `AuthManager` is already resolved. `Auth::user()` returns the previous request's user. The leak is realized.
6. **Compounding:** Over hundreds of requests, a singleton with an accumulating array (e.g., event listeners, query logs) grows unbounded until OOM.

## Patterns
- **Stateless Singleton:** Bind services that hold no per-request state as singletons. HTTP clients, config readers, repository abstractions with no mutable caches.
- **State-Reset Wrapper:** Wrap a mutable singleton with a proxy that calls `reset()` at the start of each request. Register the proxy as scoped, the real service as singleton.
- **Per-Method Freshness:** Make the critical method resolve fresh data internally instead of caching. `Auth::user()` should call `$this->userProvider->retrieveById($id)` each time rather than returning a cached property.
- **Scoped Re-Registration:** Tag providers that register mutable singletons with `OctaneSandbox` so they re-register in the sandbox, effectively getting per-request instances.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| Container does not auto-reset singletons | Performance — cloning/resetting every singleton on every request defeats Octane's purpose |
| `shared = true` is the source of truth | Consistent with Laravel's container semantics; Octane doesn't introduce new binding types |
| Scoped bindings as the solution | Provides opt-in per-request freshness without breaking existing singleton semantics |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Fast singleton resolution (O(1) lookup) | Silent state corruption if not audited | Production bugs that cannot be reproduced locally |
| No code changes for pure stateless singletons | Requires developer discipline to annotate stateful ones | Teams must adopt binding audit as part of deployment pipeline |
| `scoped()` provides escape hatch | Scoped bindings have slightly higher overhead per request (re-creation) | ~1ms per scoped binding per request |

## Performance Considerations
- Singleton resolution is a hash lookup (~0.001ms). Mutating a singleton's internal state adds zero measurable overhead — the cost is correctness, not speed.
- Scoped bindings add ~0.5-2ms per binding per request (instantiation + sandbox registration).
- The performance of incorrect code is irrelevant — a leaking singleton produces wrong results instantly regardless of speed.

## Production Considerations
- All first-party Laravel services are Octane-safe as of Laravel 10+. The primary risk is application code and third-party packages.
- Deploy a **binding audit** as a CI step. Scan all service provider registrations for `singleton()` calls and flag them for review.
- Add a **state-leak test** that sends two requests with different auth users and asserts response user IDs differ.
- Use Octane's `$sandbox->flush()` events to reset known-stateful services between requests. Register listeners for `RequestTerminated`.
- Monitor for "session fixation" or "wrong user" reports — these are often singleton state leaks.

## Common Mistakes
- Assuming that because a service works in PHP-FPM, it works under Octane. PHP-FPM destroys everything between requests; Octane preserves.
- Using `Auth::onceUsingId()` (which mutates the guard state) in queue jobs or Octane requests. The mutated guard leaks to the next request.
- Storing authenticated user on the application instance: `app()->instance('current_user', $user)`. This overwrites the shared instance.
- Caching Eloquent model query results in a singleton repository property. The cache accumulates across requests.
- Using `$this->app->instance()` in service providers without awareness it's a singleton. `instance()` always creates a shared binding.

## Failure Modes
- **Cross-User Data Leak:** User A views their profile. User B (next request on same worker) sees User A's profile. Root cause: singleton repository caching the last-fetched model.
- **Auth Spoofing:** User A is authenticated. A guest request on the same worker returns `Auth::check() === true`. Root cause: singleton guard retaining authenticated user.
- **Config Drift:** One request sets `config('app.locale', 'fr')` via `Config::set()`. All subsequent requests on that worker execute in French. Root cause: Config repository is a singleton and `set()` mutates it globally.
- **Stale Cache:** A singleton HTTP client caches DNS resolutions or auth tokens. After token expiry, all requests fail until the worker recycles. Root cause: singleton client holding expired state.

## Ecosystem Usage
- Laravel Debugbar stores request data in a singleton. Under Octane, Debugbar must be wrapped or disabled. Debugbar v3.8+ has Octane awareness.
- Spatie Laravel Permission uses a singleton `PermissionRegistrar`. Under Octane, register it as scoped or call `$registrar->forgetCachedPermissions()` in `RequestTerminated`.
- Laravel Telescope stores watched data in singletons. Telescope's watchers are automatically flushed per request in Octane since v4.x.
- Passport's token repository is a singleton. Ensure token-to-user resolution is stateless or scoped.

## Related Knowledge Units
### Prerequisites
- octane-architecture-overview (sandbox mechanism that allows scoped bindings)

### Related Topics
- scoped-bindings-for-octane (the primary fix for singleton leaks)
- static-property-accumulation (a related but distinct leak pattern)
- service-binding-audit (systematic audit to catch singleton leaks)

### Advanced Follow-up Topics
- octane-package-compatibility (evaluating third-party packages for leaks)
- memory-profiling-and-observability (detecting singleton leaks via profiling)
- octane-lifecycle-hooks (RequestTerminated for singleton state reset)

## Research Notes
- The Laravel core team made `AuthManager` and `SessionManager` Octane-safe in Laravel 10 by using `scoped()` internally for guards.
- Octane v2.x added `Sandbox::flushServices()` which is called after each request. It clears scoped bindings but does NOT reset singletons.
- Research question: Could the container implement a "dirty tracking" mechanism to detect singleton mutation between requests and auto-reset detected mutations? Current answer: too expensive for the hot path.
- The `$container->rebound()` method fires when a binding is re-resolved. This can be used to notify services when singletons are re-created, but does not help with mutation leakage.
