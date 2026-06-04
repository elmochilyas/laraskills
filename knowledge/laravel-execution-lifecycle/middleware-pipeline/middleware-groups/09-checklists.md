# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Groups
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] List the default middleware in `web` and `api` groups
- [ ] Create a custom `admin` group with auth, verified, and custom middleware
- [ ] Verify `route:list -v` shows expanded group middleware on routes
- [ ] Custom groups defined for distinct route types, not modifying defaults
- [ ] Group name follows lowercase, hyphenated convention
- [ ] `route:list -v` shows expanded middleware list correctly
- [ ] Keep default groups intact applied
- [ ] Use `php artisan route:list -v` to verify group expansion applied
- [ ] Place `web` routes in `routes/web.php`, `api` routes in `routes/api.php` applied
- [ ] Create custom groups for distinct route types applied
- [ ] Placing API Routes in routes/web.php prevented
- [ ] Adding Middleware to Default Groups prevented
- [ ] Placing API routes in routes/web.php prevented
- [ ] Adding middleware to default groups prevented

---

# Architecture Checklist

- [ ] Two-group default architecture followed
- [ ] `web` group includes full session state architecture followed
- [ ] `api` group excludes session architecture followed
- [ ] Group-to-route mapping architecture followed

---

# Implementation Checklist

- [ ] Keep default groups intact applied
- [ ] Use `php artisan route:list -v` to verify group expansion applied
- [ ] Place `web` routes in `routes/web.php`, `api` routes in `routes/api.php` applied
- [ ] Create custom groups for distinct route types applied
- [ ] Placing API routes in routes/web.php prevented
- [ ] Adding middleware to default groups prevented
- [ ] Over-grouping prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Placing API Routes in routes/web.php prevented
- [ ] Adding Middleware to Default Groups prevented
- [ ] Over-Grouping prevented
- [ ] Forgetting Group Name Registration prevented
- [ ] Not Verifying with route:list -v prevented

---

# Testing Checklist

- [ ] Custom groups defined for distinct route types, not modifying defaults
- [ ] Group name follows lowercase, hyphenated convention
- [ ] `route:list -v` shows expanded middleware list correctly
- [ ] No middleware duplication across combined groups
- [ ] List the default middleware in `web` and `api` groups
- [ ] Create a custom `admin` group with auth, verified, and custom middleware
- [ ] Verify `route:list -v` shows expanded group middleware on routes
- [ ] Place an API route in `routes/web.php` â€” observe CSRF errors
- [ ] All route types have appropriately named groups
- [ ] No unnecessary middleware runs on any route type
- [ ] Admin/SPA/tenant routes have their own groups, not modifications to defaults
- [ ] route:list -v on any route shows exactly the expected middleware stack

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Placing API Routes in routes/web.php prevented
- [ ] Adding Middleware to Default Groups prevented
- [ ] Over-Grouping prevented
- [ ] Forgetting Group Name Registration prevented
- [ ] Not Verifying with route:list -v prevented

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

- Pipeline Pattern Fundamentals (pipe chaining and execution order)
- Global Middleware Stack (outermost middleware layer)
- Kernel Architecture (how groups map to route files)
- Route Middleware (individual route middleware assignment)
- Default Middleware Members (contents of web/api groups)

---


