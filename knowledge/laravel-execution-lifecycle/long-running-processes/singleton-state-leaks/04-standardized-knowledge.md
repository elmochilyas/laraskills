# Singleton State Leaks

## Metadata
- **ID:** ku-03-octane-application-state
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Singleton state leakage is the most common and dangerous bug when migrating Laravel to Octane. In traditional PHP-FPM, every request gets a fresh PHP process — all state is destroyed at the end of the request. Under Octane, singletons live in the master container and are **shared across all requests** in the same worker. If a singleton stores per-request data, that data leaks into subsequent requests, producing data corruption, authentication confusion, and silent bugs that are extremely difficult to reproduce in development.

## Core Concepts
- **Singleton Lifetime**: `singleton()` returns the same instance for every `resolve()` call. In PHP-FPM this effectively means "one per request." Under Octane it means "one per worker lifetime."
- **State Contamination**: A singleton that mutates internal state during request handling retains that state for the next request. Example: `AuthManager` caches the resolved guard; if the guard stores the authenticated user, User A's identity leaks to User B's request.
- **Transient vs Singleton Awareness**: Only bindings registered as `singleton()` or with `shared: true` are affected. `bind()` (non-shared) produces a new instance on each resolve and is safe.
- **Nested State Holding**: A singleton can indirectly leak state through its dependencies. If a singleton guard references an Eloquent user model (which is mutable), the model reference persists.

## When To Use
- **Pre-Octane audit**: Before deploying Octane, identify all singletons that hold mutable state.
- **Debugging cross-request data leaks**: When User A sees User B's data, suspect singleton leaks.
- **Reviewing third-party packages**: Evaluate packages for singleton mutations before deployment.
- **CI pipeline integration**: Add singleton audit as a CI step to prevent regressions.

## When NOT To Use
- **Stateless singletons**: Config readers, HTTP clients, logger instances — safe as singletons, don't need auditing.
- **Transient bindings**: `bind()` creates new instances — inherently safe. Don't waste audit effort.
- **PHP-FPM only apps**: Without Octane, singleton state is destroyed per-request. Leaks don't exist.

## Best Practices (WHY)
- **Audit every singleton for mutable state**: Check if the service stores any per-request data (user, locale, tenant, request metadata). *Why: Silent leaks are the #1 Octane bug — they produce wrong results without errors.*
- **Convert request-aware singletons to `scoped()`**: Auth guards, session managers, current-team resolvers — register as `scoped()` for per-request freshness. *Why: Scoped bindings provide automatic per-request instance creation without code changes to the service itself.*
- **Test with two sequential requests**: Send request A as User Alice, request B as User Bob — verify B doesn't see Alice's data. *Why: This is the minimal reproducible test for singleton leaks.*
- **Use `$app->scoped()` instead of manual `forgetInstance()`**: Manual instance flushing is error-prone and container-specific. *Why: `forgetInstance()` can leave dangling references; `scoped()` is designed for automatic lifecycle management.*

## Architecture Guidelines
- **Container does not auto-reset singletons**: Performance — cloning/resetting every singleton per request defeats Octane's purpose.
- **`shared = true` is the source of truth**: Octane doesn't introduce new binding types. The existing `shared` flag determines persistence.
- **Scoped bindings as the solution**: Provides opt-in per-request freshness without breaking existing singleton semantics.
- **Stateless Singleton pattern**: Bind services that hold no per-request state as singletons. HTTP clients, config readers, repositories with no mutable caches.

## Performance
- **Singleton resolution**: O(1) hash lookup (~0.001ms). Mutating a singleton's internal state adds zero measurable overhead — the cost is correctness, not speed.
- **Scoped bindings**: Add ~0.5-2ms per binding per request (instantiation + sandbox registration).
- **Performance of incorrect code is irrelevant**: A leaking singleton produces wrong results instantly regardless of speed.

## Security
- **Cross-User Data Leak**: User A's profile data appears in User B's response. Critical breach of data isolation.
- **Auth Spoofing**: Guest requests appearing authenticated because of a cached guard from a previous request.
- **Config Drift**: One request sets `config('app.locale', 'fr')` globally — all subsequent requests execute in French.
- **Stale Cache**: Singleton HTTP client caches auth tokens; after token expiry, all requests fail until worker recycle.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming FPM safety = Octane safety | PHP-FPM destroys everything between requests | Cross-request data leaks in Octane | Always audit bindings for Octane |
| Using `Auth::onceUsingId()` in Octane | Mutates guard state | Guard state leaks to next request | Use stateless auth for one-off checks |
| Storing user on app instance | `app()->instance('current_user', $user)` | Overwrites shared instance for all requests | Use scoped binding for current user |
| Caching query results in singleton property | Eloquent cache in repository property | Cache accumulates across requests | Use scoped or explicit cache invalidation |

## Anti-Patterns
- **Singleton as catch-all cache**: Using singleton properties to cache computed results that are request-specific. Use request-scoped caches instead.
- **Manual `forgetInstance()` calls**: Manually clearing singleton instances to simulate scoped behavior. Corrupts container's instance tracking.
- **Cloning singletons manually**: Deep-copying singleton instances per request instead of using `scoped()`. Expensive and error-prone.
- **Ignoring the problem**: Deploying Octane without any audit because "it works in development." Development servers rarely reproduce production request patterns.

## Examples

```php
// LEAKY: Singleton with mutable state
$this->app->singleton(CurrentTeam::class);
// Each request sets the team; next request sees the previous team's data

// FIXED: Scoped binding for per-request state
$this->app->scoped(CurrentTeam::class);
// Each request gets a fresh CurrentTeam instance

// SAFE SINGLETON: Immutable config reader
$this->app->singleton(PaymentGatewayConfig::class);
// No mutable state — safe to share across all requests

// STATELESS DESIGN: Per-method freshness instead of cached property
class AuthManager
{
    public function user()
    {
        // Don't cache user in a property
        return $this->resolveUserFromSession();
    }
}
```

## Related Topics
- **Octane Architecture Overview**: Sandbox mechanism that allows scoped bindings.
- **Scoped Bindings for Octane**: The primary fix for singleton leaks.
- **Static Property Accumulation**: A related but distinct leak pattern.
- **Service Binding Audit**: Systematic audit to catch singleton leaks.
- **Octane Package Compatibility**: Evaluating third-party packages for leaks.

## AI Agent Notes
- The Laravel core team made `AuthManager` and `SessionManager` Octane-safe in Laravel 10 by using `scoped()` internally for guards.
- Octane v2.x added `Sandbox::flushServices()` which is called after each request. It clears scoped bindings but does NOT reset singletons.
- Research question: Could the container implement "dirty tracking" to detect singleton mutation between requests? Current answer: too expensive for the hot path.
- The `$container->rebound()` method fires when a binding is re-resolved. Can notify services when singletons are re-created, but doesn't help with mutation leakage.

## Verification
- [ ] Identify all `singleton()` calls across application and third-party providers
- [ ] For each singleton, determine if it holds mutable per-request state
- [ ] Convert request-aware singletons to `scoped()` or stateless design
- [ ] Write a test: send two requests with different auth users, assert data isolation
- [ ] Run under Octane with `max_requests=100` and monitor for wrong-user reports
- [ ] Add CI step that flags new `singleton()` registrations for human review
