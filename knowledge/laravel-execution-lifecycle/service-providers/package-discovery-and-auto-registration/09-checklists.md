# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Package Discovery And Auto Registration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain how `PackageManifest` discovers and caches providers
- [ ] Understand how `dont-discover` works and when to use it
- [ ] Know that discovered providers append after manual providers
- [ ] Package `composer.json` contains `extra.laravel.providers` array
- [ ] `bootstrap/cache/packages.php` includes the package entry with its providers
- [ ] Provider appears in `php artisan about` output
- [ ] Run `php artisan optimize` during deployment applied
- [ ] Use `dont-discover` for development-only packages applied
- [ ] Never manually edit `bootstrap/cache/packages.php` applied
- [ ] Verify discovered provider list applied
- [ ] Duplicate Registration prevented
- [ ] No Cache After Deploy prevented
- [ ] Manually adding discovered provider to bootstrap/providers.php prevented
- [ ] Not regenerating cache after removing package prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Run `php artisan optimize` during deployment applied
- [ ] Use `dont-discover` for development-only packages applied
- [ ] Never manually edit `bootstrap/cache/packages.php` applied
- [ ] Verify discovered provider list applied
- [ ] Manually adding discovered provider to bootstrap/providers.php prevented
- [ ] Not regenerating cache after removing package prevented
- [ ] Expecting dont-discover wildcards prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Duplicate Registration prevented
- [ ] No Cache After Deploy prevented
- [ ] Ignoring Discovered Aliases prevented
- [ ] Manually Adding Discovered Provider prevented
- [ ] Stale Cache After Package Removal prevented

---

# Testing Checklist

- [ ] Package `composer.json` contains `extra.laravel.providers` array
- [ ] `bootstrap/cache/packages.php` includes the package entry with its providers
- [ ] Provider appears in `php artisan about` output
- [ ] Package services are available via container resolution
- [ ] Can explain how `PackageManifest` discovers and caches providers
- [ ] Understand how `dont-discover` works and when to use it
- [ ] Know that discovered providers append after manual providers
- [ ] Can diagnose stale cache issues after package add/remove
- [ ] New package's provider appears in the discovered provider list.
- [ ] All package services are available after installation.
- [ ] No duplicate or missing provider entries.
- [ ] Package works correctly in all environments.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Duplicate Registration prevented
- [ ] No Cache After Deploy prevented
- [ ] Ignoring Discovered Aliases prevented
- [ ] Manually Adding Discovered Provider prevented
- [ ] Stale Cache After Package Removal prevented

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

- provider-fundamentals (provider registration flow)
- Composer autoloading basics (vendor/composer/installed.json structure)
- Application Bootstrap (how discovered providers merge with bootstrap/providers.php)
- eager-providers (discovered providers are eager by default)
- environment-specific-providers (dont-discover for dev-only packages)
- deferred-providers (discovered packages that implement DeferrableProvider)

---


