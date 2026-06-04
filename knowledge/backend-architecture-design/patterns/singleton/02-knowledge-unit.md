# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Singleton pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Singleton ensures a class has exactly one instance and provides global access to it. In Laravel, the service container's singleton/scoped binding methods provide the same guarantee without the pattern's harmful side effects (hidden dependencies, global state, testability problems). The GoF Singleton is largely obsolete in Laravel — the container manages instance lifetime explicitly, making the pattern's self-managed static instance an anti-pattern. Understanding when single-instance semantics are appropriate (configuration, logging, stateless services) vs harmful (request-scoped state, mutable domain objects) is critical for correct Laravel architecture.

---

# Core Concepts

- Single-instance guarantee: only one instance exists per container lifetime
- Global access point: traditionally via static `getInstance()` method
- Private constructor prevents external instantiation
- Instance lifetime boundaries: request (default PHP), process (Octane/queue workers), application (long-running)

---

# Mental Models

- **Singleton as Registry**: A global point of access to a well-known object — but this makes dependencies invisible
- **Container-Managed Singleton**: Laravel's `singleton()` binding gives single-instance semantics without global state — the container owns the lifetime
- **Scoped Singleton**: `scoped()` binding provides single-instance within a request/job boundary, auto-flushed between lifecycles — the correct default for Octane

---

# Internal Mechanics

PHP stores the static instance property on the class. Each subclass gets its own static property copy if not overridden (late static binding with `self` vs `static` matters). The Laravel container manages singletons via `$instances` array — once resolved, subsequent `make()` calls return the cached instance. Container singletons are NOT true GoF Singletons — they delegate lifetime management to the container, preserving testability through `forgetInstance()` and `instance()` overrides.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Container singleton | Single instance per app lifecycle | Explicit dependency, testable via swap | Must be stateless for Octane safety |
| Classic GoF Singleton | Global access point | Simple, no container needed | Hidden dependencies, untestable |
| Scoped binding | Single instance per request/job | Octane-safe, auto-flushed | Slightly more complex binding |

---

# Architectural Decisions

- **Prefer**: `$this->app->singleton()` or `$this->app->scoped()` over GoF Singleton classes
- **Avoid**: Static `getInstance()` methods outside legacy code — they hide dependencies and break test isolation
- **Choose scoped()**: For any service with per-request state (auth, tenant, session) in Octane environments
- **Use readonly**: For immutable singletons (config, feature flags) to prevent accidental mutation

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single instance reduces memory | Shared mutable state across requests | Data leaks, ghost bugs in Octane |
| Global access is convenient | Hidden dependencies | Constructor signature lies about actual needs |
| Container manages lifetime | Must understand binding semantics | Wrong binding → stale state or excessive construction |
| Testable via container swap | Requires understanding container API | Teams unfamiliar with container misuse bindings |

---

# Performance Considerations

- First resolution with reflection: ~0.1-1ms overhead; cached after first build
- Singleton resolution: O(1) from `$instances` array after first resolution
- `bind()` (non-singleton): reflection + construction on every call; expensive for hot paths
- Octane: singleton persists across requests; use `scoped()` for per-request state
- Memory: singleton holds instance for container lifetime; can accumulate if it internally caches growing data structures

---

# Production Considerations

- Octane audit: all singletons must be stateless or flushed between requests
- Queue workers: same singleton persistence concern as Octane
- Test isolation: `app()->forgetInstance()` between tests if singleton caches state
- Monitoring: watch for growing in-memory caches in long-running processes
- Deferred service providers: register singletons only when needed to avoid unnecessary construction

---

# Common Mistakes

- Using `singleton()` for request-scoped state in Octane → cross-request data contamination
- Classic GoF Singleton in service classes → impossible to mock in tests without static method mocking
- Resolving services inside `register()` → accessing container before all providers registered
- Binding concrete class to itself instead of interface → auto-resolution bypasses binding
- Singleton with mutable internal state → unpredictable behavior in concurrent scenarios

---

# Failure Modes

- **Stale state leak**: singleton holds reference to request object in Octane → user A's data visible to user B
- **Growing in-memory cache**: singleton appends to internal array → OOM after thousands of requests
- **Circular dependency through singleton**: two singletons referencing each other → infinite loop or null state
- **Test pollution**: singleton retains state from previous test → false positive/false negative test results
- **Deferred provider miss**: singleton registered in deferred provider but class resolved before provider loads → instance built without binding

---

# Ecosystem Usage

- **Laravel Framework**: `Illuminate\Container\Container` uses `$instances` array for singleton tracking; `singleton()` and `scoped()` methods; `#[Singleton]` attribute in Laravel 12+
- **Laravel Octane**: warns against stateful singletons; provides `flush()` mechanism and `scoped()` as safe alternative
- **Horizon**: manages queue worker process lifecycle where singleton rules apply
- **Cashier/Pulse/etc**: typically use container singletons for stateless service clients (Stripe SDK, metrics collector)

---

# Related Knowledge Units

**Prerequisites**: Dependency Injection, Service Container basics | **Related**: Factory pattern (creates instances), Registry pattern (service container) | **Advanced**: Octane state management, Scoped bindings, Container lifecycle hooks

---

# Research Notes

2025-2026 ecosystem trend: Laravel community has shifted from "singleton as anti-pattern" to "container-managed singleton as correct instance lifetime control." The real danger is not single-instance semantics but self-managed (GoF) singleton with hidden static access. Key insight: `scoped()` is the correct default for most services; `singleton()` only for truly stateless/immutable services. Octane adoption has accelerated this transition.

---
