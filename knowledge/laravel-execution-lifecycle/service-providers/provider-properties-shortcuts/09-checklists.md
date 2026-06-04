# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Provider Properties Shortcuts
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can use `$bindings`/`$singletons` properties correctly
- [ ] Understand why `parent::register()` is required for shortcuts
- [ ] Can explain `mergeConfigFrom()` and when to use it
- [ ] `$bindings` array keys are interfaces/abstracts, values are concretes
- [ ] `$singletons` array follows the same pattern (self-binding or interfaceâ†’concrete)
- [ ] `parent::register()` called if `register()` is overridden
- [ ] Always call `parent::register()` when overriding `register()` applied
- [ ] Use `$singletons` for self-binding singletons applied
- [ ] Use `mergeConfigFrom()` in package providers applied
- [ ] Document `$bindings`/`$singletons` in package README applied
- [ ] Properties Without parent::register() prevented
- [ ] Overusing Properties for Complex Bindings prevented
- [ ] Overriding register() without calling parent prevented
- [ ] Using properties with non-existent class names prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always call `parent::register()` when overriding `register()` applied
- [ ] Use `$singletons` for self-binding singletons applied
- [ ] Use `mergeConfigFrom()` in package providers applied
- [ ] Document `$bindings`/`$singletons` in package README applied
- [ ] Overriding register() without calling parent prevented
- [ ] Using properties with non-existent class names prevented
- [ ] mergeConfigFrom() after config already cached prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Properties Without parent::register() prevented
- [ ] Overusing Properties for Complex Bindings prevented
- [ ] Config Merge After Cache prevented
- [ ] Re-declaring Properties Expecting Merge prevented
- [ ] Using Properties with Non-Existent Classes prevented

---

# Testing Checklist

- [ ] `$bindings` array keys are interfaces/abstracts, values are concretes
- [ ] `$singletons` array follows the same pattern (self-binding or interfaceâ†’concrete)
- [ ] `parent::register()` called if `register()` is overridden
- [ ] Each key listed in properties is actually registered â€” verified via `$app->bound()`
- [ ] Can use `$bindings`/`$singletons` properties correctly
- [ ] Understand why `parent::register()` is required for shortcuts
- [ ] Can explain `mergeConfigFrom()` and when to use it
- [ ] Know the limitations of properties (no closures, context, tagging)
- [ ] Simple bindings are registered declaratively without register() code.
- [ ] parent::register() is called, properties take effect.
- [ ] Complex bindings remain in register() code â€” correct separation.
- [ ] Subclass bindings work as intended (parent bindings preserved when needed).

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Properties Without parent::register() prevented
- [ ] Overusing Properties for Complex Bindings prevented
- [ ] Config Merge After Cache prevented
- [ ] Re-declaring Properties Expecting Merge prevented
- [ ] Using Properties with Non-Existent Classes prevented

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

- provider-fundamentals (base ServiceProvider class)
- register-vs-boot-methods (parent::register() requirement for shortcuts)
- Service Container Bindings (what $bindings/$singletons populate)
- Service Container Bindings (bind vs singleton distinction)
- Config Repository (mergeConfigFrom interaction with config repository)
- register-vs-boot-methods (how properties interact with register() override)

---


