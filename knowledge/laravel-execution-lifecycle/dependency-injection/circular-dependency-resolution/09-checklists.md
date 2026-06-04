# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Circular Dependency Resolution
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] No `CircularDependencyException` occurs during application bootstrap or normal operation
- [ ] Dependency graph is acyclic (verified with static analysis tools)
- [ ] No service locator (`app()`) used to "break" cycles
- [ ] No `CircularDependencyException` occurs during bootstrap or normal operation
- [ ] Dependency graph is acyclic (verified with static analysis tools)
- [ ] No service locator (`app()`) used to "break" cycles
- [ ] Design acyclic dependency graphs applied
- [ ] Extract shared dependencies applied
- [ ] Use event-driven decoupling applied
- [ ] Use lazy injection sparingly applied
- [ ] Service Locator to Break Cycles prevented
- [ ] Setter Injection for Cycles prevented
- [ ] Using lazy resolution as default fix prevented
- [ ] Ignoring the exception message prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Design acyclic dependency graphs applied
- [ ] Extract shared dependencies applied
- [ ] Use event-driven decoupling applied
- [ ] Use lazy injection sparingly applied
- [ ] Using lazy resolution as default fix prevented
- [ ] Ignoring the exception message prevented
- [ ] Self-injection by accident prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Service Locator to Break Cycles prevented
- [ ] Setter Injection for Cycles prevented
- [ ] Lazy Resolution as Default Fix prevented
- [ ] Ignoring the Exception Message prevented
- [ ] Interface Abstraction Without Refactoring prevented

---

# Testing Checklist

- [ ] No `CircularDependencyException` occurs during bootstrap or normal operation
- [ ] Dependency graph is acyclic (verified with static analysis tools)
- [ ] No service locator (`app()`) used to "break" cycles
- [ ] Events/listeners are used instead of direct circular calls where appropriate
- [ ] No `CircularDependencyException` occurs during application bootstrap or normal operation
- [ ] Dependency graph is acyclic (verified with static analysis tools)
- [ ] No service locator (`app()`) used to "break" cycles
- [ ] Events/listeners are used instead of direct circular calls where appropriate
- [ ] All class dependencies form a Directed Acyclic Graph
- [ ] No CircularDependencyException occurs during resolution
- [ ] No app() calls exist that were added to break cycles
- [ ] No setter injection is used to circumvent cycle detection

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Service Locator to Break Cycles prevented
- [ ] Setter Injection for Cycles prevented
- [ ] Lazy Resolution as Default Fix prevented
- [ ] Ignoring the Exception Message prevented
- [ ] Interface Abstraction Without Refactoring prevented

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

- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md)
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md)
- [Service Locator Anti-Pattern](../../dependency-injection/service-locator-anti-pattern/02-knowledge-unit.md)
- `$buildStack` is tracked in `Container::$buildStack`.
- The cycle detection is in `Container::build()` â€” before pushing a class, checks `in_array($concrete, $this->buildStack, true)`.
- The exception message includes the full resolution chain â€” read it to find the cycle.
- Fixing a cycle NEVER requires changing the container â€” always restructure the classes.
- Use `Container::make()` with `$parameters` to pre-resolve one side of a cycle only if absolutely necessary (rare).

---


