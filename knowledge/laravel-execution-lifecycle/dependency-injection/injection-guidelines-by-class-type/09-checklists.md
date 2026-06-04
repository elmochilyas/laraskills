# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Injection Guidelines By Class Type
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Controllers use constructor injection for shared services, method injection for action-specific
- [ ] Jobs use constructor injection for serialized data, handle() injection for runtime services
- [ ] Listeners use method injection in handle(), not constructor injection
- [ ] Controllers use constructor injection for shared, method injection for action-specific deps
- [ ] Jobs use constructor injection for serialized payload, `handle()` injection for runtime services
- [ ] Listeners use method injection in `handle()` â€” not constructor injection
- [ ] Controllers applied
- [ ] Jobs applied
- [ ] Listeners applied
- [ ] Middleware applied
- [ ] Constructor injection in listener prevented
- [ ] Method injection for shared controller deps prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Controllers applied
- [ ] Jobs applied
- [ ] Listeners applied
- [ ] Middleware applied
- [ ] Services/Repositories applied
- [ ] Constructor injection in listener prevented
- [ ] Method injection for shared controller deps prevented
- [ ] app() in service class prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist


---

# Testing Checklist

- [ ] Controllers use constructor injection for shared, method injection for action-specific deps
- [ ] Jobs use constructor injection for serialized payload, `handle()` injection for runtime services
- [ ] Listeners use method injection in `handle()` â€” not constructor injection
- [ ] Middleware uses constructor injection â€” no extra params in `handle()`
- [ ] Controllers use constructor injection for shared services, method injection for action-specific
- [ ] Jobs use constructor injection for serialized data, handle() injection for runtime services
- [ ] Listeners use method injection in handle(), not constructor injection
- [ ] Services and repositories use constructor injection exclusively
- [ ] Each class type follows its recommended injection pattern
- [ ] No queued job payloads contain non-serializable services
- [ ] Listener dependencies resolve at event dispatch time, not registration time
- [ ] Controllers have clean separation between shared and action-specific deps

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] No anti-patterns detected

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

- **Constructor Injection** â€” the primary mechanism recommended for most class types
- **Method Injection** â€” the alternative for class types that should avoid constructor injection
- **Service Locator Anti-Pattern** â€” explains why `app()` calls in models and DTOs are harmful
- **Over-Injection Anti-Pattern** â€” provides thresholds and refactoring guidance for over-injected classes
- **Auto-Resolution Strategy** â€” understanding how the container resolves injected dependencies
- **Interface Binding Resolution** â€” how to wire abstractions to concretes for injected interfaces

---


