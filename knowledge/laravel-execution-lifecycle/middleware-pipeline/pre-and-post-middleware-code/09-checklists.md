# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Pre And Post Middleware Code
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Write a middleware with both pre and post code â€” verify execution order with logging
- [ ] Test short-circuit: return response from pre-code â€” verify post-code does NOT execute
- [ ] Place two middleware with pre/post code â€” verify the nesting order (outer pre â†’ inner pre â†’ controller â†’ inner post â†’ outer post)
- [ ] Pre-code runs before `$next($request)` (inbound)
- [ ] Post-code runs after `$next($request)` (outbound)
- [ ] Pre and post sections are clearly commented
- [ ] Keep pre-middleware fast applied
- [ ] Understand short-circuit implications applied
- [ ] Keep related pre/post logic in one middleware applied
- [ ] Avoid heavy post-processing on every response applied
- [ ] Modifying Response in Pre-Middleware Code prevented
- [ ] Placing All Logic After $next() (Post-Code Bypass) prevented
- [ ] Placing all logic after $next() prevented
- [ ] Modifying response in pre-middleware prevented

---

# Architecture Checklist

- [ ] `$next($request)` as boundary architecture followed
- [ ] Nested closure execution architecture followed
- [ ] No separate before/after methods architecture followed
- [ ] Response modification architecture followed

---

# Implementation Checklist

- [ ] Keep pre-middleware fast applied
- [ ] Understand short-circuit implications applied
- [ ] Keep related pre/post logic in one middleware applied
- [ ] Avoid heavy post-processing on every response applied
- [ ] Placing all logic after $next() prevented
- [ ] Modifying response in pre-middleware prevented
- [ ] Heavy work in pre-middleware prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Modifying Response in Pre-Middleware Code prevented
- [ ] Placing All Logic After $next() (Post-Code Bypass) prevented
- [ ] Heavy Work in Pre-Middleware prevented
- [ ] Heavy Work in Post-Middleware prevented
- [ ] Splitting Logically Coupled Pre/Post Across Two Middleware prevented

---

# Testing Checklist

- [ ] Pre-code runs before `$next($request)` (inbound)
- [ ] Post-code runs after `$next($request)` (outbound)
- [ ] Pre and post sections are clearly commented
- [ ] Pre-middleware is fast (minimal TTFB impact)
- [ ] Write a middleware with both pre and post code â€” verify execution order with logging
- [ ] Test short-circuit: return response from pre-code â€” verify post-code does NOT execute
- [ ] Place two middleware with pre/post code â€” verify the nesting order (outer pre â†’ inner pre â†’ controller â†’ inner post â†’ outer post)
- [ ] Modify response in post-code â€” verify changes reach the client
- [ ] Middleware correctly executes pre-code inbound and post-code outbound
- [ ] Pre and post sections are clearly separated with comments
- [ ] Performance impact of pre and post code is understood and minimized
- [ ] Short-circuit behavior is tested and documented

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Modifying Response in Pre-Middleware Code prevented
- [ ] Placing All Logic After $next() (Post-Code Bypass) prevented
- [ ] Heavy Work in Pre-Middleware prevented
- [ ] Heavy Work in Post-Middleware prevented
- [ ] Splitting Logically Coupled Pre/Post Across Two Middleware prevented

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

- Pipeline Pattern Fundamentals (nested closure execution model)
- Route Middleware (middleware chaining and controller dispatch)
- Terminable Middleware (post-response deferred execution)
- Middleware Priority (ordering effects on pre/post execution wrapping)

---


