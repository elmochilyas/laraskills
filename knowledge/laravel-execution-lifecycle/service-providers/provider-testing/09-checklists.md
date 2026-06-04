# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Provider Testing
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can write a unit test for `register()` using `$app->bound()` assertions
- [ ] Can write `provides()` contract test for deferred providers
- [ ] Can write boot integration test with dependent providers
- [ ] Test verifies each binding registered via `$app->bound()`
- [ ] Test verifies singleton nature via `$app->isShared()`
- [ ] Test verifies concrete types resolve to correct implementation
- [ ] Unit-test `register()` with real or mock container applied
- [ ] Integration-test `boot()` with minimal application applied
- [ ] Always test `provides()` for deferred providers applied
- [ ] Test resolution order applied
- [ ] Testing Resolution Instead of Registration prevented
- [ ] No provides() Test for Deferred Providers prevented
- [ ] Testing resolution but not registration prevented
- [ ] Not testing provides() for deferred providers prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Unit-test `register()` with real or mock container applied
- [ ] Integration-test `boot()` with minimal application applied
- [ ] Always test `provides()` for deferred providers applied
- [ ] Test resolution order applied
- [ ] Testing resolution but not registration prevented
- [ ] Not testing provides() for deferred providers prevented
- [ ] Testing boot() without prerequisite providers prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Testing Resolution Instead of Registration prevented
- [ ] No provides() Test for Deferred Providers prevented
- [ ] Over-Isolated Tests prevented
- [ ] Testing boot() Without Prerequisites prevented
- [ ] Over-Mocking Container prevented

---

# Testing Checklist

- [ ] Test verifies each binding registered via `$app->bound()`
- [ ] Test verifies singleton nature via `$app->isShared()`
- [ ] Test verifies concrete types resolve to correct implementation
- [ ] Real application container used (not mocked container)
- [ ] Can write a unit test for `register()` using `$app->bound()` assertions
- [ ] Can write `provides()` contract test for deferred providers
- [ ] Can write boot integration test with dependent providers
- [ ] Understand the difference between testing registration vs resolution
- [ ] Every binding in the provider is tested and verified via $app->bound().
- [ ] Concrete types resolve to expected implementations.
- [ ] Test suite catches regressions when provider's register() changes.
- [ ] Every deferred provider has a provides() contract test.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Testing Resolution Instead of Registration prevented
- [ ] No provides() Test for Deferred Providers prevented
- [ ] Over-Isolated Tests prevented
- [ ] Testing boot() Without Prerequisites prevented
- [ ] Over-Mocking Container prevented

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

- provider-fundamentals (what providers do under test)
- PHPUnit/Mockery knowledge (testing tooling)
- Service Container (container assertions for binding verification)
- register-vs-boot-methods (testing register vs boot behavior)
- deferred-providers (testing provides() accuracy)
- eager-providers (testing eager registration side effects)

---


