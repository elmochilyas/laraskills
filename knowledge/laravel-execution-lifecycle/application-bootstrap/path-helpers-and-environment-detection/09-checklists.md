# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Path Helpers And Environment Detection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `basePath()` returns the correct absolute filesystem path
- [ ] `storagePath()` points to a writable directory in the current deployment
- [ ] `runningInConsole()` returns correct boolean for current SAPI
- [ ] Path overrides are called in `register()` not `boot()` (before `LoadConfiguration`)
- [ ] `basePath` is passed to `Application::configure()` when the entire root moves
- [ ] `storage_path()` in the customized layout is writable (verify with `is_writable()`)
- [ ] Always use path helpers instead of hardcoded absolute filesystem paths. followed
- [ ] Prefer runningUnitTests() over APP_ENV === 'testing' for test context detection. followed
- [ ] Never use app_path() or other application path helpers in package code. followed
- [ ] Customize application paths early â€” in a service provider's register() method before configuration loads. followed
- [ ] Never use path helpers inside config/.php files when config:cache is in use. followed
- [ ] Always verify storage_path() writability before performing filesystem operations. followed
- [ ] Customize paths early applied
- [ ] Use `runningUnitTests()` over `APP_ENV=testing` alone applied
- [ ] Cache `getNamespace()` result applied
- [ ] Use descriptive environment names applied
- [ ] Hardcoded Absolute Filesystem Paths prevented
- [ ] Global Environment Override at Runtime prevented
- [ ] Using app_path() in package code prevented
- [ ] Relying on environment() before config loads prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use path helpers instead of hardcoded absolute filesystem paths. followed
- [ ] Prefer runningUnitTests() over APP_ENV === 'testing' for test context detection. followed
- [ ] Never use app_path() or other application path helpers in package code. followed
- [ ] Customize application paths early â€” in a service provider's register() method before configuration loads. followed
- [ ] Never use path helpers inside config/.php files when config:cache is in use. followed
- [ ] Customize paths early applied
- [ ] Use `runningUnitTests()` over `APP_ENV=testing` alone applied
- [ ] Cache `getNamespace()` result applied
- [ ] Use descriptive environment names applied
- [ ] Using app_path() in package code prevented
- [ ] Relying on environment() before config loads prevented
- [ ] Confusing runningInConsole() with runningUnitTests() prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Hardcoded Absolute Filesystem Paths prevented
- [ ] Global Environment Override at Runtime prevented
- [ ] Path-Dependent Logic in Config Files prevented
- [ ] Namespace Hardcoding prevented
- [ ] Confusing runningInConsole() with runningUnitTests() prevented
- [ ] Always use path helpers instead of hardcoded absolute filesystem paths. followed
- [ ] Prefer runningUnitTests() over APP_ENV === 'testing' for test context detection. followed
- [ ] Never use app_path() or other application path helpers in package code. followed
- [ ] Customize application paths early â€” in a service provider's register() method before configuration loads. followed
- [ ] Never use path helpers inside config/.php files when config:cache is in use. followed
- [ ] Always verify storage_path() writability before performing filesystem operations. followed

---

# Testing Checklist

- [ ] Path overrides are called in `register()` not `boot()` (before `LoadConfiguration`)
- [ ] `basePath` is passed to `Application::configure()` when the entire root moves
- [ ] `storage_path()` in the customized layout is writable (verify with `is_writable()`)
- [ ] Config files do not hardcode paths that will be stale after path customization
- [ ] `basePath()` returns the correct absolute filesystem path
- [ ] `storagePath()` points to a writable directory in the current deployment
- [ ] `runningInConsole()` returns correct boolean for current SAPI
- [ ] `runningUnitTests()` returns `true` during PHPUnit/Pest runs, `false` otherwise
- [ ] All path helpers return the correct custom paths for the deployment layout
- [ ] Storage directory is writable and used by all filesystem operations
- [ ] Config files resolve correct paths at runtime (not stale build-time paths)
- [ ] Application works identically with and without config:cache

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Hardcoded Absolute Filesystem Paths prevented
- [ ] Global Environment Override at Runtime prevented
- [ ] Path-Dependent Logic in Config Files prevented
- [ ] Namespace Hardcoding prevented
- [ ] Confusing runningInConsole() with runningUnitTests() prevented

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
- [Base Bindings and Core Aliases](./base-bindings-and-core-aliases/02-knowledge-unit.md)
- [Bootstrapper Sequence](./bootstrapper-sequence/02-knowledge-unit.md)
- [Bootstrap App PHP File](./bootstrap-app-php-file/02-knowledge-unit.md)
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md)

---


