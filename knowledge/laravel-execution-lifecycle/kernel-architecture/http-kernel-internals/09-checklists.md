# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Http Kernel Internals
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read `Illuminate\Foundation\Http\Kernel::handle()` source
- [ ] Trace the full flow: handle() â†’ bootstrap() â†’ sendRequestThroughRouter() â†’ Pipeline â†’ dispatchToRouter()
- [ ] Verify understanding of middleware execution order: global â†’ group â†’ route, with priority reordering
- [ ] Identified the six bootstrappers in exact order
- [ ] Verified the middleware pipeline wraps request in global â†’ group â†’ route order
- [ ] Confirmed `$middlewarePriority` reordering across boundaries
- [ ] Keep global middleware minimal; prefer group or route middleware. followed
- [ ] Always return $next($request) from middleware handle methods. followed
- [ ] Keep terminate() methods lightweight; defer heavy work to queues. followed
- [ ] Do not override handle() on the HTTP Kernel â€” use middleware or bootstrappers. followed
- [ ] Verify middleware execution order with php artisan route:list -v. followed
- [ ] Use Contracts\Http\Kernel for type-hints instead of concrete kernel classes. followed
- [ ] Keep global middleware minimal applied
- [ ] Understand execution order applied
- [ ] Return `$next($request)` always applied
- [ ] Keep terminate() lightweight applied
- [ ] Global Middleware as Catch-All prevented
- [ ] Modifying $middlewarePriority Excessively prevented
- [ ] Forgetting terminable middleware registration prevented
- [ ] Assuming middleware runs in route order prevented

---

# Architecture Checklist

- [ ] Pipeline over nesting architecture followed
- [ ] Single-pass bootstrapping architecture followed
- [ ] Bootstrapper order is rigid architecture followed
- [ ] Guarded initialization architecture followed
- [ ] Middleware groups vs global architecture followed

---

# Implementation Checklist

- [ ] Keep global middleware minimal; prefer group or route middleware. followed
- [ ] Always return $next($request) from middleware handle methods. followed
- [ ] Keep terminate() methods lightweight; defer heavy work to queues. followed
- [ ] Do not override handle() on the HTTP Kernel â€” use middleware or bootstrappers. followed
- [ ] Verify middleware execution order with php artisan route:list -v. followed
- [ ] Keep global middleware minimal applied
- [ ] Understand execution order applied
- [ ] Return `$next($request)` always applied
- [ ] Keep terminate() lightweight applied
- [ ] Prefer explicit middleware over $middlewarePriority applied
- [ ] Forgetting terminable middleware registration prevented
- [ ] Assuming middleware runs in route order prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Global Middleware as Catch-All prevented
- [ ] Modifying $middlewarePriority Excessively prevented
- [ ] Extending Kernel handle() prevented
- [ ] Kernel as Service Locator prevented
- [ ] Heavy Logic in terminate() prevented
- [ ] Keep global middleware minimal; prefer group or route middleware. followed
- [ ] Always return $next($request) from middleware handle methods. followed
- [ ] Keep terminate() methods lightweight; defer heavy work to queues. followed
- [ ] Do not override handle() on the HTTP Kernel â€” use middleware or bootstrappers. followed
- [ ] Verify middleware execution order with php artisan route:list -v. followed
- [ ] Use Contracts\Http\Kernel for type-hints instead of concrete kernel classes. followed

---

# Testing Checklist

- [ ] Identified the six bootstrappers in exact order
- [ ] Verified the middleware pipeline wraps request in global â†’ group â†’ route order
- [ ] Confirmed `$middlewarePriority` reordering across boundaries
- [ ] Traced `dispatchToRouter()` call into the Router
- [ ] Read `Illuminate\Foundation\Http\Kernel::handle()` source
- [ ] Trace the full flow: handle() â†’ bootstrap() â†’ sendRequestThroughRouter() â†’ Pipeline â†’ dispatchToRouter()
- [ ] Verify understanding of middleware execution order: global â†’ group â†’ route, with priority reordering
- [ ] Identify the six bootstrappers and their order
- [ ] Able to describe the exact execution order for any request: bootstrap â†’ global middleware â†’ group middleware â†’ route middleware â†’ dispatch â†’ response return â†’ terminate
- [ ] Can identify where in the lifecycle a given piece of custom logic executes
- [ ] Can predict how changes to middleware, bootstrappers, or kernel configuration affect the lifecycle
- [ ] php artisan route:list -v output matches the intended execution order for every route

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Global Middleware as Catch-All prevented
- [ ] Modifying $middlewarePriority Excessively prevented
- [ ] Extending Kernel handle() prevented
- [ ] Kernel as Service Locator prevented
- [ ] Heavy Logic in terminate() prevented

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

- **PHP Middleware Pattern (PSR-15)** â€” understanding the `handle()` / `process()` middleware contract
- **Service Container & Service Providers** â€” how the kernel resolves its dependencies on construction
- **Kernel Bootstrappers** â€” the six initialization steps running before middleware execution
- **Console Kernel Internals** â€” the CLI counterpart with shared bootstrapping but different pipeline
- **Request Duration Lifecycle Handlers** â€” threshold-based callbacks firing in the terminate phase
- **Routing Internals** â€” how `dispatchToRouter()` delegates to the matched route's handler

---


