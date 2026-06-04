# Singleton pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Creational Patterns
- **Knowledge Unit:** Singleton
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Dependency Injection and Service Container basics
- [ ] Know the difference between `singleton()` and `scoped()` in Laravel
- [ ] Understand the harm of global state in testing

## Implementation Checklist
- [ ] Prefer Laravel container `singleton()` over classic GoF Singleton (static instance)
- [ ] Stateless services bound as singletons in container
- [ ] Configuration and logging services use single-instance semantics
- [ ] `scoped()` used for per-request state in Octane (not `singleton()`)
- [ ] Domain objects with mutable state never bound as singletons
- [ ] Service classes injected via constructor, not resolved via static accessor

## Verification Checklist
- [ ] Classic GoF Singleton (private constructor, static instance) not used in service classes
- [ ] No `singleton()` for request-scoped state (Octane cross-request contamination)
- [ ] Services not resolved inside `register()` (accessing container before all providers)
- [ ] Concrete classes bound to interfaces (auto-resolution doesn't bypass binding)
- [ ] Singleton instances have immutable or stateless design

## Security Checklist
- [ ] Singleton doesn't accumulate user-specific data across requests
- [ ] Long-lived singleton instances don't cache authorization state
- [ ] Singleton with mutable state doesn't cause cross-request data leaks

## Performance Checklist
- [ ] First resolution with reflection: ~0.1-1ms overhead; cached after first build
- [ ] Singleton resolution: O(1) from `$instances` array after first resolution
- [ ] `bind()` (non-singleton): reflection + construction on every call; expensive for hot paths
- [ ] Octane: singleton persists across requests; use `scoped()` for per-request state
- [ ] Memory: singleton holds instance for container lifetime; can accumulate internal caches

## Production Readiness Checklist
- [ ] Container singleton policy documented
- [ ] Octane-configured applications use `scoped()` correctly
- [ ] Singleton instances monitored for memory growth
- [ ] Team understands singleton vs scoped vs transient lifespans

## Common Mistakes to Avoid
- [ ] Using `singleton()` for request-scoped state in Octane (cross-request data contamination)
- [ ] Classic GoF Singleton in service classes (impossible to mock in tests)
- [ ] Resolving services inside `register()` (accessing container before all providers registered)
- [ ] Binding concrete class to itself instead of interface (auto-resolution bypasses binding)
- [ ] Singleton with mutable internal state (unpredictable behavior in concurrent scenarios)
