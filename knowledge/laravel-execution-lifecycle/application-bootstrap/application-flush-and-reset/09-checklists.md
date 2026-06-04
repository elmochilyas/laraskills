# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Application Flush And Reset
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `flush()` clears all user-bound bindings and instances
- [ ] `flush()` preserves `'app'`, `Container::class`, and PSR-11 bindings
- [ ] `flush()` clears all aliases (`$app->make('auth')` throws after flush)
- [ ] `$app->reset()` is called (not `$app->flush()`) between request boundaries
- [ ] After reset, `$app->make('app')` still works (base bindings preserved)
- [ ] After reset, `$app->make('auth')` throws `BindingResolutionException` (aliases cleared, need bootstrappers)
- [ ] Always use reset() not flush() for request-boundary cleanup in long-running processes. followed
- [ ] Never call flush() or reset() during a request lifecycle. followed
- [ ] Test every custom binding for flush survival when writing Octane-compatible code. followed
- [ ] Never rely on flush() to clear static properties on service providers or user classes. followed
- [ ] Use scoped() instead of singleton() for bindings that must be fresh per request. followed
- [ ] Use `reset()` not `flush()` for request boundaries applied
- [ ] Audit bindings for flush survival applied
- [ ] Log `memory_get_usage()` before and after `flush()` applied
- [ ] Never call `flush()` or `reset()` in middleware applied
- [ ] Mid-Request Reset prevented
- [ ] Flush Without Rebind prevented
- [ ] Calling flush() without re-registering aliases prevented
- [ ] Expecting reset() to re-load config files prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use reset() not flush() for request-boundary cleanup in long-running processes. followed
- [ ] Never call flush() or reset() during a request lifecycle. followed
- [ ] Test every custom binding for flush survival when writing Octane-compatible code. followed
- [ ] Never rely on flush() to clear static properties on service providers or user classes. followed
- [ ] Use scoped() instead of singleton() for bindings that must be fresh per request. followed
- [ ] Use `reset()` not `flush()` for request boundaries applied
- [ ] Audit bindings for flush survival applied
- [ ] Log `memory_get_usage()` before and after `flush()` applied
- [ ] Never call `flush()` or `reset()` in middleware applied
- [ ] Calling flush() without re-registering aliases prevented
- [ ] Expecting reset() to re-load config files prevented
- [ ] Assuming static properties are cleared by flush prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Mid-Request Reset prevented
- [ ] Flush Without Rebind prevented
- [ ] Static Property Accumulation prevented
- [ ] Binding State Capture in Callbacks prevented
- [ ] Shared Mutable State â€” static properties persist across flush() and leak between requests in Octane. prevented
- [ ] Always use reset() not flush() for request-boundary cleanup in long-running processes. followed
- [ ] Never call flush() or reset() during a request lifecycle. followed
- [ ] Test every custom binding for flush survival when writing Octane-compatible code. followed
- [ ] Never rely on flush() to clear static properties on service providers or user classes. followed
- [ ] Use scoped() instead of singleton() for bindings that must be fresh per request. followed

---

# Testing Checklist

- [ ] `$app->reset()` is called (not `$app->flush()`) between request boundaries
- [ ] After reset, `$app->make('app')` still works (base bindings preserved)
- [ ] After reset, `$app->make('auth')` throws `BindingResolutionException` (aliases cleared, need bootstrappers)
- [ ] After reset, `$app->bound('config')` returns `false`
- [ ] `flush()` clears all user-bound bindings and instances
- [ ] `flush()` preserves `'app'`, `Container::class`, and PSR-11 bindings
- [ ] `flush()` clears all aliases (`$app->make('auth')` throws after flush)
- [ ] `reset()` restores all core aliases and base bindings
- [ ] Container state is cleanly reset between requests with no binding leaks
- [ ] Facade resolution works correctly on the next request (aliases re-registered)
- [ ] hasBeenBootstrapped guard is cleared, allowing re-bootstrap
- [ ] No request A's data is accessible in request B

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Mid-Request Reset prevented
- [ ] Flush Without Rebind prevented
- [ ] Static Property Accumulation prevented
- [ ] Binding State Capture in Callbacks prevented
- [ ] Shared Mutable State â€” static properties persist across flush() and leak between requests in Octane. prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- [Application Class Construction](./application-class-construction/02-knowledge-unit.md)
- [Base Bindings and Core Aliases](./base-bindings-and-core-aliases/02-knowledge-unit.md)
- [Bootstrapper Sequence](./bootstrapper-sequence/02-knowledge-unit.md)
- [Service Container Instance Management] â€” how `instance()`, `scoped()`, and `singleton()` interact with flush.
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md)

---


