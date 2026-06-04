# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Method Injection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for serializable payload, method injection for services
- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for payload, method injection for services
- [ ] Use for action-specific dependencies applied
- [ ] Combine with constructor injection applied
- [ ] Explicit parameter naming applied
- [ ] Prefer constructor injection for middleware applied
- [ ] Blind Method Injection (Same Dep Repeated) prevented
- [ ] Method Injection in Middleware prevented
- [ ] Assuming all parameters are resolved prevented
- [ ] Parameter name collision prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use for action-specific dependencies applied
- [ ] Combine with constructor injection applied
- [ ] Explicit parameter naming applied
- [ ] Prefer constructor injection for middleware applied
- [ ] Assuming all parameters are resolved prevented
- [ ] Parameter name collision prevented
- [ ] Method injection in middleware prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Blind Method Injection (Same Dep Repeated) prevented
- [ ] Method Injection in Middleware prevented
- [ ] Method Injection in Hot Paths prevented
- [ ] Overriding Resolved Params with User Input prevented
- [ ] Method Injection in Queued Listeners prevented

---

# Testing Checklist

- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for payload, method injection for services
- [ ] Controller actions have container-resolved params before route binding params
- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for serializable payload, method injection for services
- [ ] Controller actions use method injection for `Request` and route parameters
- [ ] Shared dependencies use constructor injection; single-use deps use method injection
- [ ] Controller action signatures have container-resolved params before route bindings
- [ ] Listeners inject services in handle() â€” constructors are parameterless
- [ ] Middleware uses constructor injection with clean handle($request, $next) signatures

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Blind Method Injection (Same Dep Repeated) prevented
- [ ] Method Injection in Middleware prevented
- [ ] Method Injection in Hot Paths prevented
- [ ] Overriding Resolved Params with User Input prevented
- [ ] Method Injection in Queued Listeners prevented

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

- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md)
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md)
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md)
- `BoundMethod::call()` is at `Illuminate\Container\BoundMethod`.
- It handles `ReflectionFunctionAbstract` (covers both `ReflectionMethod` and `ReflectionFunction`).
- The `parseCallable()` method splits `Class@method` strings â€” does NOT validate the class exists until call time.
- `Container::call()` is used by `ControllerDispatcher`, `Bus::dispatch()`, and `Application::boot()`.

---


