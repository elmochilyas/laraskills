# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Response Sending And Termination
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can trace `$response->send()` â†’ `fastcgi_finish_request()` â†’ `$kernel->terminate()` flow
- [ ] Understand why terminable middleware must be registered as singleton
- [ ] Know the fixed termination pipeline order
- [ ] Total termination duration is under 5ms in production (measured)
- [ ] No synchronous HTTP API calls in termination
- [ ] No database writes exceeding 1ms in termination
- [ ] Move heavy work to a queue applied
- [ ] Keep termination under 5ms applied
- [ ] Wrap `terminate()` body in try/catch applied
- [ ] Use `RequestHandled` event for response modification applied
- [ ] Synchronous API Calls or DB Queries in Termination prevented
- [ ] Modifying Response in Terminating Event or terminable Middleware prevented
- [ ] Assuming terminate() runs immediately after send prevented
- [ ] Heavy logic in termination blocking FPM prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Move heavy work to a queue applied
- [ ] Keep termination under 5ms applied
- [ ] Wrap `terminate()` body in try/catch applied
- [ ] Use `RequestHandled` event for response modification applied
- [ ] Assuming terminate() runs immediately after send prevented
- [ ] Heavy logic in termination blocking FPM prevented
- [ ] Closure middleware with terminate method prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Synchronous API Calls or DB Queries in Termination prevented
- [ ] Modifying Response in Terminating Event or terminable Middleware prevented
- [ ] Not Wrapping Terminate Logic in Try-Catch prevented
- [ ] Closure Middleware with terminate() Behavior prevented
- [ ] Not Registering Terminable Middleware as Singleton prevented

---

# Testing Checklist

- [ ] Total termination duration is under 5ms in production (measured)
- [ ] No synchronous HTTP API calls in termination
- [ ] No database writes exceeding 1ms in termination
- [ ] All heavy I/O uses `dispatch()->afterResponse()` or queue jobs
- [ ] Can trace `$response->send()` â†’ `fastcgi_finish_request()` â†’ `$kernel->terminate()` flow
- [ ] Understand why terminable middleware must be registered as singleton
- [ ] Know the fixed termination pipeline order
- [ ] Can explain the difference between `RequestHandled` and `Terminating` event timing

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Synchronous API Calls or DB Queries in Termination prevented
- [ ] Modifying Response in Terminating Event or terminable Middleware prevented
- [ ] Not Wrapping Terminate Logic in Try-Catch prevented
- [ ] Closure Middleware with terminate() Behavior prevented
- [ ] Not Registering Terminable Middleware as Singleton prevented

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

- HTTP Kernel Dispatch (produces the Response that this KU consumes)
- Middleware Pipeline (terminable middleware originates in the pipeline)
- Entry Point Mechanics (the `send()` + `terminate()` calls in `public/index.php`)
- Lifecycle Events and Hooks (RequestHandled, Terminating events)
- Long-Running Process Architecture (Octane termination differences)
- Console Kernel Dispatch (console command output vs HTTP response sending)
- Kernel Architecture (terminate() contract across kernel implementations)

---


