# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Static Property Accumulation
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Scan codebase for static properties using `grep -r 'static.*\$' app/`
- [ ] Identify static arrays that grow: `static::$cache[]`, `static::$macros[]`, etc.
- [ ] Register `RequestTerminated` listeners for known leaky classes
- [ ] Static property scan covers both `app/` and `vendor/` directories
- [ ] Growing patterns identified: `static::$cache[]`, `static::$macros[]`, `static::$callbacks[]`, memoization caches
- [ ] Fix applied: instance-based caching via scoped binding OR `RequestTerminated` cleanup for vendor code
- [ ] Replace static property caching with instance-based caching. followed
- [ ] Register RequestTerminated cleanup for known leaky static registries. followed
- [ ] Use Octane::once() for one-time registration guards. followed
- [ ] Monitor memory_get_usage() baseline growth as static leak indicator. followed
- [ ] Never use static arrays as request-scoped caches. followed
- [ ] Scan for static property accumulation in third-party packages too. followed
- [ ] Replace `static::$cache` with instance-based caching applied
- [ ] Register a `RequestTerminated` listener for known leaky classes applied
- [ ] Use `Octane::once()` for one-time registrations applied
- [ ] Monitor `memory_get_usage()` deltas applied
- [ ] Static Property as Request Cache prevented
- [ ] Ignoring Third-Party Statics prevented
- [ ] Confusing static leaks with singleton leaks prevented
- [ ] Using isset(static::$cache) as memoization guard prevented

---

# Architecture Checklist

- [ ] PHP does not provide static property GC architecture followed
- [ ] Laravel uses static properties extensively architecture followed
- [ ] Octane does not intercept static mutation architecture followed
- [ ] Accumulation is per-process architecture followed

---

# Implementation Checklist

- [ ] Replace static property caching with instance-based caching. followed
- [ ] Register RequestTerminated cleanup for known leaky static registries. followed
- [ ] Use Octane::once() for one-time registration guards. followed
- [ ] Monitor memory_get_usage() baseline growth as static leak indicator. followed
- [ ] Never use static arrays as request-scoped caches. followed
- [ ] Replace `static::$cache` with instance-based caching applied
- [ ] Register a `RequestTerminated` listener for known leaky classes applied
- [ ] Use `Octane::once()` for one-time registrations applied
- [ ] Monitor `memory_get_usage()` deltas applied
- [ ] Confusing static leaks with singleton leaks prevented
- [ ] Using isset(static::$cache) as memoization guard prevented
- [ ] Registering Blade directives in controller prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Static Property as Request Cache prevented
- [ ] Ignoring Third-Party Statics prevented
- [ ] No Cleanup in RequestTerminated prevented
- [ ] Over-Relying on max_requests prevented
- [ ] Confusing Static Leaks with Singleton Leaks prevented
- [ ] Replace static property caching with instance-based caching. followed
- [ ] Register RequestTerminated cleanup for known leaky static registries. followed
- [ ] Use Octane::once() for one-time registration guards. followed
- [ ] Monitor memory_get_usage() baseline growth as static leak indicator. followed
- [ ] Never use static arrays as request-scoped caches. followed
- [ ] Scan for static property accumulation in third-party packages too. followed

---

# Testing Checklist

- [ ] Static property scan covers both `app/` and `vendor/` directories
- [ ] Growing patterns identified: `static::$cache[]`, `static::$macros[]`, `static::$callbacks[]`, memoization caches
- [ ] Fix applied: instance-based caching via scoped binding OR `RequestTerminated` cleanup for vendor code
- [ ] All `Blade::directive()`, `Collection::macro()`, `Str::macro()` calls guarded by `Octane::once()` or manual flag
- [ ] Scan codebase for static properties using `grep -r 'static.*\$' app/`
- [ ] Identify static arrays that grow: `static::$cache[]`, `static::$macros[]`, etc.
- [ ] Register `RequestTerminated` listeners for known leaky classes
- [ ] Run two identical requests and compare `memory_get_usage()` before each â€” baseline should not grow
- [ ] All growing static arrays identified and fixed â€” no class-level accumulation across requests
- [ ] Instance-based caching via scoped bindings replaces static caches for per-request data
- [ ] RequestTerminated cleanup registered for every vendor-class static registry with no reset method available
- [ ] All one-time registrations (Blade::directive, Collection::macro, etc.) guarded against duplicate registration

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Static Property as Request Cache prevented
- [ ] Ignoring Third-Party Statics prevented
- [ ] No Cleanup in RequestTerminated prevented
- [ ] Over-Relying on max_requests prevented
- [ ] Confusing Static Leaks with Singleton Leaks prevented

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

- singleton-state-leaks (contrast: singleton leaks are container-bound; static leaks are class-bound)
- octane-architecture-overview (worker lifecycle context)
- memory-profiling-and-observability (tools to detect accumulation)
- octane-package-compatibility (evaluating packages for static leaks)

---


