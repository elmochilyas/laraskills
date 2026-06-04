# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Pipeline Pattern Fundamentals
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read `Illuminate\Pipeline\Pipeline::carry()` source â€” understand the closure wrapping mechanism
- [ ] Trace `then()` execution: `array_reduce` â†’ reversed pipes â†’ nested closures
- [ ] Create a custom pipeline with three pipes â€” verify execution order
- [ ] Each pipe returns the result of `$next($passable)` or a short-circuit response
- [ ] Class-string pipes used instead of closures for production code
- [ ] `thenReturn()` used when destination is trivial
- [ ] Always return `$next($request)` applied
- [ ] Keep pipes focused on a single concern applied
- [ ] Prefer class strings over closures in `through()` applied
- [ ] Use `thenReturn()` when the destination is trivial applied
- [ ] Forgetting return $next($request) prevented
- [ ] Closure Middleware on Production Routes prevented
- [ ] Forgetting to return $next($request) prevented
- [ ] Mixing pre and post code without clarity prevented

---

# Architecture Checklist

- [ ] Explicit Pipeline class architecture followed
- [ ] `array_reduce` with reversed pipes architecture followed
- [ ] Fluent API architecture followed
- [ ] Container resolution architecture followed

---

# Implementation Checklist

- [ ] Always return `$next($request)` applied
- [ ] Keep pipes focused on a single concern applied
- [ ] Prefer class strings over closures in `through()` applied
- [ ] Use `thenReturn()` when the destination is trivial applied
- [ ] Forgetting to return $next($request) prevented
- [ ] Mixing pre and post code without clarity prevented
- [ ] Using closures for production middleware prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Forgetting return $next($request) prevented
- [ ] Closure Middleware on Production Routes prevented
- [ ] Multi-Concern Middleware prevented
- [ ] Pipeline for Single-Step Processing prevented
- [ ] Forgetting Short-Circuit Safety prevented

---

# Testing Checklist

- [ ] Each pipe returns the result of `$next($passable)` or a short-circuit response
- [ ] Class-string pipes used instead of closures for production code
- [ ] `thenReturn()` used when destination is trivial
- [ ] Pipeline execution order verified (first pipe in array executes first)
- [ ] Read `Illuminate\Pipeline\Pipeline::carry()` source â€” understand the closure wrapping mechanism
- [ ] Trace `then()` execution: `array_reduce` â†’ reversed pipes â†’ nested closures
- [ ] Create a custom pipeline with three pipes â€” verify execution order
- [ ] Test short-circuit: return response from middle pipe â€” verify downstream pipes don't execute
- [ ] Custom pipeline successfully processes passable through all pipes
- [ ] Each pipe resolves from the container and receives correct parameters
- [ ] Execution order matches the pipe array order
- [ ] Short-circuit works as expected

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Forgetting return $next($request) prevented
- [ ] Closure Middleware on Production Routes prevented
- [ ] Multi-Concern Middleware prevented
- [ ] Pipeline for Single-Step Processing prevented
- [ ] Forgetting Short-Circuit Safety prevented

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

- Service Container (binding resolution mechanics)
- Closures in PHP (anonymous function fundamentals)
- Application Bootstrap (framework initialization sequence)
- Chain of Responsibility Pattern
- Decorator Pattern
- Service Container (dependency resolution in Pipeline::carry())

---


