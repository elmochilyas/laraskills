# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Legacy Kernel Migration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Map each `$middleware` entry to `$middleware->append()` or `$middleware->prepend()`
- [ ] Map each `$middlewareGroups` entry to `$middleware->groupName(append: [...])` or `$middleware->groupName(prepend: [...])`
- [ ] Map each `$routeMiddleware` entry to `$middleware->alias(key, class)`
- [ ] Pre-migration baseline captured via `php artisan route:list -v > baseline.txt`
- [ ] Global middleware entries mapped to `$middleware->append()` or `$middleware->prepend()`
- [ ] Group middleware entries mapped to `$middleware->{groupName}(append: [...])` or `->{groupName}(prepend: [...])`
- [ ] Migrate configuration one property at a time with verification between each step. followed
- [ ] Use the BC layer â€” keep old kernel files until ApplicationBuilder config is verified. followed
- [ ] Replace all $kernel->pushMiddleware() calls in service providers before migration. followed
- [ ] Verify middleware lists match exactly using php artisan route:list -v before and after. followed
- [ ] Do not mark migration as complete until command and schedule registration is also migrated. followed
- [ ] Use ->withMiddleware() remove capabilities to drop unwanted framework defaults. followed
- [ ] Migrate in Laravel 10 first applied
- [ ] Keep old kernel file until fully verified applied
- [ ] Audit service providers for `$kernel->pushMiddleware()` applied
- [ ] Replace `App\Http\Kernel` type-hints applied
- [ ] Permanent Dual Configuration prevented
- [ ] Removing Kernel Too Early prevented
- [ ] Duplicate middleware prevented
- [ ] Missing use in bootstrap/app.php prevented

---

# Architecture Checklist

- [ ] Strangler Fig Pattern architecture followed
- [ ] Property to Method Call architecture followed
- [ ] Single Responsibility architecture followed
- [ ] BC-First Approach architecture followed

---

# Implementation Checklist

- [ ] Migrate configuration one property at a time with verification between each step. followed
- [ ] Use the BC layer â€” keep old kernel files until ApplicationBuilder config is verified. followed
- [ ] Replace all $kernel->pushMiddleware() calls in service providers before migration. followed
- [ ] Verify middleware lists match exactly using php artisan route:list -v before and after. followed
- [ ] Do not mark migration as complete until command and schedule registration is also migrated. followed
- [ ] Migrate in Laravel 10 first applied
- [ ] Keep old kernel file until fully verified applied
- [ ] Audit service providers for `$kernel->pushMiddleware()` applied
- [ ] Replace `App\Http\Kernel` type-hints applied
- [ ] Duplicate middleware prevented
- [ ] Missing use in bootstrap/app.php prevented
- [ ] Removing kernel too early prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Permanent Dual Configuration prevented
- [ ] Removing Kernel Too Early prevented
- [ ] Skipping Command/Schedule Migration prevented
- [ ] Manual Vendor Edits prevented
- [ ] Over-Relying on BC Layer prevented
- [ ] Migrate configuration one property at a time with verification between each step. followed
- [ ] Use the BC layer â€” keep old kernel files until ApplicationBuilder config is verified. followed
- [ ] Replace all $kernel->pushMiddleware() calls in service providers before migration. followed
- [ ] Verify middleware lists match exactly using php artisan route:list -v before and after. followed
- [ ] Do not mark migration as complete until command and schedule registration is also migrated. followed
- [ ] Use ->withMiddleware() remove capabilities to drop unwanted framework defaults. followed

---

# Testing Checklist

- [ ] Pre-migration baseline captured via `php artisan route:list -v > baseline.txt`
- [ ] Global middleware entries mapped to `$middleware->append()` or `$middleware->prepend()`
- [ ] Group middleware entries mapped to `$middleware->{groupName}(append: [...])` or `->{groupName}(prepend: [...])`
- [ ] Route middleware aliases mapped to `$middleware->alias(name, class)`
- [ ] Map each `$middleware` entry to `$middleware->append()` or `$middleware->prepend()`
- [ ] Map each `$middlewareGroups` entry to `$middleware->groupName(append: [...])` or `$middleware->groupName(prepend: [...])`
- [ ] Map each `$routeMiddleware` entry to `$middleware->alias(key, class)`
- [ ] Map `$commands` to `->withCommands([...])`
- [ ] All three middleware property arrays are migrated to ->withMiddleware() syntax
- [ ] php artisan route:list -v output is identical before and after each migration step
- [ ] Application test suite passes with the migrated configuration
- [ ] Legacy app/Http/Kernel.php is deleted only after staging verification confirms equivalence

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Permanent Dual Configuration prevented
- [ ] Removing Kernel Too Early prevented
- [ ] Skipping Command/Schedule Migration prevented
- [ ] Manual Vendor Edits prevented
- [ ] Over-Relying on BC Layer prevented

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

- **HTTP Kernel Internals** â€” understanding the pipeline and middleware arrays being migrated
- **Console Kernel Internals** â€” the console counterpart with command and schedule registration
- **Laravel Upgrade Guide (10â†’11)** â€” official framework upgrade documentation and changelog
- **Application Skeleton** â€” how `bootstrap/app.php` serves as the new configuration entry point
- **Middleware Internals** â€” how middleware priority, groups, and aliases are configured in both formats

---


