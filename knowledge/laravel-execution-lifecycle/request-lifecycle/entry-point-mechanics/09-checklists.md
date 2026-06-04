# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Entry Point Mechanics
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Able to trace the exact sequence from `public/index.php` through `bootstrap/app.php` to kernel dispatch
- [ ] Understand why `runningInConsole()` is checked rather than URL
- [ ] Can identify which bootstrappers run and in what order
- [ ] `composer dump-autoload -o` or `--optimize-autoloader` flag is present in deployment script
- [ ] `config:cache`, `route:cache`, `event:cache` run in deployment (unless dynamic config is required)
- [ ] `php -l bootstrap/app.php` passes in deployment pipeline
- [ ] Cache aggressively in production applied
- [ ] Keep the entry point lean applied
- [ ] Use ApplicationBuilder for configuration applied
- [ ] Run `composer dump-autoload -o` in CI/CD applied
- [ ] Application Logic in public/index.php or bootstrap/app.php prevented
- [ ] Skipping Configuration and Route Caching in Production prevented
- [ ] Adding logic in public/index.php prevented
- [ ] Code in bootstrap/app.php before container is ready prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Cache aggressively in production applied
- [ ] Keep the entry point lean applied
- [ ] Use ApplicationBuilder for configuration applied
- [ ] Run `composer dump-autoload -o` in CI/CD applied
- [ ] Verify `bootstrap/app.php` syntax on deploy applied
- [ ] Adding logic in public/index.php prevented
- [ ] Code in bootstrap/app.php before container is ready prevented
- [ ] Skipping composer dump-autoload -o in production prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Application Logic in public/index.php or bootstrap/app.php prevented
- [ ] Skipping Configuration and Route Caching in Production prevented
- [ ] Skipping Optimized Autoloader in Deployment prevented
- [ ] Direct Application Instantiation Outside Entry Point prevented
- [ ] Captured Mutable State in bootstrap/app.php Closures (Octane) prevented

---

# Testing Checklist

- [ ] `composer dump-autoload -o` or `--optimize-autoloader` flag is present in deployment script
- [ ] `config:cache`, `route:cache`, `event:cache` run in deployment (unless dynamic config is required)
- [ ] `php -l bootstrap/app.php` passes in deployment pipeline
- [ ] Bootstrap duration is under 5ms in production with caches enabled
- [ ] Able to trace the exact sequence from `public/index.php` through `bootstrap/app.php` to kernel dispatch
- [ ] Understand why `runningInConsole()` is checked rather than URL
- [ ] Can identify which bootstrappers run and in what order
- [ ] Can explain how Octane changes the entry point lifecycle

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Application Logic in public/index.php or bootstrap/app.php prevented
- [ ] Skipping Configuration and Route Caching in Production prevented
- [ ] Skipping Optimized Autoloader in Deployment prevented
- [ ] Direct Application Instantiation Outside Entry Point prevented
- [ ] Captured Mutable State in bootstrap/app.php Closures (Octane) prevented

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

- (none â€” this is the entry point to the entire hierarchy)
- HTTP Kernel Dispatch (immediate next step after entry point)
- Console Kernel Dispatch (alternate dispatch path)
- Application Bootstrap (the Application class internals initialized in `bootstrap/app.php`)
- Boot Order & Timing (the bootstrapper sequence triggered by kernel dispatch)

---


