# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Vs Route Binding Ordering
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Create a route with `{user}` parameter â€” access `$request->route('user')` in middleware before and after SubstituteBindings
- [ ] Observe that before binding, `$request->route('user')` is a string ID; after binding, it's a User model
- [ ] Add custom middleware that checks resource ownership â€” place it correctly relative to SubstituteBindings
- [ ] Binding-aware middleware runs after `SubstituteBindings`
- [ ] Auth middleware runs before `SubstituteBindings` for performance
- [ ] `$request->route('param')` returns a model instance in middleware
- [ ] Place middleware after `SubstituteBindings` in the group array if it accesses route models applied
- [ ] Use the priority list for cross-source ordering applied
- [ ] Test with both authenticated and unauthenticated requests applied
- [ ] Never assume `$request->route('param')` is a model applied
- [ ] Accessing Route Models Before SubstituteBindings prevented
- [ ] Manually Resolving Bindings in Middleware Instead of Fixing Order prevented
- [ ] Adding resource-check middleware before SubstituteBindings prevented
- [ ] Assuming all middleware has model bindings available prevented

---

# Architecture Checklist

- [ ] `SubstituteBindings` as middleware, not pre-pipeline step architecture followed
- [ ] Auth before binding architecture followed
- [ ] Priority position architecture followed
- [ ] Performance architecture followed

---

# Implementation Checklist

- [ ] Place middleware after `SubstituteBindings` in the group array if it accesses route models applied
- [ ] Use the priority list for cross-source ordering applied
- [ ] Test with both authenticated and unauthenticated requests applied
- [ ] Never assume `$request->route('param')` is a model applied
- [ ] Adding resource-check middleware before SubstituteBindings prevented
- [ ] Assuming all middleware has model bindings available prevented
- [ ] Priority change without testing prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Accessing Route Models Before SubstituteBindings prevented
- [ ] Manually Resolving Bindings in Middleware Instead of Fixing Order prevented
- [ ] Placing Auth After SubstituteBindings Without Need prevented
- [ ] Not Testing Both Authenticated and Unauthenticated Paths prevented
- [ ] One-Size-Fits-All Middleware Ordering prevented

---

# Testing Checklist

- [ ] Binding-aware middleware runs after `SubstituteBindings`
- [ ] Auth middleware runs before `SubstituteBindings` for performance
- [ ] `$request->route('param')` returns a model instance in middleware
- [ ] Tested with authenticated request (model bound)
- [ ] Create a route with `{user}` parameter â€” access `$request->route('user')` in middleware before and after SubstituteBindings
- [ ] Observe that before binding, `$request->route('user')` is a string ID; after binding, it's a User model
- [ ] Add custom middleware that checks resource ownership â€” place it correctly relative to SubstituteBindings
- [ ] Test with unauthenticated request â€” verify auth middleware rejects before model binding runs
- [ ] Binding-aware middleware correctly receives model instances
- [ ] Auth middleware rejects before model loading (performance optimization)
- [ ] No "Call to a member function on string" errors in middleware
- [ ] Both authenticated and unauthenticated request paths work correctly

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Accessing Route Models Before SubstituteBindings prevented
- [ ] Manually Resolving Bindings in Middleware Instead of Fixing Order prevented
- [ ] Placing Auth After SubstituteBindings Without Need prevented
- [ ] Not Testing Both Authenticated and Unauthenticated Paths prevented
- [ ] One-Size-Fits-All Middleware Ordering prevented

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

- Pipeline Pattern Fundamentals (execution order in pipeline)
- Middleware Priority (global sort affecting SubstituteBindings position)
- Route Middleware (where binding middleware fits in group definitions)
- Route Model Binding (implicit and explicit binding mechanics)
- Middleware Groups (SubstituteBindings placement in web/api groups)

---


