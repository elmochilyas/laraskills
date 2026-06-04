# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Kernel Version Evolution
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Compare Laravel 10 and Laravel 11 skeleton projects â€” identify the kernel structure differences
- [ ] Migrate a middleware configuration from kernel property to `withMiddleware()` syntax
- [ ] Verify BC layer works: keep old kernel file while adding ApplicationBuilder config
- [ ] `php artisan route:list -v` output matches pre-migration baseline for every route
- [ ] All global middleware entries are present in `->withMiddleware()`
- [ ] All middleware groups have the same entries in the same order
- [ ] Use Contracts\Http\Kernel type-hints to ensure version compatibility. followed
- [ ] Migrate kernel configuration in Laravel 10.43+ before upgrading to Laravel 11. followed
- [ ] Keep the old kernel file until migration is fully verified in staging. followed
- [ ] Audit all $kernel->pushMiddleware() calls in service providers before upgrading. followed
- [ ] Do not keep old kernel files indefinitely after migration is complete. followed
- [ ] For packages supporting pre-11 and 11+, detect version via class_exists(). followed
- [ ] Start migration early applied
- [ ] Keep App\Http\Kernel until migration is fully tested applied
- [ ] Replace `App\Http\Kernel` type-hints with `Contracts\Http\Kernel` applied
- [ ] Audit `$kernel->pushMiddleware()` calls in service providers applied
- [ ] Doing Both Kernel Approaches Indefinitely prevented
- [ ] Overriding Framework Kernel prevented
- [ ] Assuming kernel removal means "no kernel" prevented
- [ ] Missing ->withRouting() prevented

---

# Architecture Checklist

- [ ] Configuration gravity shift architecture followed
- [ ] Single configuration entry point architecture followed
- [ ] Framework kernel unchanged architecture followed
- [ ] BC detection architecture followed

---

# Implementation Checklist

- [ ] Use Contracts\Http\Kernel type-hints to ensure version compatibility. followed
- [ ] Migrate kernel configuration in Laravel 10.43+ before upgrading to Laravel 11. followed
- [ ] Keep the old kernel file until migration is fully verified in staging. followed
- [ ] Audit all $kernel->pushMiddleware() calls in service providers before upgrading. followed
- [ ] Do not keep old kernel files indefinitely after migration is complete. followed
- [ ] Start migration early applied
- [ ] Keep App\Http\Kernel until migration is fully tested applied
- [ ] Replace `App\Http\Kernel` type-hints with `Contracts\Http\Kernel` applied
- [ ] Audit `$kernel->pushMiddleware()` calls in service providers applied
- [ ] Assuming kernel removal means "no kernel" prevented
- [ ] Missing ->withRouting() prevented
- [ ] Forgetting use statements prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Doing Both Kernel Approaches Indefinitely prevented
- [ ] Overriding Framework Kernel prevented
- [ ] Vendor-Patching Kernel Files prevented
- [ ] Partial Migration in Production prevented
- [ ] Assuming Kernel Removal Means "No Kernel" prevented
- [ ] Use Contracts\Http\Kernel type-hints to ensure version compatibility. followed
- [ ] Migrate kernel configuration in Laravel 10.43+ before upgrading to Laravel 11. followed
- [ ] Keep the old kernel file until migration is fully verified in staging. followed
- [ ] Audit all $kernel->pushMiddleware() calls in service providers before upgrading. followed
- [ ] Do not keep old kernel files indefinitely after migration is complete. followed
- [ ] For packages supporting pre-11 and 11+, detect version via class_exists(). followed

---

# Testing Checklist

- [ ] `php artisan route:list -v` output matches pre-migration baseline for every route
- [ ] All global middleware entries are present in `->withMiddleware()`
- [ ] All middleware groups have the same entries in the same order
- [ ] All route middleware aliases resolve to the same classes
- [ ] Compare Laravel 10 and Laravel 11 skeleton projects â€” identify the kernel structure differences
- [ ] Migrate a middleware configuration from kernel property to `withMiddleware()` syntax
- [ ] Verify BC layer works: keep old kernel file while adding ApplicationBuilder config
- [ ] Remove old kernel file and confirm ApplicationBuilder config is picked up
- [ ] All middleware, command, and schedule configurations are migrated to bootstrap/app.php
- [ ] php artisan route:list -v output is identical before and after migration (pure migration, no changes)
- [ ] All Artisan commands are available and functional
- [ ] Legacy kernel files are deleted after verified staging deployment

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Doing Both Kernel Approaches Indefinitely prevented
- [ ] Overriding Framework Kernel prevented
- [ ] Vendor-Patching Kernel Files prevented
- [ ] Partial Migration in Production prevented
- [ ] Assuming Kernel Removal Means "No Kernel" prevented

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

- **HTTP Kernel Internals** â€” understanding the pipeline, middleware, and bootstrapper mechanics being evolved
- **Console Kernel Internals** â€” the console counterpart affected by the same version changes
- **Service Container** â€” how `ApplicationBuilder` binds configuration into the container
- **Legacy Kernel Migration** â€” practical step-by-step migration from kernel properties to ApplicationBuilder
- **Application Structure (Skeleton)** â€” how `bootstrap/app.php` replaces `app/Http/Kernel.php` in new projects
- **Upgrade Guides (10â†’11, 11â†’12)** â€” official Laravel upgrade paths and breaking changes

---


