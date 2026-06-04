# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Console Vs Http Boot Differences
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Code that depends on middleware state is guarded or only used in HTTP context
- [ ] Service providers use `runningInConsole()` for CLI-specific registration
- [ ] Console commands do not depend on session, auth, or CSRF middleware
- [ ] Services depending on middleware state are guarded with `runningInConsole()` or not registered in CLI
- [ ] No Artisan command `handle()` method accesses `auth()`, `session()`, or CSRF token
- [ ] Scheduled commands have `->withoutOverlapping()` where execution may overlap
- [ ] Check context explicitly applied
- [ ] Keep CLI commands self-contained applied
- [ ] Use console-specific providers applied
- [ ] Test in both contexts applied
- [ ] Duplicating Middleware Logic in Commands prevented
- [ ] HTTP-Conditional Provider Registration Without Clear Reason prevented
- [ ] Assuming middleware runs in console prevented
- [ ] Different bootstrap behavior prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Check context explicitly applied
- [ ] Keep CLI commands self-contained applied
- [ ] Use console-specific providers applied
- [ ] Test in both contexts applied
- [ ] Assuming middleware runs in console prevented
- [ ] Different bootstrap behavior prevented
- [ ] Scheduler running heavy command every minute prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Duplicating Middleware Logic in Commands prevented
- [ ] HTTP-Conditional Provider Registration Without Clear Reason prevented
- [ ] Console-Only Configuration Sets prevented
- [ ] Middleware-Dependent Code in Console Commands prevented
- [ ] Scheduled Commands Without withoutOverlapping() prevented

---

# Testing Checklist

- [ ] Services depending on middleware state are guarded with `runningInConsole()` or not registered in CLI
- [ ] No Artisan command `handle()` method accesses `auth()`, `session()`, or CSRF token
- [ ] Scheduled commands have `->withoutOverlapping()` where execution may overlap
- [ ] Maintenance-sensitive commands check `app()->isDownForMaintenance()`
- [ ] Code that depends on middleware state is guarded or only used in HTTP context
- [ ] Service providers use `runningInConsole()` for CLI-specific registration
- [ ] Console commands do not depend on session, auth, or CSRF middleware
- [ ] Scheduler commands have `withoutOverlapping()` where appropriate
- [ ] All console commands run without errors in a clean CLI environment
- [ ] No middleware-dependent code exists in any command handle() method
- [ ] Service providers correctly register CLI-specific services only when runningInConsole() is true
- [ ] Scheduled commands do not overlap and respect maintenance mode

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Duplicating Middleware Logic in Commands prevented
- [ ] HTTP-Conditional Provider Registration Without Clear Reason prevented
- [ ] Console-Only Configuration Sets prevented
- [ ] Middleware-Dependent Code in Console Commands prevented
- [ ] Scheduled Commands Without withoutOverlapping() prevented

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

- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md)
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md)
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md)
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md)
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md)
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md)

---


