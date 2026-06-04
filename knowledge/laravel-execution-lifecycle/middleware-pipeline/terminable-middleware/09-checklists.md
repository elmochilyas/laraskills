# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Terminable Middleware
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Create a terminable middleware with both `handle()` and `terminate()`
- [ ] Verify `terminate()` runs after response is sent
- [ ] Place a `sleep(2)` in terminate() â€” verify response arrives immediately followed by 2s delay
- [ ] `terminate()` is wrapped in try-catch
- [ ] Heavy operations dispatched to queue, not run synchronously in `terminate()`
- [ ] Middleware registered in global or group stack (not route-level)
- [ ] Keep terminate() lightweight applied
- [ ] Wrap terminate logic in try-catch applied
- [ ] Use queues for heavy post-response work applied
- [ ] Register middleware in global stack or groups for terminable to work applied
- [ ] Heavy Synchronous Work in terminate() prevented
- [ ] No Try-Catch in terminate() â€” Silent Worker Crashes prevented
- [ ] Heavy work in terminate() prevented
- [ ] Not wrapping in try-catch prevented

---

# Architecture Checklist

- [ ] Separate method over post-middleware architecture followed
- [ ] LIFO termination order architecture followed
- [ ] Pipeline-independent architecture followed
- [ ] Instance persistence architecture followed

---

# Implementation Checklist

- [ ] Keep terminate() lightweight applied
- [ ] Wrap terminate logic in try-catch applied
- [ ] Use queues for heavy post-response work applied
- [ ] Register middleware in global stack or groups for terminable to work applied
- [ ] Heavy work in terminate() prevented
- [ ] Not wrapping in try-catch prevented
- [ ] Route middleware not terminable prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Heavy Synchronous Work in terminate() prevented
- [ ] No Try-Catch in terminate() â€” Silent Worker Crashes prevented
- [ ] Route-Level Registation â€” terminate() Never Called prevented
- [ ] Modifying Response in terminate() prevented
- [ ] Expecting Async Behavior from terminate() prevented

---

# Testing Checklist

- [ ] `terminate()` is wrapped in try-catch
- [ ] Heavy operations dispatched to queue, not run synchronously in `terminate()`
- [ ] Middleware registered in global or group stack (not route-level)
- [ ] Request and response are treated as read-only in `terminate()`
- [ ] Create a terminable middleware with both `handle()` and `terminate()`
- [ ] Verify `terminate()` runs after response is sent
- [ ] Place a `sleep(2)` in terminate() â€” verify response arrives immediately followed by 2s delay
- [ ] Test terminate exception handling â€” wrap in try-catch, verify process doesn't crash
- [ ] terminate() runs after response is sent to the client
- [ ] All terminate() logic is wrapped in try-catch
- [ ] Heavy operations are dispatched to queues, not run synchronously
- [ ] Middleware is registered in global or group stack (terminate() is called)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Heavy Synchronous Work in terminate() prevented
- [ ] No Try-Catch in terminate() â€” Silent Worker Crashes prevented
- [ ] Route-Level Registation â€” terminate() Never Called prevented
- [ ] Modifying Response in terminate() prevented
- [ ] Expecting Async Behavior from terminate() prevented

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

- Pipeline Pattern Fundamentals (middleware instance lifecycle)
- Pre-and-Post-Middleware Code (request/response phase distinction)
- Middleware Lifecycle (full request-to-response middleware journey)
- Kernel Architecture (terminateMiddleware dispatch in Http Kernel)

---


