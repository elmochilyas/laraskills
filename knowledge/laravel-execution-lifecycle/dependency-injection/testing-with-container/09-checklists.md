# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Testing With Container
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tests that mock container bindings use instance() or shouldReceive()
- [ ] Facade fakes are cleared between tests (in setUp or tearDown)
- [ ] Scoped bindings are reset between tests where relevant
- [ ] Tests that mock container bindings use `instance()` or `shouldReceive()`
- [ ] Facade fakes are cleared between tests (in `setUp()` or `tearDown()`)
- [ ] Scoped bindings are reset between tests where relevant
- [ ] Use instance() for interface bindings applied
- [ ] Use shouldReceive() for facades applied
- [ ] Reset scoped instances between tests applied
- [ ] Use refreshApplication for full reset applied
- [ ] Not Resetting Scoped Instances Between Tests prevented
- [ ] Over-Mocking prevented
- [ ] Not resetting bindings between tests prevented
- [ ] Using shouldReceive() without clearing facade prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use instance() for interface bindings applied
- [ ] Use shouldReceive() for facades applied
- [ ] Reset scoped instances between tests applied
- [ ] Use refreshApplication for full reset applied
- [ ] Prefer fakes over mocks applied
- [ ] Not resetting bindings between tests prevented
- [ ] Using shouldReceive() without clearing facade prevented
- [ ] Over-mocking prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not Resetting Scoped Instances Between Tests prevented
- [ ] Over-Mocking prevented
- [ ] Using swap Instead of shouldReceive prevented
- [ ] Not Using Built-in Fakes prevented
- [ ] Modifying Container State Without Restoration prevented

---

# Testing Checklist

- [ ] Tests that mock container bindings use `instance()` or `shouldReceive()`
- [ ] Facade fakes are cleared between tests (in `setUp()` or `tearDown()`)
- [ ] Scoped bindings are reset between tests where relevant
- [ ] No stale container state causes inter-test contamination
- [ ] Tests that mock container bindings use instance() or shouldReceive()
- [ ] Facade fakes are cleared between tests (in setUp or tearDown)
- [ ] Scoped bindings are reset between tests where relevant
- [ ] No stale container state causes inter-test contamination
- [ ] Interface-bound services are mocked via $this->app->instance() in tests
- [ ] Facade-backed code is tested via shouldReceive() with proper cleanup
- [ ] Scoped bindings and facade state are cleared between tests
- [ ] Laravel built-in fakes are used when available (Event, Bus, Queue, Http)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Not Resetting Scoped Instances Between Tests prevented
- [ ] Over-Mocking prevented
- [ ] Using swap Instead of shouldReceive prevented
- [ ] Not Using Built-in Fakes prevented
- [ ] Modifying Container State Without Restoration prevented

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

- **Constructor Injection** â€” how classes receive dependencies that tests replace via `instance()`
- **Facade Architecture** â€” understanding facades is required for proper facade faking
- **PHPUnit / Mockery** â€” the testing framework and mocking library powering assertions
- **Interface Binding Resolution** â€” instance swapping replaces interface-to-concrete bindings
- **Auto-Resolution Strategy** â€” testing auto-resolved classes requires understanding of the resolution chain
- **Service Locator Anti-Pattern** â€” service locator complicates testing because it hides the swap point

---


