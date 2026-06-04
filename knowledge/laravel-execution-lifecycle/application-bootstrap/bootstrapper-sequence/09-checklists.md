# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Bootstrapper Sequence
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `LoadEnvironmentVariables` runs first and loads `.env` correctly
- [ ] `LoadConfiguration` runs second and populates config repository
- [ ] `HandleExceptions` registers error/exception handlers successfully
- [ ] Source of the error identified by bootstrapper phase
- [ ] Config-dependent code moved from `register()` to `boot()` in the affected provider
- [ ] `env()` helper replaced with `config()` in all application code
- [ ] Place all config-dependent logic in boot() not register(). followed
- [ ] Never modify the kernel's $bootstrappers array. followed
- [ ] Never call env() helper in application code after php artisan config:cache. followed
- [ ] Implement DeferrableProvider on service providers that only register bindings and have no boot() logic. followed
- [ ] Never call bootstrapWith() a second time without calling reset() first. followed
- [ ] Always run `php artisan config:cache` in production applied
- [ ] Defer providers that only bind applied
- [ ] Place config-dependent logic in `boot()` not `register()` applied
- [ ] Monitor boot time per provider applied
- [ ] Bootstrapper Manipulation prevented
- [ ] Eager Resolution in Bootstrappers prevented
- [ ] Accessing config() in provider register() prevented
- [ ] Adding bootstrappers to kernel array prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Place all config-dependent logic in boot() not register(). followed
- [ ] Never modify the kernel's $bootstrappers array. followed
- [ ] Never call env() helper in application code after php artisan config:cache. followed
- [ ] Implement DeferrableProvider on service providers that only register bindings and have no boot() logic. followed
- [ ] Never call bootstrapWith() a second time without calling reset() first. followed
- [ ] Always run `php artisan config:cache` in production applied
- [ ] Defer providers that only bind applied
- [ ] Place config-dependent logic in `boot()` not `register()` applied
- [ ] Monitor boot time per provider applied
- [ ] Accessing config() in provider register() prevented
- [ ] Adding bootstrappers to kernel array prevented
- [ ] Ignoring HandleExceptions impact prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Bootstrapper Manipulation prevented
- [ ] Eager Resolution in Bootstrappers prevented
- [ ] Stateful Bootstrappers prevented
- [ ] Config-Dependent env() Calls prevented
- [ ] Accessing Config in register() Before Providers Boot prevented
- [ ] Place all config-dependent logic in boot() not register(). followed
- [ ] Never modify the kernel's $bootstrappers array. followed
- [ ] Never call env() helper in application code after php artisan config:cache. followed
- [ ] Implement DeferrableProvider on service providers that only register bindings and have no boot() logic. followed
- [ ] Never call bootstrapWith() a second time without calling reset() first. followed

---

# Testing Checklist

- [ ] Source of the error identified by bootstrapper phase
- [ ] Config-dependent code moved from `register()` to `boot()` in the affected provider
- [ ] `env()` helper replaced with `config()` in all application code
- [ ] Facade usage before `RegisterFacades` replaced with `$app->make()` using contract class
- [ ] `LoadEnvironmentVariables` runs first and loads `.env` correctly
- [ ] `LoadConfiguration` runs second and populates config repository
- [ ] `HandleExceptions` registers error/exception handlers successfully
- [ ] `RegisterFacades` loads facade aliases from config
- [ ] Config-dependent code executes during the correct phase and reads the correct values
- [ ] config() is used instead of env() in all application code
- [ ] No BindingResolutionException caused by bootstrap-order violations
- [ ] The fix works identically with and without config:cache

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Bootstrapper Manipulation prevented
- [ ] Eager Resolution in Bootstrappers prevented
- [ ] Stateful Bootstrappers prevented
- [ ] Config-Dependent env() Calls prevented
- [ ] Accessing Config in register() Before Providers Boot prevented

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

- [Application Class Construction](./application-class-construction/02-knowledge-unit.md)
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md)
- [Kernel HTTP / Console] â€” where the `$bootstrappers` array is defined.
- [Service Provider Lifecycle] â€” the two-phase register/boot mechanism.
- [Bootstrap App PHP File](./bootstrap-app-php-file/02-knowledge-unit.md)

---


