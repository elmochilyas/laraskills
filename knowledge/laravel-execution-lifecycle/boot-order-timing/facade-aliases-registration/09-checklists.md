# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Facade Aliases Registration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All aliases in `config/app.php` point to valid facade classes
- [ ] No alias collisions between packages or application code
- [ ] Console commands import facades explicitly or have `RegisterFacades` added to bootstrapper list
- [ ] Every alias in `config/app.php` points to a valid, existing facade class
- [ ] No alias collisions exist between application, framework, and package aliases
- [ ] Console commands import facades explicitly with `use` statements
- [ ] Import facades explicitly in production code applied
- [ ] Place custom aliases at the end of the aliases array applied
- [ ] Never register aliases in service provider `register()` applied
- [ ] Use Real-Time Facades for custom services applied
- [ ] Using Facades Before RegisterFacades Bootstrapper prevented
- [ ] Relying on Facade Aliases in Console Commands prevented
- [ ] Alias collision prevented
- [ ] Console alias missing prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Import facades explicitly in production code applied
- [ ] Place custom aliases at the end of the aliases array applied
- [ ] Never register aliases in service provider `register()` applied
- [ ] Use Real-Time Facades for custom services applied
- [ ] Alias collision prevented
- [ ] Console alias missing prevented
- [ ] Alias in register() prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using Facades Before RegisterFacades Bootstrapper prevented
- [ ] Relying on Facade Aliases in Console Commands prevented
- [ ] Dynamic Alias Registration via class_alias() Instead of Config prevented
- [ ] Alias Collision Without Namespace Prefixing prevented

---

# Testing Checklist

- [ ] Every alias in `config/app.php` points to a valid, existing facade class
- [ ] No alias collisions exist between application, framework, and package aliases
- [ ] Console commands import facades explicitly with `use` statements
- [ ] Business logic classes use constructor injection, not facade aliases
- [ ] All aliases in `config/app.php` point to valid facade classes
- [ ] No alias collisions between packages or application code
- [ ] Console commands import facades explicitly or have `RegisterFacades` added to bootstrapper list
- [ ] Custom aliases are registered in `config/app.php`, not dynamically in providers
- [ ] All facade aliases resolve correctly and uniquely in HTTP context
- [ ] Console commands never fail with "class not found" from alias usage
- [ ] Business logic classes use constructor injection instead of aliases
- [ ] The aliases array contains only aliases used in Blade templates or non-injectable contexts

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using Facades Before RegisterFacades Bootstrapper prevented
- [ ] Relying on Facade Aliases in Console Commands prevented
- [ ] Dynamic Alias Registration via class_alias() Instead of Config prevented
- [ ] Alias Collision Without Namespace Prefixing prevented

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

- [Facade Architecture](../../dependency-injection/facade-architecture/02-knowledge-unit.md)
- [Bootstrapper Sequence](../../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md)
- [Application Builder Configuration](../../application-bootstrap/application-builder-configuration/02-knowledge-unit.md)

---


